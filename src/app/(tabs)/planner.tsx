import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chips, confirm, Field, fmt, SectionTitle } from '../../components/ui';
import { FlyerResult, readFlyer, RecipeResult, RecipeSuggestion, suggestRecipes, takePhoto } from '../../lib/ai';
import { dailyTargets, mealForNow, round1, sumMacros, toDateKey } from '../../lib/nutrition';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

type Section = 'recipes' | 'offers' | 'shopping';

const PREFS = ['Österreichisch', 'Türkisch', 'Italienisch', 'Schnell (≤ 20 Min)', 'Vegetarisch', 'Viel Eiweiß', 'Günstig', 'Low Carb'];

/** Startseiten der Märkte – das aktuelle Flugblatt ist dort jeweils verlinkt. */
const STORES: { name: string; url: string; color: string }[] = [
  { name: 'BILLA', url: 'https://www.billa.at', color: '#FFD200' },
  { name: 'SPAR', url: 'https://www.spar.at', color: '#E30613' },
  { name: 'INTERSPAR', url: 'https://www.interspar.at', color: '#E30613' },
  { name: 'HOFER', url: 'https://www.hofer.at', color: '#00599C' },
  { name: 'Lidl', url: 'https://www.lidl.at', color: '#0050AA' },
  { name: 'PENNY', url: 'https://www.penny.at', color: '#CD1414' },
  { name: 'MPREIS', url: 'https://www.mpreis.at', color: '#C8102E' },
  { name: 'Unimarkt', url: 'https://www.unimarkt.at', color: '#E2001A' },
  { name: 'Nah&Frisch', url: 'https://www.nahundfrisch.at', color: '#009640' },
  { name: 'ADEG', url: 'https://www.adeg.at', color: '#E30613' },
];

