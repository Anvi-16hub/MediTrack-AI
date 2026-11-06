import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { Card, PageHeader, ProgressBar, Screen, SectionTitle } from '@/components/app-ui';
import { AppColors, AppSpacing, commonTextStyles } from '@/constants/app-theme';
import { useAppState } from '@/hooks/use-app-state';
import { buildDailyAdherence, getMissedPatterns, summarizeDoses } from '@/utils/analytics';
import { getRecentDateKeys } from '@/utils/dates';

type Period = 'week' | 'month';

export default function InsightsScreen() {
  const { medicines, schedules, doseRecords } = useAppState();
  const [period, setPeriod] = useState<Period>('week');
  const weeklyDates = getRecentDateKeys(7);
  const monthlyDates = getRecentDateKeys(30);
  const weeklyRecords = doseRecords.filter((record) => weeklyDates.includes(record.date));
  const monthlyRecords = doseRecords.filter((record) => monthlyDates.includes(record.date));
  const selectedDates = period === 'week' ? weeklyDates : monthlyDates;
  const selectedRecords = period === 'week' ? weeklyRecords : monthlyRecords;
  const summary = summarizeDoses(selectedRecords);
  const overall = summarizeDoses(doseRecords);
  const dailyData = buildDailyAdherence(doseRecords, period === 'week' ? 7 : 30);
  const patterns = getMissedPatterns(selectedRecords, schedules, medicines);
  const topPattern = patterns.byPeriod[0];

  const ruleBasedInsights = [
    summary.completed === 0
      ? 'No confirmed doses are recorded in this period yet.'
      : summary.adherence >= 85
        ? `Adherence is ${summary.adherence}% for this period. Keep following the care plan provided by your clinician.`
        : summary.adherence >= 70
          ? `Adherence is ${summary.adherence}%. Review your reminder routine if doses are difficult to track.`
          : `Adherence is ${summary.adherence}%. Consider discussing any missed doses with your healthcare professional.`,
    topPattern
      ? `${topPattern.label} has the most missed demo doses (${topPattern.count}) in this period.`
      : 'No missed-dose time pattern is visible in this period.',
  ];

  return (
    <Screen>
      <PageHeader eyebrow="PATTERNS, NOT PREDICTIONS" title="AI Insights" subtitle="A clear view of your adherence history" />

      <View style={styles.disclaimer}>
        <AppIcon name="insightsDemo" color={AppColors.blueDark} size={19} />
        <View style={styles.disclaimerCopy}>
          <Text style={styles.disclaimerTitle}>Rule-based demo analysis</Text>
          <Text style={styles.disclaimerText}>Uses sample dose records and simple rules. No AI model or clinical assessment is involved.</Text>
        </View>
      </View>

      <Card style={styles.overallCard}>
        <View style={styles.overallTop}>
          <View style={styles.overallCopy}>
            <Text style={styles.overallEyebrow}>OVERALL ADHERENCE</Text>
            <Text style={commonTextStyles.muted}>Across recorded demo doses</Text>
          </View>
          <Text style={styles.overallValue}>{overall.adherence}%</Text>
        </View>
        <ProgressBar value={overall.adherence} color={AppColors.teal} />
        <View style={styles.summaryFoot}>
          <Text style={styles.summaryFootText}>{overall.taken} taken</Text>
          <Text style={styles.summaryFootText}>{overall.missed} missed</Text>
          <Text style={styles.summaryFootText}>{overall.completed} confirmed</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.periodHeader}>
          <SectionTitle title={period === 'week' ? 'Weekly summary' : 'Monthly summary'} />
          <View style={styles.periodSwitch}>
            <PeriodButton label="7 days" active={period === 'week'} onPress={() => setPeriod('week')} />
            <PeriodButton label="30 days" active={period === 'month'} onPress={() => setPeriod('month')} />
          </View>
        </View>
        <View style={styles.periodMetrics}>
          <Metric label="Adherence" value={`${summary.adherence}%`} color={AppColors.blue} />
          <Metric label="Taken" value={String(summary.taken)} color={AppColors.teal} />
          <Metric label="Missed" value={String(summary.missed)} color={AppColors.red} />
        </View>
        <Text style={commonTextStyles.muted}>{selectedDates[0]} to {selectedDates[selectedDates.length - 1]}</Text>
      </Card>

      <Card style={styles.chartCard}>
        <View>
          <SectionTitle title={period === 'week' ? 'Daily adherence' : '30-day adherence'} />
          <Text style={commonTextStyles.muted}>Percent of confirmed doses marked taken</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
          {dailyData.map((day) => (
            <View key={day.date} style={styles.chartColumn}>
              <Text style={styles.chartPercent}>{day.completed ? `${day.adherence}` : '—'}</Text>
              <View style={styles.chartTrack}>
                <View style={[styles.chartBar, { height: `${day.adherence}%` }]} />
              </View>
              <Text style={styles.chartDay}>{period === 'week' ? day.label : day.date.slice(8)}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.chartLegend}><View style={styles.legendDot} /><Text style={styles.legendText}>Adherence %</Text></View>
      </Card>

      <Card>
        <SectionTitle title="Missed-dose patterns" />
        {patterns.byPeriod.length === 0 ? (
          <Text style={commonTextStyles.muted}>No missed demo doses in this period.</Text>
        ) : patterns.byPeriod.map((pattern) => (
          <View key={pattern.label} style={styles.patternRow}>
            <View style={styles.patternIcon}><AppIcon name="schedule" color={AppColors.amber} size={15} /></View>
            <Text style={styles.patternLabel}>{pattern.label}</Text>
            <Text style={styles.patternCount}>{pattern.count} missed</Text>
          </View>
        ))}
        {patterns.byMedicine.length > 0 ? (
          <View style={styles.medicinePattern}>
            <Text style={styles.patternSubhead}>By medicine</Text>
            {patterns.byMedicine.slice(0, 3).map((pattern) => (
              <View key={pattern.label} style={styles.medicinePatternRow}>
                <Text numberOfLines={1} style={styles.patternLabel}>{pattern.label}</Text>
                <Text style={styles.patternCount}>{pattern.count}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <View style={styles.ruleHeading}>
          <View style={styles.ruleIcon}><AppIcon name="insightsDemo" color={AppColors.blue} size={17} /></View>
          <View style={styles.ruleCopy}>
            <SectionTitle title="Demo insights" />
            <Text style={commonTextStyles.muted}>Generated from this period&apos;s sample records</Text>
          </View>
        </View>
        {ruleBasedInsights.map((insight) => (
          <View key={insight} style={styles.insightRow}>
            <View style={styles.insightBullet} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
        <Text style={styles.disclaimerFooter}>Informational demo only, not medical advice.</Text>
      </Card>
    </Screen>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function PeriodButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text accessibilityRole="button" onPress={onPress} style={[styles.periodButton, active && styles.periodButtonActive]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: AppSpacing.md, padding: AppSpacing.md, borderRadius: 13, borderWidth: 1, borderColor: '#D5E6FC', backgroundColor: AppColors.bluePale },
  disclaimerCopy: { flex: 1, gap: 4 },
  disclaimerTitle: { color: AppColors.blueDark, fontSize: 12, fontWeight: '800' },
  disclaimerText: { color: AppColors.blueDark, fontSize: 11, lineHeight: 16 },
  overallCard: { backgroundColor: '#FDFEFF' },
  overallTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overallCopy: { gap: 4 },
  overallEyebrow: { color: AppColors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  overallValue: { color: AppColors.teal, fontSize: 29, fontWeight: '800' },
  summaryFoot: { flexDirection: 'row', justifyContent: 'space-between', gap: AppSpacing.xs },
  summaryFootText: { color: AppColors.muted, fontSize: 10 },
  periodHeader: { gap: AppSpacing.md },
  periodSwitch: { flexDirection: 'row', alignSelf: 'flex-start', padding: 3, borderRadius: 10, backgroundColor: AppColors.page, gap: 4 },
  periodButton: { overflow: 'hidden', paddingHorizontal: AppSpacing.md, paddingVertical: 8, borderRadius: 8, color: AppColors.muted, fontSize: 11, fontWeight: '700' },
  periodButtonActive: { backgroundColor: AppColors.white, color: AppColors.blueDark },
  periodMetrics: { flexDirection: 'row', gap: AppSpacing.sm },
  metric: { flex: 1, minWidth: 0, paddingVertical: AppSpacing.md, alignItems: 'center', borderRadius: 12, backgroundColor: AppColors.page, gap: 3 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { color: AppColors.muted, fontSize: 10 },
  chartCard: { overflow: 'hidden' },
  chartScroll: { minWidth: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingTop: AppSpacing.sm },
  chartColumn: { width: 31, height: 128, alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  chartPercent: { color: AppColors.muted, fontSize: 9, height: 12 },
  chartTrack: { width: 19, height: 88, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 9, backgroundColor: AppColors.track },
  chartBar: { width: '100%', minHeight: 3, borderRadius: 9, backgroundColor: AppColors.blue },
  chartDay: { color: AppColors.muted, fontSize: 9 },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: AppColors.blue },
  legendText: { color: AppColors.muted, fontSize: 10 },
  patternRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: AppSpacing.sm, borderBottomWidth: 1, borderBottomColor: AppColors.line },
  patternIcon: { width: 29, height: 29, borderRadius: 10, backgroundColor: AppColors.amberPale, alignItems: 'center', justifyContent: 'center' },
  patternLabel: { flex: 1, color: AppColors.ink, fontSize: 12, fontWeight: '600' },
  patternCount: { color: AppColors.amber, fontSize: 11, fontWeight: '800' },
  medicinePattern: { gap: AppSpacing.sm, paddingTop: AppSpacing.sm },
  patternSubhead: { color: AppColors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  medicinePatternRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.sm },
  ruleHeading: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md },
  ruleIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: AppColors.bluePale, alignItems: 'center', justifyContent: 'center' },
  ruleCopy: { flex: 1, gap: 4 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: AppSpacing.sm },
  insightBullet: { width: 6, height: 6, marginTop: 6, borderRadius: 4, backgroundColor: AppColors.teal },
  insightText: { flex: 1, color: AppColors.ink, fontSize: 12, lineHeight: 18 },
  disclaimerFooter: { paddingTop: AppSpacing.sm, borderTopWidth: 1, borderTopColor: AppColors.line, color: AppColors.muted, fontSize: 10 },
});