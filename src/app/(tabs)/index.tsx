import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, confirm, fmt, MacroBar, ProgressRing } from '../../components/ui';
import { addDays, dailyTargets, formatDateLabel, MEALS, sumMacros, toDateKey } from '../../lib/nutrition';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function DiaryScreen() {
  const { loaded, entries, profile, selectedDate, setSelectedDate, removeEntry } = useStore();
  const targets = dailyTargets(profile);
  const dayEntries = useMemo(() => entries.filter((e) => e.date === selectedDate), [entries, selectedDate]);
  const total = sumMacros(dayEntries);
  const remaining = targets.kcal - total.kcal;
  const over = remaining < 0;
  const isToday = selectedDate === toDateKey(new Date());

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const openAdd = (meal?: string) =>
    router.push({ pathname: '/add', params: { date: selectedDate, ...(meal ? { meal } : {}) } });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dateRow}>
          <Pressable hitSlop={12} onPress={() => setSelectedDate(addDays(selectedDate, -1))} style={styles.dateBtn}>
            <Text style={styles.dateArrow}>‹</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedDate(toDateKey(new Date()))}>
            <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
            {!isToday && <Text style={styles.dateHint}>Tippen für heute</Text>}
          </Pressable>
          <Pressable hitSlop={12} onPress={() => setSelectedDate(addDays(selectedDate, 1))} style={styles.dateBtn}>
            <Text style={styles.dateArrow}>›</Text>
          </Pressable>
        </View>

        <Card style={{ alignItems: 'center' }}>
          <View style={styles.summaryRow}>
            <View style={styles.summarySide}>
              <Text style={styles.summaryNum}>{total.kcal}</Text>
              <Text style={styles.summaryLabel}>gegessen</Text>
            </View>
            <ProgressRing progress={total.kcal / targets.kcal} color={over ? colors.danger : colors.primary}>
              <Text style={[styles.ringNum, over && { color: colors.danger }]}>{Math.abs(remaining)}</Text>
              <Text style={styles.ringLabel}>{over ? 'kcal zu viel' : 'kcal übrig'}</Text>
            </ProgressRing>
            <View style={styles.summarySide}>
              <Text style={styles.summaryNum}>{targets.kcal}</Text>
              <Text style={styles.summaryLabel}>Ziel</Text>
            </View>
          </View>
          <View style={styles.macros}>
            <MacroBar label="Eiweiß" value={total.protein} target={targets.protein} color={colors.protein} />
            <MacroBar label="Kohlenhydrate" value={total.carbs} target={targets.carbs} color={colors.carbs} />
            <MacroBar label="Fett" value={total.fat} target={targets.fat} color={colors.fat} />
          </View>
        </Card>

        {MEALS.map((meal) => {
          const items = dayEntries.filter((e) => e.meal === meal.key);
          const mealKcal = items.reduce((s, e) => s + e.kcal, 0);
          return (
            <Card key={meal.key} style={{ paddingVertical: 12 }}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>
                  {meal.icon} {meal.label}
                </Text>
                <Text style={styles.mealKcal}>{mealKcal} kcal</Text>
              </View>
              {items.map((e) => (
                <Pressable
                  key={e.id}
                  onLongPress={() => confirm('Eintrag löschen?', `„${e.name}“ wird entfernt.`, () => removeEntry(e.id))}
                  style={styles.entry}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={styles.entryMeta}>
                      {e.grams != null ? `${e.grams} ${e.unit ?? 'g'} · ` : ''}E {fmt(e.protein)} · K {fmt(e.carbs)} · F {fmt(e.fat)}
                    </Text>
                  </View>
                  <Text style={styles.entryKcal}>{e.kcal}</Text>
                  <Pressable
                    hitSlop={10}
                    accessibilityLabel={`${e.name} löschen`}
                    onPress={() => confirm('Eintrag löschen?', `„${e.name}“ wird entfernt.`, () => removeEntry(e.id))}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </Pressable>
                </Pressable>
              ))}
              <Pressable onPress={() => openAdd(meal.key)} style={styles.addRow}>
                <Text style={styles.addText}>+ Hinzufügen</Text>
              </Pressable>
            </Card>
          );
        })}
      </ScrollView>

      <Pressable accessibilityLabel="Lebensmittel hinzufügen" onPress={() => openAdd()} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 100 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  dateArrow: { fontSize: 28, color: colors.primary, marginTop: -3 },
  dateLabel: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  dateHint: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  summarySide: { alignItems: 'center', width: 70 },
  summaryNum: { fontSize: 18, fontWeight: '700', color: colors.text },
  summaryLabel: { fontSize: 12, color: colors.muted },
  ringNum: { fontSize: 34, fontWeight: '800', color: colors.text },
  ringLabel: { fontSize: 13, color: colors.muted },
  macros: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  mealTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  mealKcal: { fontSize: 15, fontWeight: '600', color: colors.muted },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  entryName: { fontSize: 15, color: colors.text, fontWeight: '500' },
  entryMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  entryKcal: { fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 8 },
  deleteBtn: { marginLeft: 12, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  deleteText: { fontSize: 11, color: colors.muted },
  addRow: { paddingTop: 10 },
  addText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 32, fontWeight: '400', marginTop: -2 },
});
