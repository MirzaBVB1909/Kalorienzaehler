import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Chips, SectionTitle } from '../../components/ui';
import { addDays, dailyTargets, formatDateLabel, fromDateKey, toDateKey } from '../../lib/nutrition';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

type Range = '7' | '30';
const CHART_HEIGHT = 160;

export default function HistoryScreen() {
  const { entries, profile, weights, setSelectedDate } = useStore();
  const [range, setRange] = useState<Range>('7');
  const target = dailyTargets(profile).kcal;

  const days = useMemo(() => {
    const n = Number(range);
    const today = toDateKey(new Date());
    const totals = new Map<string, number>();
    for (const e of entries) totals.set(e.date, (totals.get(e.date) ?? 0) + e.kcal);
    return Array.from({ length: n }, (_, i) => {
      const date = addDays(today, i - n + 1);
      return { date, kcal: totals.get(date) ?? 0 };
    });
  }, [entries, range]);

  const logged = days.filter((d) => d.kcal > 0);
  const avg = logged.length ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length) : 0;
  const onTarget = logged.filter((d) => d.kcal <= target).length;
  const max = Math.max(target * 1.2, ...days.map((d) => d.kcal));
  const barGap = range === '7' ? 10 : 3;

  const openDay = (date: string) => {
    setSelectedDate(date);
    router.navigate('/');
  };

  const recentWeights = weights.slice(-10);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Chips
        options={[
          { key: '7', label: '7 Tage' },
          { key: '30', label: '30 Tage' },
        ]}
        value={range}
        onChange={setRange}
      />

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statNum}>{avg}</Text>
          <Text style={styles.statLabel}>Ø kcal / Tag</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statNum}>
            {onTarget}/{logged.length}
          </Text>
          <Text style={styles.statLabel}>Tage im Ziel</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={[styles.statNum, { color: avg > target ? colors.danger : colors.primary }]}>
            {avg ? (avg - target > 0 ? '+' : '') + (avg - target) : '–'}
          </Text>
          <Text style={styles.statLabel}>Ø zum Ziel</Text>
        </Card>
      </View>

      <Card>
        <SectionTitle>Kalorien pro Tag</SectionTitle>
        <View style={{ height: CHART_HEIGHT, marginTop: 8 }}>
          <View style={[styles.targetLine, { bottom: (target / max) * CHART_HEIGHT }]}>
            <Text style={styles.targetLabel}>Ziel {target}</Text>
          </View>
          <View style={[styles.bars, { gap: barGap }]}>
            {days.map((d) => {
              const h = (d.kcal / max) * CHART_HEIGHT;
              const color = d.kcal === 0 ? colors.track : d.kcal > target ? colors.danger : colors.primary;
              return (
                <Pressable
                  key={d.date}
                  onPress={() => openDay(d.date)}
                  accessibilityLabel={`${formatDateLabel(d.date)}: ${d.kcal} kcal`}
                  style={styles.barCol}
                >
                  <View style={[styles.bar, { height: Math.max(h, 3), backgroundColor: color }]} />
                </Pressable>
              );
            })}
          </View>
        </View>
        {range === '7' && (
          <View style={[styles.bars, { gap: barGap, height: 'auto', marginTop: 6 }]}>
            {days.map((d) => (
              <Text key={d.date} style={styles.dayLabel}>
                {fromDateKey(d.date).toLocaleDateString('de-DE', { weekday: 'short' })}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <SectionTitle>Tage</SectionTitle>
        {[...days].reverse().filter((d) => d.kcal > 0).length === 0 && (
          <Text style={{ color: colors.muted }}>Noch keine Einträge in diesem Zeitraum.</Text>
        )}
        {[...days]
          .reverse()
          .filter((d) => d.kcal > 0)
          .map((d) => (
            <Pressable key={d.date} onPress={() => openDay(d.date)} style={styles.dayRow}>
              <Text style={styles.dayRowLabel}>{formatDateLabel(d.date)}</Text>
              <Text style={[styles.dayRowKcal, { color: d.kcal > target ? colors.danger : colors.text }]}>
                {d.kcal} kcal ›
              </Text>
            </Pressable>
          ))}
      </Card>

      <Card>
        <SectionTitle>Gewicht</SectionTitle>
        {recentWeights.length === 0 ? (
          <Text style={{ color: colors.muted }}>Trage dein Gewicht im Profil ein, um den Verlauf zu sehen.</Text>
        ) : (
          recentWeights
            .slice()
            .reverse()
            .map((w, i, arr) => {
              const prev = arr[i + 1];
              const diff = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : null;
              return (
                <View key={w.date} style={styles.dayRow}>
                  <Text style={styles.dayRowLabel}>{formatDateLabel(w.date)}</Text>
                  <Text style={styles.dayRowKcal}>
                    {w.kg.toLocaleString('de-DE')} kg
                    {diff != null && diff !== 0 && (
                      <Text style={{ color: diff < 0 ? colors.primary : colors.danger }}>
                        {'  '}
                        {diff > 0 ? '+' : ''}
                        {diff.toLocaleString('de-DE')}
                      </Text>
                    )}
                  </Text>
                </View>
              );
            })
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statNum: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: '100%' },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderRadius: 4, width: '100%' },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.muted,
    zIndex: 1,
  },
  targetLabel: { position: 'absolute', right: 0, top: -16, fontSize: 10, color: colors.muted },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayRowLabel: { fontSize: 15, color: colors.text },
  dayRowKcal: { fontSize: 15, fontWeight: '600', color: colors.text },
});
