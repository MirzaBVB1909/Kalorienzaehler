import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AiAnalysis, AiItem, AiMode, analyzePhoto, getAiCode, Photo, setAiCode, takePhoto } from '../lib/ai';
import type { Food } from '../lib/foods';
import { Macros, Meal, MEALS, round1 } from '../lib/nutrition';
import { colors } from '../lib/theme';
import { Button, Card, Chips, Field, fmt, parseNum } from './ui';

const MEAL_OPTIONS = MEALS.map((m) => ({ key: m.key, label: m.label }));

export type NewEntry = Macros & { name: string; grams: number; unit: 'g' | 'ml' };

type Row = { item: AiItem; gramsText: string; include: boolean };

function scaled(item: AiItem, grams: number): Macros {
  const f = item.grams > 0 ? grams / item.grams : 0;
  return {
    kcal: Math.round(item.kcal * f),
    protein: round1(item.protein * f),
    carbs: round1(item.carbs * f),
    fat: round1(item.fat * f),
  };
}

export default function PhotoPanel({
  mode,
  meal,
  setMeal,
  onAddEntries,
  onSaveFood,
}: {
  mode: AiMode;
  meal: Meal;
  setMeal: (m: Meal) => void;
  onAddEntries: (entries: NewEntry[]) => void;
  onSaveFood: (food: Omit<Food, 'id'>) => void;
}) {
  const [code, setCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [needCode, setNeedCode] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiAnalysis | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    getAiCode().then((c) => {
      setCode(c);
      setCodeInput(c);
    });
  }, []);

  // Moduswechsel (Essen ↔ Etikett) setzt das Ergebnis zurück.
  useEffect(() => {
    setPhoto(null);
    setResult(null);
    setRows([]);
    setError(null);
  }, [mode]);

  const run = async (p: Photo, accessCode = code) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzePhoto(p, mode, accessCode);
      setResult(analysis);
      setRows(
        analysis.items.map((item) => ({
          item,
          gramsText: String(Math.round(analysis.kind === 'label' ? item.portion_grams || item.grams : item.grams)),
          include: true,
        })),
      );
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === 'unauthorized') setNeedCode(true);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pick = async () => {
    try {
      const p = await takePhoto();
      if (!p) return;
      setPhoto(p);
      await run(p);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const saveCode = async () => {
    await setAiCode(codeInput);
    setCode(codeInput.trim());
    setNeedCode(false);
    if (photo) await run(photo, codeInput.trim());
  };

  const chosen = rows
    .filter((r) => r.include && parseNum(r.gramsText) > 0)
    .map((r) => {
      const g = parseNum(r.gramsText);
      return { name: r.item.name, grams: Math.round(g), unit: r.item.unit, ...scaled(r.item, g) };
    });
  const totalKcal = chosen.reduce((s, e) => s + e.kcal, 0);
  const isLabel = result?.kind === 'label';

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      {!photo && !loading && (
        <Card>
          <Text style={styles.title}>{mode === 'meal' ? '📸 Essen fotografieren' : '🏷️ Nährwert-Etikett fotografieren'}</Text>
          <Text style={styles.text}>
            {mode === 'meal'
              ? 'Mach ein Foto von deinem Teller – möglichst von schräg oben, mit dem ganzen Teller im Bild. Die KI erkennt die Bestandteile und schätzt Mengen und Kalorien.'
              : 'Fotografiere die Nährwerttabelle auf der Verpackung, gut lesbar und ohne Spiegelung. Die KI liest die Werte pro 100 g ab.'}
          </Text>
          <Button title="Foto aufnehmen" onPress={pick} />
        </Card>
      )}

      {photo && (
        <View style={styles.previewWrap}>
          <Image source={{ uri: photo.previewUri }} style={styles.preview} resizeMode="cover" />
          {loading && (
            <View style={styles.overlay}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.overlayText}>KI analysiert das Foto …</Text>
            </View>
          )}
        </View>
      )}

      {needCode && (
        <Card>
          <Text style={styles.text}>
            Für die KI-Erkennung ist ein Zugangscode eingerichtet. Bitte einmalig eingeben – er wird nur auf diesem Gerät gespeichert.
          </Text>
          <Field label="Zugangscode" value={codeInput} onChangeText={setCodeInput} secureTextEntry autoCapitalize="none" />
          <Button title="Code speichern" variant="secondary" disabled={!codeInput.trim()} onPress={saveCode} style={{ marginTop: 10 }} />
        </Card>
      )}

      {error && (
        <Card>
          <Text style={[styles.text, { color: colors.danger, marginBottom: 12 }]}>⚠️ {error}</Text>
          <Button title="Neues Foto" variant="secondary" onPress={pick} />
        </Card>
      )}

      {result && !result.recognized && (
        <Card>
          <Text style={styles.text}>Auf dem Foto wurde kein Essen bzw. kein Etikett erkannt. {result.note}</Text>
          <Button title="Neues Foto" variant="secondary" onPress={pick} />
        </Card>
      )}

      {result && result.recognized && (
        <>
          <Card>
            <View style={styles.headRow}>
              <Text style={styles.title}>{isLabel ? 'Gelesene Werte' : 'Erkannt'}</Text>
              <Text style={styles.badge}>Sicherheit: {result.confidence}</Text>
            </View>
            {!!result.note && <Text style={[styles.text, { marginBottom: 8 }]}>💡 {result.note}</Text>}
            {rows.map((r, idx) => {
              const g = parseNum(r.gramsText);
              const m = scaled(r.item, g > 0 ? g : 0);
              return (
                <View key={idx} style={[styles.itemRow, !r.include && { opacity: 0.45 }]}>
                  <Pressable
                    accessibilityLabel={r.include ? `${r.item.name} abwählen` : `${r.item.name} auswählen`}
                    onPress={() => setRows((prev) => prev.map((p, i) => (i === idx ? { ...p, include: !p.include } : p)))}
                    style={[styles.check, r.include && styles.checkOn]}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>{r.include ? '✓' : ''}</Text>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{r.item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {m.kcal} kcal · E {fmt(m.protein)} · K {fmt(m.carbs)} · F {fmt(m.fat)}
                    </Text>
                    {isLabel && (
                      <Text style={styles.itemMeta}>
                        pro 100 {r.item.unit}: {Math.round(r.item.kcal)} kcal
                      </Text>
                    )}
                  </View>
                  <View style={{ width: 104 }}>
                    <Field
                      label=""
                      suffix={r.item.unit}
                      value={r.gramsText}
                      onChangeText={(t) => setRows((prev) => prev.map((p, i) => (i === idx ? { ...p, gramsText: t } : p)))}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              );
            })}
            <Text style={styles.total}>Gesamt: {totalKcal} kcal</Text>
            <Text style={styles.hint}>Mengen sind Schätzungen – passe sie an, wenn du es genauer weißt.</Text>
          </Card>

          <Card>
            <Text style={styles.label}>Mahlzeit</Text>
            <Chips options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
          </Card>

          <Button
            title={chosen.length > 1 ? `${chosen.length} Einträge hinzufügen` : 'Hinzufügen'}
            disabled={chosen.length === 0}
            onPress={() => onAddEntries(chosen)}
          />
          {isLabel && rows[0] && (
            <Button
              title="Als eigenes Lebensmittel speichern"
              variant="secondary"
              style={{ marginTop: 10 }}
              onPress={() => {
                const it = rows[0].item;
                const f = it.grams > 0 ? 100 / it.grams : 1;
                onSaveFood({
                  name: it.name,
                  kcal: Math.round(it.kcal * f),
                  protein: round1(it.protein * f),
                  carbs: round1(it.carbs * f),
                  fat: round1(it.fat * f),
                  portion: Math.max(1, Math.round(parseNum(rows[0].gramsText) || it.portion_grams || 100)),
                  portionLabel: '1 Portion',
                  unit: it.unit,
                });
              }}
            />
          )}
          <Button title="Neues Foto" variant="secondary" onPress={pick} style={{ marginTop: 10, marginBottom: 24 }} />
        </>
      )}
      <Text style={styles.footer}>Fotos werden zur Auswertung an Claude (Anthropic) gesendet und nicht in der App gespeichert.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  text: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 14 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 4 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  previewWrap: { height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: colors.card },
  preview: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 12, color: colors.muted },
  itemRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  total: { fontSize: 18, fontWeight: '800', color: colors.primary, marginTop: 12, textAlign: 'right' },
  footer: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 24 },
});
