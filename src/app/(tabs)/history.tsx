import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { Card, Chips, fmt, SectionTitle } from '../../components/ui';
import { addDays, dailyTargets, formatDateLabel, fromDateKey, Macros, sumMacros, toDateKey } from '../../lib/nutrition';
import type { Entry } from '../../lib/store';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

type Range = '7' | '30';
const CHART_HEIGHT = 160;

export default function HistoryScreen() {
  const { entries, profile, weights, water, setSelectedDate } = useStore();
  const [range, setRange] = useState<Range>('7');
  const targets = dailyTargets(profile);
  const target = targets.kcal;
  const review = useMemo(() => weeklyReview(entries, water, targets, profile.waterGoalMl || 2000), [entries, water, targets, profile.waterGoalMl]);

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
        <SectionTitle>🗓️ Wochenrückblick (letzte 7 Tage)</SectionTitle>
        {review.days === 0 ? (
          <Text style={{ color: colors.muted }}>Trage ein paar Tage lang dein Essen ein, dann erscheint hier deine Auswertung.</Text>
        ) : (
          <>
            <View style={styles.reviewGrid}>
              <ReviewCell label="Ø Kalorien" value={`${review.avg.kcal}`} sub={`Ziel ${target}`} />
              <ReviewCell label="Ø Eiweiß" value={`${Math.round(review.avg.protein)} g`} sub={`Ziel ${targets.protein} g`} />
              <ReviewCell label="Ø Wasser" value={`${fmt(review.avgWater / 1000)} l`} sub={`Ziel ${fmt((profile.waterGoalMl || 2000) / 1000)} l`} />
            </View>
            <Text style={styles.reviewLine}>
              📅 {review.days} von 7 Tagen eingetragen
              {review.bestDay ? ` · bester Tag: ${formatDateLabel(review.bestDay)}` : ''}
            </Text>
            {review.tips.map((t) => (
              <Text key={t} style={styles.reviewLine}>
                {t}
              </Text>
            ))}
          </>
        )}
      </Card>

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
          <>
          {weights.length >= 2 && <WeightChart weights={weights.slice(-30)} targetKg={profile.targetWeightKg} />}
          {recentWeights
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
            })}
          </>
        )}
      </Card>
    </ScrollView>
  );
}

function ReviewCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.reviewCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
      <Text style={styles.statLabel}>{sub}</Text>
    </View>
  );
}

/** Auswertung der letzten 7 Tage (nur Tage mit Einträgen zählen). */
function weeklyReview(entries: Entry[], water: Record<string, number>, targets: Macros, waterGoal: number) {
  const today = toDateKey(new Date());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const perDay = dates
    .map((d) => ({ date: d, m: sumMacros(entries.filter((e) => e.date === d)) }))
    .filter((d) => d.m.kcal > 0);
  const days = perDay.length;
  const avg = days
    ? {
        kcal: Math.round(perDay.reduce((s, d) => s + d.m.kcal, 0) / days),
        protein: perDay.reduce((s, d) => s + d.m.protein, 0) / days,
        carbs: perDay.reduce((s, d) => s + d.m.carbs, 0) / days,
        fat: perDay.reduce((s, d) => s + d.m.fat, 0) / days,
      }
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const waterDays = dates.map((d) => water[d] ?? 0).filter((ml) => ml > 0);
  const avgWater = waterDays.length ? waterDays.reduce((s, ml) => s + ml, 0) / waterDays.length : 0;
  const bestDay = perDay.length
    ? [...perDay].sort((a, b) => Math.abs(a.m.kcal - targets.kcal) - Math.abs(b.m.kcal - targets.kcal))[0].date
    : null;

  const tips: string[] = [];
  if (days > 0) {
    const diff = avg.kcal - targets.kcal;
    if (diff > targets.kcal * 0.1) tips.push(`⚠️ Im Schnitt ${diff} kcal über deinem Ziel – kleinere Portionen oder weniger Süßes/Getränke mit Zucker helfen.`);
    else if (diff < -targets.kcal * 0.25) tips.push(`ℹ️ Im Schnitt ${-diff} kcal unter dem Ziel – achte darauf, genug zu essen (oder hast du Einträge vergessen?).`);
    else tips.push('✅ Deine Kalorien liegen im Schnitt gut im Zielbereich.');
    if (avg.protein < targets.protein * 0.8) tips.push('🥚 Eher wenig Eiweiß – z. B. Skyr, Topfen, Eier, Hülsenfrüchte, Fisch oder Hähnchen einplanen.');
    if (avg.fat > targets.fat * 1.25) tips.push('🧈 Recht viel Fett – Paniertes, Wurst und Käse in Maßen.');
    if (waterDays.length > 0 && avgWater < waterGoal * 0.75) tips.push('💧 Du trinkst weniger als geplant – stell dir ein Glas Wasser sichtbar hin.');
    if (days < 4) tips.push('📝 Je mehr Tage du einträgst, desto aussagekräftiger wird der Rückblick.');
  }
  return { days, avg, avgWater, bestDay, tips };
}

const CHART_W = 320;
const CHART_H = 150;

function WeightChart({ weights, targetKg }: { weights: { date: string; kg: number }[]; targetKg: number | null }) {
  const values = weights.map((w) => w.kg).concat(targetKg ? [targetKg] : []);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const padL = 34;
  const padR = 10;
  const padY = 12;
  const x = (i: number) => padL + (weights.length === 1 ? 0 : (i / (weights.length - 1)) * (CHART_W - padL - padR));
  const y = (kg: number) => padY + ((max - kg) / (max - min)) * (CHART_H - 2 * padY);
  const points = weights.map((w, i) => `${x(i)},${y(w.kg)}`).join(' ');
  return (
    <View style={{ marginBottom: 12 }}>
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <SvgText x={2} y={y(max) + 4} fontSize={10} fill={colors.muted}>
          {max}
        </SvgText>
        <SvgText x={2} y={y(min) + 4} fontSize={10} fill={colors.muted}>
          {min}
        </SvgText>
        <Line x1={padL} x2={CHART_W - padR} y1={y(max)} y2={y(max)} stroke={colors.border} strokeWidth={1} />
        <Line x1={padL} x2={CHART_W - padR} y1={y(min)} y2={y(min)} stroke={colors.border} strokeWidth={1} />
        {targetKg != null && (
          <>
            <Line x1={padL} x2={CHART_W - padR} y1={y(targetKg)} y2={y(targetKg)} stroke={colors.primary} strokeWidth={1.5} strokeDasharray="5 4" />
            <SvgText x={CHART_W - padR} y={y(targetKg) - 4} fontSize={10} fill={colors.primary} textAnchor="end">
              Ziel {fmt(targetKg)} kg
            </SvgText>
          </>
        )}
        <Polyline points={points} fill="none" stroke={colors.protein} strokeWidth={2.5} strokeLinejoin="round" />
        {weights.map((w, i) => (
          <Circle key={w.date} cx={x(i)} cy={y(w.kg)} r={3.5} fill={colors.protein} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  reviewCell: { flex: 1, alignItems: 'center', backgroundColor: colors.bg, borderRadius: 12, paddingVertical: 10 },
  reviewValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginVertical: 2 },
  reviewLine: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 20 },
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
