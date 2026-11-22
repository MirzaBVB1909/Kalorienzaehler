import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import BarcodeScanner from '../components/BarcodeScanner';
import { Button, Card, Chips, confirm, Field, fmt, parseNum } from '../components/ui';
import { Food, FOODS, isDrink, searchFoods, Unit, unitOf } from '../lib/foods';
import { Meal, MEALS, mealForNow, round1, scaleMacros, sumMacros, toDateKey } from '../lib/nutrition';
import { cleanBarcode, lookupBarcode } from '../lib/openfoodfacts';
import { recentFoodIds, useStore } from '../lib/store';
import { colors } from '../lib/theme';

type Mode = 'search' | 'scan' | 'quick' | 'custom';

const MEAL_OPTIONS = MEALS.map((m) => ({ key: m.key, label: m.label }));

export default function AddScreen() {
  const params = useLocalSearchParams<{ date?: string; meal?: Meal }>();
  const date = params.date ?? toDateKey(new Date());
  const { entries, customFoods, favorites, addEntry, addCustomFood, removeCustomFood, toggleFavorite } = useStore();

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
  const favFoods = useMemo(
    () => favorites.map((id) => allFoods.find((f) => f.id === id)).filter((f): f is Food => !!f),
    [favorites, allFoods],
  );
  const results = useMemo(() => searchFoods(query, customFoods, drinksOnly), [query, customFoods, drinksOnly]);

  if (selected) {
    return (
      <AmountPanel
        food={selected}
        meal={meal}
        setMeal={setMeal}
        isFavorite={favorites.includes(selected.id)}
        onToggleFavorite={() => toggleFavorite(selected.id)}
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
            ['scan', 'Scannen'],
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
              !query && !drinksOnly && (recent.length > 0 || favFoods.length > 0) ? (
                <View style={{ marginBottom: 8 }}>
                  {favFoods.length > 0 && (
                    <>
                      <Text style={styles.listHeader}>⭐ Favoriten</Text>
                      <View style={[styles.recentWrap, { marginBottom: 16 }]}>
                        {favFoods.map((f) => (
                          <Pressable key={f.id} onPress={() => setSelected(f)} style={[styles.recentChip, styles.favChip]}>
                            <Text style={[styles.recentText, styles.favText]}>{f.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                  {recent.length > 0 && (
                    <>
                      <Text style={styles.listHeader}>Zuletzt verwendet</Text>
                      <View style={styles.recentWrap}>
                        {recent.map((f) => (
                          <Pressable key={f.id} onPress={() => setSelected(f)} style={styles.recentChip}>
                            <Text style={styles.recentText}>{f.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
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
              const isCustom = item.id.startsWith('custom-') || item.id.startsWith('off-');
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
                      {isCustom ? '  📝' : ''}
                      {favorites.includes(item.id) ? '  ⭐' : ''}
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

      {mode === 'scan' && (
        <ScanPanel
          onFound={(food) => setSelected(addCustomFood(food))}
          onManual={() => setMode('custom')}
        />
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
        <CustomPanel
          initialName={query}
          customFoods={customFoods}
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

function ScanPanel({
  onFound,
  onManual,
}: {
  onFound: (food: Omit<Food, 'id'> & { id: string }) => void;
  onManual: () => void;
}) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'not_found' | 'no_nutrition' | 'network' | 'invalid'>('idle');
  const [scanKey, setScanKey] = useState(0);
  const [lastCode, setLastCode] = useState('');

  const lookup = async (raw: string) => {
    const clean = cleanBarcode(raw);
    if (!clean) {
      setStatus('invalid');
      return;
    }
    setLastCode(clean);
    setStatus('loading');
    const result = await lookupBarcode(clean);
    if (result.ok) {
      setStatus('idle');
      onFound({ ...result.food, id: `off-${clean}` });
    } else {
      setStatus(result.reason);
    }
  };

  const messages: Record<string, string> = {
    loading: '🔎 Suche Produkt …',
    not_found: `Das Produkt mit dem Code ${lastCode} ist (noch) nicht in der Datenbank. Lege es unter „Eigenes“ mit den Werten vom Etikett an.`,
    no_nutrition: `Das Produkt ${lastCode} ist bekannt, hat aber keine Nährwerte hinterlegt. Lege es unter „Eigenes“ an.`,
    network: 'Keine Verbindung zur Produktdatenbank. Prüfe dein Internet und versuche es nochmal.',
    invalid: 'Ein Barcode hat 8 bis 14 Ziffern. Bitte prüfe deine Eingabe.',
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      {status === 'idle' || status === 'loading' ? (
        <BarcodeScanner key={scanKey} onDetected={(c) => lookup(c)} />
      ) : (
        <Card>
          <Text style={styles.hint}>{messages[status]}</Text>
          <View style={styles.row2}>
            <Button title="Nochmal scannen" variant="secondary" onPress={() => { setStatus('idle'); setScanKey((k) => k + 1); }} style={{ flex: 1 }} />
            {status !== 'network' && status !== 'invalid' && <Button title="Eigenes anlegen" onPress={onManual} style={{ flex: 1 }} />}
          </View>
        </Card>
      )}
      {status === 'loading' && <Text style={[styles.hint, { textAlign: 'center' }]}>{messages.loading}</Text>}
      <Card>
        <Text style={styles.hint}>Kamera klappt nicht? Tippe die Zahlen unter dem Strichcode ein:</Text>
        <View style={styles.row2}>
          <Field label="Barcode" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="z. B. 9001234567890" />
        </View>
        <Button title="Produkt suchen" disabled={!code.trim() || status === 'loading'} onPress={() => lookup(code)} style={{ marginTop: 12 }} />
      </Card>
      <Text style={[styles.foodMeta, { textAlign: 'center' }]}>Produktdaten von Open Food Facts (openfoodfacts.org)</Text>
    </ScrollView>
  );
}

function AmountPanel({
  food,
  meal,
  setMeal,
  isFavorite,
  onToggleFavorite,
  onBack,
  onAdd,
}: {
  food: Food;
  meal: Meal;
  setMeal: (m: Meal) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
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
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={[styles.detailTitle, { flex: 1 }]}>{food.name}</Text>
          <Pressable
            hitSlop={12}
            accessibilityLabel={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            onPress={onToggleFavorite}
            style={styles.starBtn}
          >
            <Text style={{ fontSize: 26, color: isFavorite ? colors.warning : colors.muted }}>{isFavorite ? '★' : '☆'}</Text>
          </Pressable>
        </View>
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

function CustomPanel({
  initialName,
  customFoods,
  onSave,
}: {
  initialName: string;
  customFoods: Food[];
  onSave: (f: Omit<Food, 'id'>) => void;
}) {
  const [kind, setKind] = useState<'food' | 'recipe'>('food');
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Chips
          options={[
            { key: 'food', label: '🍽️ Lebensmittel' },
            { key: 'recipe', label: '🍲 Rezept' },
          ]}
          value={kind}
          onChange={setKind}
        />
      </View>
      {kind === 'food' ? (
        <CustomFood initialName={initialName} onSave={onSave} />
      ) : (
        <RecipeBuilder initialName={initialName} customFoods={customFoods} onSave={onSave} />
      )}
    </View>
  );
}

type Ingredient = { food: Food; grams: string };

function RecipeBuilder({
  initialName,
  customFoods,
  onSave,
}: {
  initialName: string;
  customFoods: Food[];
  onSave: (f: Omit<Food, 'id'>) => void;
}) {
  const [name, setName] = useState(initialName);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Ingredient[]>([]);
  const [servings, setServings] = useState('1');

  const results = useMemo(() => (query.trim() ? searchFoods(query, customFoods).slice(0, 6) : []), [query, customFoods]);
  const parsed = items.map((i) => ({ food: i.food, g: Math.max(0, parseNum(i.grams) || 0) }));
  const total = sumMacros(parsed.map((i) => scaleMacros(i.food, i.g)));
  const totalWeight = parsed.reduce((s, i) => s + i.g, 0);
  const n = Math.max(1, Math.round(parseNum(servings) || 1));
  const valid = name.trim().length > 0 && totalWeight > 0;

  const save = () => {
    const f = 100 / totalWeight;
    onSave({
      name: name.trim(),
      kcal: Math.round(total.kcal * f),
      protein: round1(total.protein * f),
      carbs: round1(total.carbs * f),
      fat: round1(total.fat * f),
      portion: Math.round(totalWeight / n),
      portionLabel: '1 Portion',
      unit: 'g',
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.hint}>
          Stell ein Gericht aus Zutaten zusammen, z. B. deine selbstgemachte Kürbissuppe. Die App rechnet die Kalorien pro Portion aus.
        </Text>
        <Field label="Name des Rezepts" value={name} onChangeText={setName} placeholder="z. B. Omas Kürbissuppe" />
        <View style={{ height: 12 }} />
        <Field label="Zutat hinzufügen" value={query} onChangeText={setQuery} placeholder="Zutat suchen, z. B. Kürbis" />
        {results.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => {
              setItems((prev) => [...prev, { food: f, grams: String(f.portion) }]);
              setQuery('');
            }}
            style={styles.ingredientResult}
          >
            <Text style={styles.foodName}>+ {f.name}</Text>
            <Text style={styles.foodMeta}>
              {f.kcal} kcal / 100 {unitOf(f)}
            </Text>
          </Pressable>
        ))}
        {query.trim() !== '' && results.length === 0 && (
          <Text style={[styles.foodMeta, { marginTop: 8 }]}>Keine Zutat gefunden. Lege sie zuerst unter „Lebensmittel“ an.</Text>
        )}
      </Card>

      {items.length > 0 && (
        <Card>
          <Text style={styles.fieldTitle}>Zutaten</Text>
          {items.map((it, idx) => (
            <View key={`${it.food.id}-${idx}`} style={styles.ingredientRow}>
              <Text style={[styles.foodName, { flex: 1 }]} numberOfLines={2}>
                {it.food.name}
              </Text>
              <View style={{ width: 110 }}>
                <Field
                  label=""
                  suffix={unitOf(it.food)}
                  value={it.grams}
                  onChangeText={(t) => setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, grams: t } : p)))}
                  keyboardType="decimal-pad"
                />
              </View>
              <Pressable
                hitSlop={10}
                accessibilityLabel={`${it.food.name} entfernen`}
                onPress={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                style={{ paddingHorizontal: 8 }}
              >
                <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>
          ))}
          <View style={{ marginTop: 12 }}>
            <Field label="Anzahl Portionen" value={servings} onChangeText={setServings} keyboardType="number-pad" />
          </View>
          <View style={styles.bigKcalWrap}>
            <Text style={styles.bigKcal}>{Math.round(total.kcal / n)}</Text>
            <Text style={styles.foodMeta}>
              kcal pro Portion ({Math.round(totalWeight / n)} g) · gesamt {total.kcal} kcal
            </Text>
          </View>
        </Card>
      )}

      <Button title="Rezept speichern & auswählen" disabled={!valid} onPress={save} />
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
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: colors.segment, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.segmentActive },
  tabText: { color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  search: {
    backgroundColor: colors.input,
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
  favChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.warning },
  favText: { color: colors.text },
  starBtn: { paddingLeft: 12, paddingTop: 2 },
  ingredientResult: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
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
