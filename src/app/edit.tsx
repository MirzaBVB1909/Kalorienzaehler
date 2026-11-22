import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chips, confirm, Field, fmt, parseNum } from '../components/ui';
import { FOODS } from '../lib/foods';
import { formatDateLabel, Macros, Meal, MEALS, round1, scaleMacros } from '../lib/nutrition';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';

const MEAL_OPTIONS = MEALS.map((m) => ({ key: m.key, label: m.label }));

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, customFoods, favorites, updateEntry, removeEntry, toggleFavorite } = useStore();
  const entry = entries.find((e) => e.id === id);
  const food = useMemo(
    () => (entry?.foodId ? [...customFoods, ...FOODS].find((f) => f.id === entry.foodId) : undefined),
    [entry?.foodId, customFoods],
  );

  const [meal, setMeal] = useState<Meal>(entry?.meal ?? 'snack');
  const [gramsText, setGramsText] = useState(entry?.grams != null ? String(entry.grams) : '');
  const [name, setName] = useState(entry?.name ?? '');
  const [kcal, setKcal] = useState(entry ? String(entry.kcal) : '');
  const [protein, setProtein] = useState(entry ? fmt(entry.protein) : '');
  const [carbs, setCarbs] = useState(entry ? fmt(entry.carbs) : '');
  const [fat, setFat] = useState(entry ? fmt(entry.fat) : '');

  if (!entry) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ color: colors.muted }}>Dieser Eintrag existiert nicht mehr.</Text>
        <Button title="Zurück" variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const unit = entry.unit ?? 'g';
  const hasAmount = entry.grams != null && entry.grams > 0;
  const grams = parseNum(gramsText);

  // Neue Nährwerte: aus dem Lebensmittel (genau) oder proportional zum bisherigen Eintrag.
  let preview: Macros;
  if (hasAmount) {
    const g = grams > 0 ? grams : 0;
    preview = food
      ? scaleMacros(food, g)
      : {
          kcal: Math.round((entry.kcal * g) / entry.grams!),
          protein: round1((entry.protein * g) / entry.grams!),
          carbs: round1((entry.carbs * g) / entry.grams!),
          fat: round1((entry.fat * g) / entry.grams!),
        };
  } else {
    const opt = (s: string) => (s.trim() ? Math.max(0, parseNum(s) || 0) : 0);
    preview = { kcal: Math.round(Math.max(0, parseNum(kcal) || 0)), protein: opt(protein), carbs: opt(carbs), fat: opt(fat) };
  }

  const valid = hasAmount ? grams > 0 : parseNum(kcal) >= 0;
  const isFavorite = entry.foodId ? favorites.includes(entry.foodId) : false;

  const save = () => {
    updateEntry(entry.id, {
      ...preview,
      meal,
      ...(hasAmount ? { grams: Math.round(grams * 10) / 10 } : { name: name.trim() || 'Schnelleintrag' }),
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Eintrag bearbeiten' }} />
      <Card>
        <Text style={styles.title}>{entry.name}</Text>
        <Text style={styles.meta}>{formatDateLabel(entry.date)}</Text>

        {hasAmount ? (
          <View style={{ marginTop: 16 }}>
            <Field label="Menge" suffix={unit} value={gramsText} onChangeText={setGramsText} keyboardType="decimal-pad" selectTextOnFocus />
          </View>
        ) : (
          <View style={{ marginTop: 16, gap: 12 }}>
            <Field label="Bezeichnung" value={name} onChangeText={setName} />
            <Field label="Kalorien" suffix="kcal" value={kcal} onChangeText={setKcal} keyboardType="number-pad" />
            <View style={styles.row3}>
              <Field label="Eiweiß" suffix="g" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
              <Field label="Kohlenh." suffix="g" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
              <Field label="Fett" suffix="g" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
            </View>
          </View>
        )}

        <View style={styles.bigWrap}>
          <Text style={styles.big}>{preview.kcal}</Text>
          <Text style={styles.meta}>
            kcal · E {fmt(preview.protein)} g · K {fmt(preview.carbs)} g · F {fmt(preview.fat)} g
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Mahlzeit</Text>
        <Chips options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      </Card>

      <Button title="Speichern" disabled={!valid} onPress={save} />
      {entry.foodId && (
        <Button
          title={isFavorite ? '★ Aus Favoriten entfernen' : '☆ Zu Favoriten hinzufügen'}
          variant="secondary"
          onPress={() => toggleFavorite(entry.foodId!)}
          style={{ marginTop: 12 }}
        />
      )}
      <Button
        title="Eintrag löschen"
        variant="danger"
        onPress={() =>
          confirm('Eintrag löschen?', `„${entry.name}“ wird entfernt.`, () => {
            removeEntry(entry.id);
            router.back();
          })
        }
        style={{ marginTop: 12, marginBottom: 32 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  bigWrap: { alignItems: 'center', marginTop: 20 },
  big: { fontSize: 44, fontWeight: '800', color: colors.primary },
  row3: { flexDirection: 'row', gap: 10 },
});
