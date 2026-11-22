import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Chips, confirm, Field, parseNum, SectionTitle } from '../../components/ui';
import {
  ACTIVITIES,
  Activity,
  bmi,
  bmr,
  calculatedKcal,
  dailyTargets,
  Goal,
  GOALS,
  Sex,
  tdee,
} from '../../lib/nutrition';
import { exportBackup, exportCsv, pickBackup } from '../../lib/backup';
import { useStore } from '../../lib/store';
import { colors, getThemePref, setThemePref, ThemePref } from '../../lib/theme';

export default function ProfileScreen() {
  const store = useStore();
  const { profile, updateProfile, logWeight, resetAll, replaceAll } = store;
  const [targetW, setTargetW] = useState(profile.targetWeightKg ? String(profile.targetWeightKg).replace('.', ',') : '');
  const [waterGoal, setWaterGoal] = useState(String((profile.waterGoalMl || 2000) / 1000).replace('.', ','));
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [age, setAge] = useState(String(profile.age));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [weight, setWeight] = useState(String(profile.weightKg).replace('.', ','));
  const [custom, setCustom] = useState(profile.customKcal ? String(profile.customKcal) : '');

  // Nach dem Laden aus dem Speicher (oder Reset) Eingabefelder synchronisieren.
  useEffect(() => {
    setAge(String(profile.age));
    setHeight(String(profile.heightCm));
    setWeight(String(profile.weightKg).replace('.', ','));
    setCustom(profile.customKcal ? String(profile.customKcal) : '');
    setTargetW(profile.targetWeightKg ? String(profile.targetWeightKg).replace('.', ',') : '');
    setWaterGoal(String((profile.waterGoalMl || 2000) / 1000).replace('.', ','));
  }, [profile.age, profile.heightCm, profile.weightKg, profile.customKcal, profile.targetWeightKg, profile.waterGoalMl]);

  const snapshot = () => ({
    entries: store.entries,
    profile: store.profile,
    customFoods: store.customFoods,
    weights: store.weights,
    favorites: store.favorites,
    water: store.water,
    shopping: store.shopping,
    offers: store.offers,
    recipePrefs: store.recipePrefs,
    dietRules: store.dietRules,
    budgets: store.budgets,
  });

  const runExport = async (kind: 'backup' | 'csv') => {
    try {
      const res = kind === 'backup' ? await exportBackup(snapshot()) : await exportCsv(snapshot());
      if (res === 'downloaded') setBackupMsg('✅ Datei wurde heruntergeladen (Ordner „Downloads“ bzw. „Dateien“).');
      else if (res === 'shared') setBackupMsg('✅ Datei wurde geteilt bzw. gespeichert.');
      else setBackupMsg(null);
    } catch {
      setBackupMsg('❌ Export hat nicht geklappt. Bitte nochmal versuchen.');
    }
  };

  const runRestore = async () => {
    try {
      const data = await pickBackup();
      if (!data) return;
      confirm(
        'Sicherung wiederherstellen?',
        `Die Sicherung enthält ${data.entries.length} Einträge. Deine aktuellen Daten in der App werden dadurch ersetzt.`,
        () => {
          replaceAll(data);
          setBackupMsg(`✅ Sicherung wiederhergestellt (${data.entries.length} Einträge).`);
        },
        'Wiederherstellen',
      );
    } catch (err) {
      setBackupMsg(`❌ ${(err as Error).message}`);
    }
  };

  const commitNumber = (text: string, min: number, max: number, apply: (n: number) => void, reset: () => void) => {
    const n = parseNum(text);
    if (n >= min && n <= max) apply(n);
    else reset();
  };

  const targets = dailyTargets(profile);
  const bmiValue = bmi(profile);
  const bmiLabel = bmiValue < 18.5 ? 'Untergewicht' : bmiValue < 25 ? 'Normalgewicht' : bmiValue < 30 ? 'Übergewicht' : 'Adipositas';

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card style={{ backgroundColor: colors.primary }}>
        <Text style={styles.heroLabel}>Dein Tagesziel</Text>
        <Text style={styles.heroNum}>{targets.kcal} kcal</Text>
        <Text style={styles.heroMacros}>
          Eiweiß {targets.protein} g · Kohlenhydrate {targets.carbs} g · Fett {targets.fat} g
        </Text>
      </Card>

      <Card>
        <SectionTitle>Körperdaten</SectionTitle>
        <Chips<Sex>
          options={[
            { key: 'male', label: 'Männlich' },
            { key: 'female', label: 'Weiblich' },
          ]}
          value={profile.sex}
          onChange={(sex) => updateProfile({ sex })}
        />
        <View style={styles.row}>
          <Field
            label="Alter"
            suffix="J."
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            onBlur={() => commitNumber(age, 12, 110, (n) => updateProfile({ age: Math.round(n) }), () => setAge(String(profile.age)))}
          />
          <Field
            label="Größe"
            suffix="cm"
            value={height}
            onChangeText={setHeight}
            keyboardType="number-pad"
            onBlur={() =>
              commitNumber(height, 100, 250, (n) => updateProfile({ heightCm: Math.round(n) }), () => setHeight(String(profile.heightCm)))
            }
          />
        </View>
        <View style={styles.row}>
          <Field
            label="Gewicht"
            suffix="kg"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            onBlur={() =>
              commitNumber(
                weight,
                30,
                400,
                (n) => updateProfile({ weightKg: Math.round(n * 10) / 10 }),
                () => setWeight(String(profile.weightKg).replace('.', ',')),
              )
            }
          />
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Button
              title="Gewicht loggen"
              variant="secondary"
              onPress={() => {
                const n = parseNum(weight);
                if (n >= 30 && n <= 400) logWeight(Math.round(n * 10) / 10);
              }}
            />
          </View>
        </View>
        <Text style={styles.info}>
          BMI {bmiValue.toFixed(1).replace('.', ',')} ({bmiLabel})
        </Text>
      </Card>

      <Card>
        <SectionTitle>Aktivität</SectionTitle>
        <Chips<Activity>
          options={ACTIVITIES.map((a) => ({ key: a.key, label: a.label }))}
          value={profile.activity}
          onChange={(activity) => updateProfile({ activity })}
        />
      </Card>

      <Card>
        <SectionTitle>Ziel</SectionTitle>
        <Chips<Goal> options={GOALS.map((g) => ({ key: g.key, label: g.label }))} value={profile.goal} onChange={(goal) => updateProfile({ goal })} />
        <View style={styles.calc}>
          <CalcRow label="Grundumsatz" value={Math.round(bmr(profile))} />
          <CalcRow label="Gesamtumsatz" value={Math.round(tdee(profile))} />
          <CalcRow label="Empfohlen für dein Ziel" value={calculatedKcal(profile)} bold />
        </View>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <SectionTitle>Eigenes Kalorienziel</SectionTitle>
          <Switch
            value={profile.customKcal != null}
            onValueChange={(on) => updateProfile({ customKcal: on ? calculatedKcal(profile) : null })}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {profile.customKcal != null && (
          <Field
            label="Kalorien pro Tag"
            suffix="kcal"
            value={custom}
            onChangeText={setCustom}
            keyboardType="number-pad"
            onBlur={() =>
              commitNumber(custom, 800, 10000, (n) => updateProfile({ customKcal: Math.round(n) }), () => setCustom(String(profile.customKcal)))
            }
          />
        )}
      </Card>

      <Card>
        <SectionTitle>Wasser & Zielgewicht</SectionTitle>
        <View style={styles.row}>
          <Field
            label="Wasser pro Tag"
            suffix="l"
            value={waterGoal}
            onChangeText={setWaterGoal}
            keyboardType="decimal-pad"
            onBlur={() =>
              commitNumber(
                waterGoal,
                0.5,
                6,
                (n) => updateProfile({ waterGoalMl: Math.round(n * 1000) }),
                () => setWaterGoal(String((profile.waterGoalMl || 2000) / 1000).replace('.', ',')),
              )
            }
          />
          <Field
            label="Zielgewicht (optional)"
            suffix="kg"
            value={targetW}
            onChangeText={setTargetW}
            keyboardType="decimal-pad"
            placeholder="–"
            onBlur={() => {
              if (!targetW.trim()) return updateProfile({ targetWeightKg: null });
              commitNumber(
                targetW,
                30,
                400,
                (n) => updateProfile({ targetWeightKg: Math.round(n * 10) / 10 }),
                () => setTargetW(profile.targetWeightKg ? String(profile.targetWeightKg).replace('.', ',') : ''),
              );
            }}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle>Darstellung</SectionTitle>
        {Platform.OS === 'web' ? (
          <Chips<ThemePref>
            options={[
              { key: 'auto', label: '📱 Wie das Handy' },
              { key: 'light', label: '☀️ Hell' },
              { key: 'dark', label: '🌙 Dunkel' },
            ]}
            value={getThemePref()}
            onChange={(p) => setThemePref(p)}
          />
        ) : (
          <Text style={styles.info}>Die App folgt der Hell-/Dunkel-Einstellung deines Handys.</Text>
        )}
      </Card>

      <Card>
        <SectionTitle>💾 Daten exportieren & sichern</SectionTitle>
        <Text style={styles.backupText}>
          Deine Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig, z. B. in iCloud Drive („In Dateien sichern“) – dann kannst du sie
          jederzeit oder auf einem neuen Handy wiederherstellen.
        </Text>
        <Button title="Sicherung erstellen (alle Daten)" onPress={() => runExport('backup')} />
        <Button title="Tagebuch als Tabelle (Excel/CSV)" variant="secondary" onPress={() => runExport('csv')} style={{ marginTop: 10 }} />
        <Button title="Sicherung wiederherstellen" variant="secondary" onPress={runRestore} style={{ marginTop: 10 }} />
        {backupMsg && <Text style={[styles.backupText, { marginTop: 12, marginBottom: 0 }]}>{backupMsg}</Text>}
      </Card>

      <Button
        title="Alle Daten löschen"
        variant="danger"
        onPress={() => confirm('Alle Daten löschen?', 'Tagebuch, Profil, eigene Lebensmittel und Gewichtsverlauf werden unwiderruflich gelöscht.', resetAll)}
        style={{ marginBottom: 24 }}
      />
      <Text style={styles.disclaimer}>
        Die Berechnung nutzt die Mifflin-St-Jeor-Formel und dient nur als Orientierung. Für medizinische Fragen wende dich an eine Fachperson.
      </Text>
    </ScrollView>
  );
}

function CalcRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.calcRow}>
      <Text style={[styles.calcLabel, bold && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      <Text style={[styles.calcValue, bold && { color: colors.primary }]}>{value} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroLabel: { color: '#DCFCE7', fontSize: 14 },
  heroNum: { color: '#fff', fontSize: 34, fontWeight: '800', marginVertical: 4 },
  heroMacros: { color: '#DCFCE7', fontSize: 13 },
  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  info: { color: colors.muted, marginTop: 12, fontSize: 13 },
  calc: { marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 8 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  calcLabel: { color: colors.muted, fontSize: 14 },
  calcValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backupText: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  disclaimer: { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 32, lineHeight: 17 },
});
