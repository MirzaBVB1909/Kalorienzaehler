import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Chips, confirm, Field, fmt, parseNum } from '../components/ui';
import { Food, FOODS, isDrink, searchFoods, Unit, unitOf } from '../lib/foods';
import { Meal, MEALS, mealForNow, scaleMacros, toDateKey } from '../lib/nutrition';
import { recentFoodIds, useStore } from '../lib/store';
import { colors } from '../lib/theme';

type Mode = 'search' | 'quick' | 'custom';

const MEAL_OPTIONS = MEALS.map((m) => ({ key: m.key, label: m.label }));

export default function AddScreen() {
  const params = useLocalSearchParams<{ date?: string; meal?: Meal }>();
  const date = params.date ?? toDateKey(new Date());
  const { entries, customFoods, addEntry, addCustomFood, removeCustomFood } = useStore();

  const [mode, setMode] = useState<Mode>('search');
  const [meal, setMeal] = useState<Meal>(params.meal ?? mealForNow());
  const [query, setQuery] = useState('');
  const [drinksOnly, setDrinksOnly] = useState(false);
  const [selected, setSelected] = useState<Food | null>(null);

  const allFoods = useMemo(() => [...customFoods, ...FOODS], [customFoods]);
  const recent = useMemo(
    () =>
      recentFoodIds(entries)
        .map((id) => allFoods.find((f) => f.id === id))
        .filter((f): f is Food => !!f),
    [entries, allFoods],
  );
  const results = useMemo(() => searchFoods(query, customFoods, drinksOnly), [query, customFoods, drinksOnly]);

  if (selected) {
    return (
      <AmountPanel
        food={selected}
        meal={meal}
        setMeal={setMeal}
        onBack={() => setSelected(null)}
        onAdd={(grams) => {
          const m = scaleMacros(selected, grams);
          addEntry({ ...m, date, meal, name: selected.name, grams, unit: unitOf(selected), foodId: selected.id });
          router.back();
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.tabs}>
        {(
          [
            ['search', 'Suchen'],
            ['quick', 'Schnell'],
            ['custom', 'Eigenes'],
          ] as const
        ).map(([key, label]) => (
          <Pressable key={key} onPress={() => setMode(key)} style={[styles.tab, mode === key && styles.tabActive]}>
            <Text style={[styles.tabText, mode === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === 'search' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Essen oder Getränk suchen…"
              placeholderTextColor={colors.muted}
              style={styles.search}
              autoFocus
              autoCorrect={false}
            />
            <View style={{ marginTop: 10 }}>
              <Chips
                options={[
                  { key: 'all', label: 'Alles' },
                  { key: 'drinks', label: '🥤 Getränke' },
                ]}
                value={drinksOnly ? 'drinks' : 'all'}
                onChange={(v) => setDrinksOnly(v === 'drinks')}
              />
            </View>
          </View>
          <FlatList
            data={results}
            keyExtractor={(f) => f.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              !query && !drinksOnly && recent.length > 0 ? (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.listHeader}>Zuletzt verwendet</Text>
                  <View style={styles.recentWrap}>
                    {recent.map((f) => (
                      <Pressable key={f.id} onPress={() => setSelected(f)} style={styles.recentChip}>
                        <Text style={styles.recentText}>{f.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={[styles.listHeader, { marginTop: 16 }]}>Alle Lebensmittel</Text>
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Text style={{ color: colors.muted, marginBottom: 12 }}>Nichts gefunden für „{query}“.</Text>
                <Button title="Als eigenes Lebensmittel anlegen" variant="secondary" onPress={() => setMode('custom')} />
              </View>
            }
            renderItem={({ item }) => {
              const isCustom = item.id.startsWith('custom-');
              return (
                <Pressable
                  onPress={() => setSelected(item)}
                  onLongPress={
                    isCustom
                      ? () => confirm('Lebensmittel löschen?', `„${item.name}“ aus deinen Lebensmitteln entfernen?`, () => removeCustomFood(item.id))
                      : undefined
                  }
                  style={({ pressed }) => [styles.foodRow, pressed && { opacity: 0.6 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName}>
                      {isDrink(item) ? '🥤 ' : ''}
                      {item.name}
                      {isCustom ? '  ⭐' : ''}
                    </Text>
                    <Text style={styles.foodMeta}>
                      pro 100 {unitOf(item)} · E {fmt(item.protein)} · K {fmt(item.carbs)} · F {fmt(item.fat)}
                    </Text>
                  </View>
                  <Text style={styles.foodKcal}>{item.kcal} kcal</Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {mode === 'quick' && (
        <QuickAdd
          meal={meal}
          setMeal={setMeal}
          onAdd={(name, kcal, protein, carbs, fat) => {
            addEntry({ date, meal, name, kcal, protein, carbs, fat, grams: null, foodId: null });
            router.back();
          }}
        />
      )}

      {mode === 'custom' && (
        <CustomFood
          initialName={query}
          onSave={(food) => {
            const created = addCustomFood(food);
            setQuery('');
            setMode('search');
            setSelected(created);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function AmountPanel({
  food,
  meal,
  setMeal,
  onBack,
  onAdd,
}: {
  food: Food;
  meal: Meal;
  setMeal: (m: Meal) => void;
  onBack: () => void;
  onAdd: (grams: number) => void;
}) {
  const [gramsText, setGramsText] = useState(String(food.portion));
  const grams = parseNum(gramsText);
  const valid = grams > 0;
  const m = scaleMacros(food, valid ? grams : 0);

  const unit = unitOf(food);
  const steps = unit === 'ml' ? [100, 250, 500] : [50, 100, 200];
  const quick = [
    ...(food.portionLabel ? [{ label: `${food.portionLabel} (${food.portion} ${unit})`, g: food.portion }] : []),
    ...steps.map((g) => ({ label: `${g} ${unit}`, g })),
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15 }}>‹ Zurück zur Suche</Text>
      </Pressable>
      <Card>
        <Text style={styles.detailTitle}>{food.name}</Text>
        <Text style={styles.foodMeta}>{food.kcal} kcal pro 100 {unit}</Text>

        <View style={{ marginTop: 16 }}>
          <Field label="Menge" suffix={unit} value={gramsText} onChangeText={setGramsText} keyboardType="decimal-pad" selectTextOnFocus />
        </View>
        <View style={[styles.recentWrap, { marginTop: 10 }]}>
          {quick.map((q) => (
            <Pressable key={q.label} onPress={() => setGramsText(String(q.g))} style={styles.recentChip}>
              <Text style={styles.recentText}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bigKcalWrap}>
          <Text style={styles.bigKcal}>{m.kcal}</Text>
          <Text style={styles.foodMeta}>kcal</Text>
        </View>
        <View style={styles.macroRow}>
          <MacroCell label="Eiweiß" value={m.protein} color={colors.protein} />
          <MacroCell label="Kohlenhydrate" value={m.carbs} color={colors.carbs} />
          <MacroCell label="Fett" value={m.fat} color={colors.fat} />
        </View>
      </Card>

      <Card>
        <Text style={styles.fieldTitle}>Mahlzeit</Text>
        <Chips options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      </Card>

      <Button title="Hinzufügen" disabled={!valid} onPress={() => onAdd(grams)} />
    </ScrollView>
  );
}

function MacroCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.macroCellValue}>{fmt(value)} g</Text>
      <Text style={styles.foodMeta}>{label}</Text>
    </View>
  );
}

function QuickAdd({
  meal,
  setMeal,
  onAdd,
}: {
  meal: Meal;
  setMeal: (m: Meal) => void;
  onAdd: (name: string, kcal: number, protein: number, carbs: number, fat: number) => void;
}) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const k = parseNum(kcal);
  const opt = (s: string) => (s.trim() ? Math.max(0, parseNum(s) || 0) : 0);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.hint}>Kalorien direkt eintragen – z. B. für Restaurantessen oder Packungsangaben.</Text>
        <Field label="Bezeichnung (optional)" value={name} onChangeText={setName} placeholder="z. B. Mittagessen Kantine" />
        <View style={{ height: 12 }} />
        <Field label="Kalorien" suffix="kcal" value={kcal} onChangeText={setKcal} keyboardType="number-pad" />
        <View style={styles.row3}>
          <Field label="Eiweiß" suffix="g" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
          <Field label="Kohlenh." suffix="g" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
          <Field label="Fett" suffix="g" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
        </View>
      </Card>
      <Card>
        <Text style={styles.fieldTitle}>Mahlzeit</Text>
        <Chips options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      </Card>
      <Button
        title="Hinzufügen"
        disabled={!(k > 0)}
        onPress={() => onAdd(name.trim() || 'Schnelleintrag', Math.round(k), opt(protein), opt(carbs), opt(fat))}
      />
    </ScrollView>
  );
}

function CustomFood({ initialName, onSave }: { initialName: string; onSave: (f: Omit<Food, 'id'>) => void }) {
  const [name, setName] = useState(initialName);
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [portion, setPortion] = useState('100');
  const [unit, setUnit] = useState<Unit>('g');
  const k = parseNum(kcal);
  const p = parseNum(portion);
  const opt = (s: string) => (s.trim() ? Math.max(0, parseNum(s) || 0) : 0);
  const valid = name.trim().length > 0 && k >= 0 && !Number.isNaN(k) && p > 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.hint}>Lege ein Lebensmittel oder Getränk mit Nährwerten pro 100 g bzw. 100 ml an (steht auf der Verpackung). Es wird gespeichert und taucht in der Suche auf.</Text>
        <Field label="Name" value={name} onChangeText={setName} placeholder="z. B. Proteinriegel Schoko" />
        <View style={{ height: 12 }} />
        <Text style={styles.fieldTitle}>Art</Text>
        <Chips<Unit>
          options={[
            { key: 'g', label: '🍽️ Essen (g)' },
            { key: 'ml', label: '🥤 Getränk (ml)' },
          ]}
          value={unit}
          onChange={setUnit}
        />
        <View style={{ height: 12 }} />
        <View style={styles.row2}>
          <Field label={`Kalorien / 100 ${unit}`} suffix="kcal" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" />
          <Field label="Portion" suffix={unit} value={portion} onChangeText={setPortion} keyboardType="decimal-pad" />
        </View>
        <View style={styles.row3}>
          <Field label="Eiweiß" suffix="g" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
          <Field label="Kohlenh." suffix="g" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
          <Field label="Fett" suffix="g" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
        </View>
      </Card>
      <Button
        title="Speichern & auswählen"
        disabled={!valid}
        onPress={() =>
          onSave({
            name: name.trim(),
            kcal: Math.round(k),
            protein: opt(protein),
            carbs: opt(carbs),
            fat: opt(fat),
            portion: Math.round(p),
            unit,
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: colors.border, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listHeader: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 8 },
  recentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: { backgroundColor: colors.primarySoft, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16 },
  recentText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  foodName: { fontSize: 15, fontWeight: '600', color: colors.text },
  foodMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  foodKcal: { fontSize: 15, fontWeight: '700', color: colors.text },
  detailTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  bigKcalWrap: { alignItems: 'center', marginTop: 20 },
  bigKcal: { fontSize: 44, fontWeight: '800', color: colors.primary },
  macroRow: { flexDirection: 'row', marginTop: 16 },
  macroCellValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  fieldTitle: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  hint: { fontSize: 14, color: colors.muted, marginBottom: 14, lineHeight: 20 },
  row2: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