export default function PlannerScreen() {
  const [section, setSection] = useState<Section>('recipes');
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.segment}>
        {(
          [
            ['recipes', '🍳 Rezepte'],
            ['offers', '📰 Angebote'],
            ['shopping', '🛒 Einkauf'],
          ] as const
        ).map(([key, label]) => (
          <Pressable key={key} onPress={() => setSection(key)} style={[styles.segBtn, section === key && styles.segBtnActive]}>
            <Text style={[styles.segText, section === key && styles.segTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {section === 'recipes' && <RecipesSection onGoShopping={() => setSection('shopping')} />}
      {section === 'offers' && <OffersSection />}
      {section === 'shopping' && <ShoppingSection />}
    </ScrollView>
  );
}

/* ───────────────────────── Rezepte ───────────────────────── */

function RecipesSection({ onGoShopping }: { onGoShopping: () => void }) {
  const { entries, profile, offers, recipePrefs, setRecipePrefs, addEntry, addShopping, addCustomFood } = useStore();
  const [pantry, setPantry] = useState('');
  const [useOffers, setUseOffers] = useState(true);
  const [days, setDays] = useState<'3' | '5' | '7'>('5');
  const [loading, setLoading] = useState<null | 'recipes' | 'weekplan'>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(RecipeResult & { mode: 'recipes' | 'weekplan' }) | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const today = toDateKey(new Date());
  const targets = dailyTargets(profile);
  const eaten = sumMacros(entries.filter((e) => e.date === today));
  const kcalLeft = Math.max(0, targets.kcal - eaten.kcal);
  const proteinLeft = Math.max(0, targets.protein - eaten.protein);

  const togglePref = (p: string) => setRecipePrefs(recipePrefs.includes(p) ? recipePrefs.filter((x) => x !== p) : [...recipePrefs, p]);

  const run = async (mode: 'recipes' | 'weekplan') => {
    setLoading(mode);
    setError(null);
    setNotice(null);
    try {
      const res = await suggestRecipes({
        mode,
        kcalLeft,
        proteinLeft,
        dailyKcal: targets.kcal,
        preferences: recipePrefs,
        pantry,
        offers: useOffers ? offers.map((o) => ({ product: o.product, price: o.price, store: o.store })) : [],
        days: Number(days),
      });
      setResult({ ...res, mode });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const logPortion = (r: RecipeSuggestion) => {
    addEntry({
      date: today,
      meal: mealForNow(),
      name: r.name,
      grams: Math.round(r.grams_per_serving),
      unit: 'g',
      foodId: null,
      kcal: Math.round(r.kcal_per_serving),
      protein: round1(r.protein_per_serving),
      carbs: round1(r.carbs_per_serving),
      fat: round1(r.fat_per_serving),
    });
    setNotice(`✅ „${r.name}“ (1 Portion) ins heutige Tagebuch eingetragen.`);
  };

  const saveRecipe = (r: RecipeSuggestion) => {
    const g = Math.max(1, r.grams_per_serving);
    const f = 100 / g;
    addCustomFood({
      name: r.name,
      kcal: Math.round(r.kcal_per_serving * f),
      protein: round1(r.protein_per_serving * f),
      carbs: round1(r.carbs_per_serving * f),
      fat: round1(r.fat_per_serving * f),
      portion: Math.round(g),
      portionLabel: '1 Portion',
      unit: 'g',
    });
    setNotice(`✅ „${r.name}“ gespeichert – du findest es jetzt in der Suche (📝).`);
  };

  const toShopping = (items: { name: string; amount: string; store?: string }[], label: string) => {
    addShopping(items.map((i) => ({ name: i.name, amount: i.amount, store: i.store ?? '' })));
    setNotice(`✅ ${label} auf die Einkaufsliste gesetzt.`);
  };

  return (
    <>
      <Card>
        <SectionTitle>Was soll ich kochen?</SectionTitle>
        <Text style={styles.muted}>
          Heute noch übrig: <Text style={styles.strong}>{kcalLeft} kcal</Text> · {Math.round(proteinLeft)} g Eiweiß
        </Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Vorlieben (mehrere möglich)</Text>
        <View style={styles.chips}>
          {PREFS.map((p) => {
            const on = recipePrefs.includes(p);
            return (
              <Pressable key={p} onPress={() => togglePref(p)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && { color: '#fff' }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 12 }} />
        <Field label="Was hast du daheim? (optional)" value={pantry} onChangeText={setPantry} placeholder="z. B. Eier, Spinat, Feta, Erdäpfel" />
        {offers.length > 0 && (
          <Pressable onPress={() => setUseOffers(!useOffers)} style={styles.checkRow}>
            <View style={[styles.box, useOffers && styles.boxOn]}>{useOffers && <Text style={styles.boxTick}>✓</Text>}</View>
            <Text style={styles.text}>Meine {offers.length} Angebote berücksichtigen</Text>
          </Pressable>
        )}
        <Button title="3 Rezepte vorschlagen" onPress={() => run('recipes')} disabled={!!loading} style={{ marginTop: 14 }} />
      </Card>

      <Card>
        <SectionTitle>Wochenplan + Einkaufsliste</SectionTitle>
        <Text style={styles.muted}>Abendessen für mehrere Tage (je 2 Portionen) – mit fertiger Einkaufsliste, bevorzugt aus deinen Angeboten.</Text>
        <View style={{ marginVertical: 12 }}>
          <Chips
            options={[
              { key: '3', label: '3 Tage' },
              { key: '5', label: '5 Tage' },
              { key: '7', label: '7 Tage' },
            ]}
            value={days}
            onChange={setDays}
          />
        </View>
        <Button title="Wochenplan erstellen" variant="secondary" onPress={() => run('weekplan')} disabled={!!loading} />
      </Card>

      {loading && (
        <Card style={{ alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.muted, { marginTop: 8 }]}>{loading === 'weekplan' ? 'Wochenplan wird erstellt … (ca. 20–40 Sek.)' : 'Rezepte werden gesucht …'}</Text>
        </Card>
      )}
      {error && (
        <Card>
          <Text style={{ color: colors.danger }}>⚠️ {error}</Text>
        </Card>
      )}
      {notice && (
        <Card>
          <Text style={styles.text}>{notice}</Text>
          {notice.includes('Einkaufsliste') && <Button title="Zur Einkaufsliste" variant="secondary" onPress={onGoShopping} style={{ marginTop: 10 }} />}
        </Card>
      )}

      {result && !loading && (
        <>
          {!!result.tip && (
            <Card>
              <Text style={styles.text}>💡 {result.tip}</Text>
            </Card>
          )}
          {result.mode === 'weekplan' && result.shopping_list.length > 0 && (
            <Button
              title={`🛒 Alle ${result.shopping_list.length} Zutaten auf die Einkaufsliste`}
              onPress={() => toShopping(result.shopping_list, `${result.shopping_list.length} Zutaten`)}
              style={{ marginBottom: 16 }}
            />
          )}
          {result.recipes.map((r, i) => (
            <RecipeCard
              key={`${r.name}-${i}`}
              recipe={r}
              onLog={() => logPortion(r)}
              onSave={() => saveRecipe(r)}
              onShopping={() => toShopping(r.ingredients, `Zutaten für „${r.name}“`)}
            />
          ))}
        </>
      )}
    </>
  );
}

function RecipeCard({ recipe: r, onLog, onSave, onShopping }: { recipe: RecipeSuggestion; onLog: () => void; onSave: () => void; onShopping: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Pressable onPress={() => setOpen(!open)}>
        {!!r.day && <Text style={styles.day}>{r.day}</Text>}
        <Text style={styles.recipeTitle}>{r.name}</Text>
        <Text style={styles.muted}>{r.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaPill}>🔥 {Math.round(r.kcal_per_serving)} kcal/Portion</Text>
          <Text style={styles.metaPill}>⏱️ {Math.round(r.minutes)} Min</Text>
          <Text style={styles.metaPill}>🥚 {Math.round(r.protein_per_serving)} g Eiweiß</Text>
        </View>
        {r.uses_offers.length > 0 && <Text style={styles.offerHint}>🏷️ Mit Angebot: {r.uses_offers.join(', ')}</Text>}
        <Text style={styles.toggle}>{open ? '▲ Weniger' : '▼ Zutaten & Zubereitung'}</Text>
      </Pressable>
      {open && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Zutaten ({r.servings} Portionen)</Text>
          {r.ingredients.map((ing, i) => (
            <Text key={i} style={styles.text}>
              • {ing.amount} {ing.name}
            </Text>
          ))}
          <Text style={[styles.label, { marginTop: 12 }]}>Zubereitung</Text>
          {r.steps.map((s, i) => (
            <Text key={i} style={[styles.text, { marginBottom: 6 }]}>
              {i + 1}. {s}
            </Text>
          ))}
          <Text style={[styles.muted, { marginTop: 6 }]}>
            Pro Portion ({Math.round(r.grams_per_serving)} g): E {fmt(r.protein_per_serving)} g · K {fmt(r.carbs_per_serving)} g · F {fmt(r.fat_per_serving)} g
          </Text>
        </View>
      )}
      <View style={styles.btnRow}>
        <Button title="Eintragen" onPress={onLog} style={styles.smallBtn} />
        <Button title="🛒 Zutaten" variant="secondary" onPress={onShopping} style={styles.smallBtn} />
        <Button title="Speichern" variant="secondary" onPress={onSave} style={styles.smallBtn} />
      </View>
    </Card>
  );
}

/* ───────────────────────── Angebote ───────────────────────── */

function OffersSection() {
  const { offers, addOffers, removeOffer, clearOffers, addShopping } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<(FlyerResult['offers'][number] & { include: boolean })[] | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof offers>();
    for (const o of offers) {
      const k = o.store || 'Ohne Markt';
      map.set(k, [...(map.get(k) ?? []), o]);
    }
    return [...map.entries()];
  }, [offers]);

  const scan = async () => {
    setError(null);
    setAdded(null);
    try {
      const photo = await takePhoto({ camera: false });
      if (!photo) return;
      setLoading(true);
      const res = await readFlyer(photo);
      if (!res.recognized || res.offers.length === 0) {
        setError('Auf dem Bild wurden keine Lebensmittel-Angebote erkannt. Versuch es mit einem schärferen Foto oder Screenshot.');
        setFound(null);
      } else {
        setFound(res.offers.map((o) => ({ ...o, store: o.store || res.store, include: true })));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const take = () => {
    if (!found) return;
    const chosen = found.filter((f) => f.include).map(({ include: _i, ...o }) => o);
    addOffers(chosen);
    setFound(null);
    setAdded(`✅ ${chosen.length} Angebote gespeichert. Sie werden bei Rezeptvorschlägen und im Wochenplan berücksichtigt.`);
  };

  return (
    <>
      <Card>
        <SectionTitle>Flugblätter der Märkte</SectionTitle>
        <Text style={styles.muted}>Tippe auf einen Markt – auf dessen Seite findest du das aktuelle Flugblatt.</Text>
        <View style={styles.storeGrid}>
          {STORES.map((s) => (
            <Pressable key={s.name} onPress={() => Linking.openURL(s.url)} style={[styles.storeBtn, { borderColor: s.color }]}>
              <View style={[styles.storeDot, { backgroundColor: s.color }]} />
              <Text style={styles.storeText}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle>📸 Angebote übernehmen</SectionTitle>
        <Text style={styles.muted}>
          Mach ein Foto einer Flugblattseite oder wähle einen Screenshot aus deinen Fotos. Die KI liest die Lebensmittel-Angebote heraus (ca. 2–4 Cent pro Seite).
        </Text>
        <Button title="Flugblattseite auswählen" onPress={scan} disabled={loading} style={{ marginTop: 12 }} />
        {loading && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.muted, { marginTop: 6 }]}>Angebote werden gelesen …</Text>
          </View>
        )}
        {error && <Text style={{ color: colors.danger, marginTop: 12 }}>⚠️ {error}</Text>}
        {added && <Text style={[styles.text, { marginTop: 12 }]}>{added}</Text>}
      </Card>

      {found && (
        <Card>
          <SectionTitle>Gefunden: {found.length} Angebote</SectionTitle>
          {found.map((o, i) => (
            <Pressable
              key={i}
              onPress={() => setFound((prev) => prev!.map((p, j) => (j === i ? { ...p, include: !p.include } : p)))}
              style={[styles.offerRow, !o.include && { opacity: 0.4 }]}
            >
              <View style={[styles.box, o.include && styles.boxOn]}>{o.include && <Text style={styles.boxTick}>✓</Text>}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{o.product}</Text>
                <Text style={styles.muted}>
                  {[o.store, o.valid, o.category].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Text style={styles.price}>{o.price}</Text>
            </Pressable>
          ))}
          <Button title={`${found.filter((f) => f.include).length} Angebote übernehmen`} onPress={take} style={{ marginTop: 12 }} />
        </Card>
      )}

      <Card>
        <View style={styles.headRow}>
          <SectionTitle>Meine Angebote ({offers.length})</SectionTitle>
          {offers.length > 0 && (
            <Pressable onPress={() => confirm('Alle Angebote löschen?', 'Die gespeicherten Angebote werden entfernt.', clearOffers)}>
              <Text style={styles.link}>Alle löschen</Text>
            </Pressable>
          )}
        </View>
        {offers.length === 0 && <Text style={styles.muted}>Noch keine Angebote gespeichert.</Text>}
        {grouped.map(([store, list]) => (
          <View key={store} style={{ marginTop: 8 }}>
            <Text style={styles.label}>{store}</Text>
            {list.map((o) => (
              <View key={o.id} style={styles.offerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.text}>{o.product}</Text>
                  {!!o.valid && <Text style={styles.muted}>{o.valid}</Text>}
                </View>
                <Text style={styles.price}>{o.price}</Text>
                <Pressable
                  hitSlop={8}
                  accessibilityLabel={`${o.product} auf die Einkaufsliste`}
                  onPress={() => addShopping([{ name: o.product, amount: '', store: o.store }])}
                  style={styles.iconBtn}
                >
                  <Text>🛒</Text>
                </Pressable>
                <Pressable hitSlop={8} accessibilityLabel={`${o.product} löschen`} onPress={() => removeOffer(o.id)} style={styles.iconBtn}>
                  <Text style={{ color: colors.muted }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </Card>
    </>
  );
}

/* ───────────────────────── Einkaufsliste ───────────────────────── */

function ShoppingSection() {
  const { shopping, addShopping, toggleShopping, removeShopping, clearCheckedShopping } = useStore();
  const [name, setName] = useState('');
  const open = shopping.filter((i) => !i.checked);
  const done = shopping.filter((i) => i.checked);

  const add = () => {
    if (!name.trim()) return;
    addShopping([{ name: name.trim(), amount: '', store: '' }]);
    setName('');
  };

  const shareList = async () => {
    const text = ['🛒 Einkaufsliste', ...open.map((i) => `☐ ${i.amount ? `${i.amount} ` : ''}${i.name}${i.store ? ` (${i.store})` : ''}`)].join('\n');
    if (Platform.OS === 'web') {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ text });
        } catch {
          /* abgebrochen */
        }
      } else {
        await navigator.clipboard?.writeText(text);
      }
    } else {
      await Share.share({ message: text });
    }
  };

  const Row = ({ item }: { item: (typeof shopping)[number] }) => (
    <View style={styles.shopRow}>
      <Pressable onPress={() => toggleShopping(item.id)} style={styles.shopMain} accessibilityLabel={`${item.name} abhaken`}>
        <View style={[styles.box, item.checked && styles.boxOn]}>{item.checked && <Text style={styles.boxTick}>✓</Text>}</View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.text, item.checked && styles.strike]}>
            {item.amount ? <Text style={styles.strong}>{item.amount} </Text> : null}
            {item.name}
          </Text>
          {!!item.store && <Text style={styles.muted}>🏷️ {item.store}</Text>}
        </View>
      </Pressable>
      <Pressable hitSlop={8} onPress={() => removeShopping(item.id)} style={styles.iconBtn} accessibilityLabel={`${item.name} entfernen`}>
        <Text style={{ color: colors.muted }}>✕</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Card>
        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <Field label="Artikel hinzufügen" value={name} onChangeText={setName} placeholder="z. B. Milch" onSubmitEditing={add} returnKeyType="done" />
          </View>
          <Button title="+" accessibilityLabel="Artikel zur Einkaufsliste hinzufügen" onPress={add} disabled={!name.trim()} style={{ marginLeft: 10, paddingHorizontal: 18 }} />
        </View>
      </Card>

      <Card>
        <View style={styles.headRow}>
          <SectionTitle>Einkaufsliste ({open.length})</SectionTitle>
          {open.length > 0 && (
            <Pressable onPress={shareList}>
              <Text style={styles.link}>Teilen</Text>
            </Pressable>
          )}
        </View>
        {open.length === 0 && (
          <Text style={styles.muted}>Die Liste ist leer. Füge Artikel hinzu oder übernimm Zutaten aus Rezeptvorschlägen bzw. dem Wochenplan.</Text>
        )}
        {open.map((i) => (
          <Row key={i.id} item={i} />
        ))}
      </Card>

      {done.length > 0 && (
        <Card>
          <View style={styles.headRow}>
            <SectionTitle>Erledigt ({done.length})</SectionTitle>
            <Pressable onPress={clearCheckedShopping}>
              <Text style={styles.link}>Entfernen</Text>
            </Pressable>
          </View>
          {done.map((i) => (
            <Row key={i.id} item={i} />
          ))}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: colors.segment, borderRadius: 10, padding: 3, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  segBtnActive: { backgroundColor: colors.segmentActive },
  segText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
  segTextActive: { color: colors.text },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  text: { fontSize: 15, color: colors.text, lineHeight: 21 },
  strong: { fontWeight: '700', color: colors.text },
  label: { fontSize: 13, color: colors.muted, fontWeight: '700', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxTick: { color: '#fff', fontWeight: '800', fontSize: 14 },
  day: { fontSize: 12, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', marginBottom: 2 },
  recipeTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  metaPill: { fontSize: 12, color: colors.text, backgroundColor: colors.bg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden' },
  offerHint: { fontSize: 13, color: colors.primary, marginTop: 8 },
  toggle: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  smallBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 6 },
  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  storeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: colors.card },
  storeDot: { width: 10, height: 10, borderRadius: 5 },
  storeText: { fontWeight: '700', color: colors.text, fontSize: 14 },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  price: { fontSize: 15, fontWeight: '800', color: colors.danger },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  addRow: { flexDirection: 'row', alignItems: 'flex-end' },
  shopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  shopMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  strike: { textDecorationLine: 'line-through', color: colors.muted },
});
