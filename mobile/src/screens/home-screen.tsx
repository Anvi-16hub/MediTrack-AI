import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { AppButton, Card, PageHeader, ProgressBar, Screen, SectionTitle } from '@/components/app-ui';
import { AppColors, AppSpacing, commonTextStyles } from '@/constants/app-theme';
import { useAppState } from '@/hooks/use-app-state';
import { buildDailyAdherence } from '@/utils/analytics';
import { formatClock, formatLongDate, getDateKey } from '@/utils/dates';

export default function HomeScreen() {
  const { medicines, schedules, doseRecords, profile, updateDoseStatus } = useAppState();
  const [now] = useState(() => new Date());
  const today = getDateKey(now);
  const todaysSchedules = schedules.filter((schedule) => schedule.active);
  const todaysRecords = doseRecords.filter((record) => record.date === today);
  const taken = todaysRecords.filter((record) => record.status === 'taken').length;
  const missed = todaysRecords.filter((record) => record.status === 'missed').length;
  const completed = taken + missed;
  const pending = Math.max(0, todaysSchedules.length - completed);
  const adherence = completed === 0 ? 0 : Math.round((taken / completed) * 100);
  const weeklyData = buildDailyAdherence(doseRecords, 7);

  function getStatus(scheduleId: string) {
    return todaysRecords.find((record) => record.scheduleId === scheduleId)?.status ?? 'pending';
  }

  function getMedicineName(medicineId: string) {
    return medicines.find((medicine) => medicine.id === medicineId)?.name ?? 'Medicine removed';
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="MEDITRACK AI"
        title={`Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, ${profile.name.split(' ')[0]}`}
        subtitle={formatLongDate(now)}
        right={(
          <Pressable accessibilityLabel="Open profile" accessibilityRole="button" onPress={() => router.push('/profile')} style={styles.profileButton}>
            <Text style={styles.profileInitial}>{profile.name.trim().charAt(0).toUpperCase() || 'U'}</Text>
          </Pressable>
        )}
      />

      <View style={styles.welcomePanel}>
        <View style={styles.welcomeIcon}><AppIcon name="medicines" color={AppColors.white} size={22} /></View>
        <View style={styles.welcomeCopy}>
          <Text style={styles.welcomeTitle}>Small steps, steady care.</Text>
          <Text style={styles.welcomeSubtitle}>Your daily medication plan, in one clear view.</Text>
        </View>
        <AppIcon name="forward" color="#CDE5FF" size={18} />
      </View>

      <View style={styles.statsGrid}>
        <StatTile label="Scheduled" value={todaysSchedules.length} icon="schedule" tint={AppColors.bluePale} color={AppColors.blue} />
        <StatTile label="Taken" value={taken} icon="taken" tint={AppColors.tealPale} color={AppColors.teal} />
        <StatTile label="Missed" value={missed} icon="missed" tint={AppColors.redPale} color={AppColors.red} />
      </View>

      <Card style={styles.adherenceCard}>
        <View style={styles.adherenceHeader}>
          <View style={styles.adherenceCopy}>
            <Text style={styles.cardEyebrow}>TODAY&apos;S ADHERENCE</Text>
            <Text style={styles.adherenceCaption}>{taken} taken · {missed} missed · {pending} pending</Text>
          </View>
          <Text style={styles.adherenceValue}>{adherence}%</Text>
        </View>
        <ProgressBar value={adherence} />
        <Text style={commonTextStyles.muted}>Calculated from doses marked taken or missed.</Text>
      </Card>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Today&apos;s schedule" />
        {todaysSchedules.length === 0 ? (
          <Card><Text style={commonTextStyles.muted}>No active reminders yet. Add a medicine to get started.</Text></Card>
        ) : todaysSchedules
          .slice()
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              time={schedule.time}
              label={schedule.label}
              name={getMedicineName(schedule.medicineId)}
              dosage={medicines.find((medicine) => medicine.id === schedule.medicineId)?.dosage ?? ''}
              status={getStatus(schedule.id)}
              onTaken={() => { void updateDoseStatus(schedule.id, today, 'taken'); }}
              onMissed={() => { void updateDoseStatus(schedule.id, today, 'missed'); }}
              onUndo={() => { void updateDoseStatus(schedule.id, today, 'pending'); }}
            />
          ))}
      </View>

      <Card>
        <View style={styles.chartHeader}>
          <View>
            <SectionTitle title="Weekly adherence" />
            <Text style={commonTextStyles.muted}>Taken doses by day, based on demo records</Text>
          </View>
          <View style={styles.legend}><View style={styles.legendDot} /><Text style={styles.legendText}>Taken</Text></View>
        </View>
        <View style={styles.chart}>
          {weeklyData.map((day) => (
            <View key={day.date} style={styles.chartColumn}>
              <Text style={styles.chartPercent}>{day.completed ? `${day.adherence}%` : '—'}</Text>
              <View style={styles.chartTrack}>
                <View style={[styles.chartBar, { height: `${day.adherence}%` }]} />
              </View>
              <Text style={styles.chartDay}>{day.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.demoNote}>
        <AppIcon name="info" color={AppColors.blue} size={17} />
        <Text style={styles.demoNoteText}>Demo records only. A marked dose is your confirmation and does not verify medication intake.</Text>
      </View>
    </Screen>
  );
}

function StatTile({ label, value, icon, tint, color }: { label: string; value: number; icon: 'schedule' | 'taken' | 'missed'; tint: string; color: string }) {
  return (
    <Card style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}><AppIcon name={icon} color={color} size={18} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function ScheduleCard({
  time,
  label,
  name,
  dosage,
  status,
  onTaken,
  onMissed,
  onUndo,
}: {
  time: string;
  label: string;
  name: string;
  dosage: string;
  status: 'pending' | 'taken' | 'missed';
  onTaken: () => void;
  onMissed: () => void;
  onUndo: () => void;
}) {
  const statusColor = status === 'taken' ? AppColors.teal : status === 'missed' ? AppColors.red : AppColors.muted;
  const statusBackground = status === 'taken' ? AppColors.tealPale : status === 'missed' ? AppColors.redPale : AppColors.page;

  return (
    <Card style={styles.scheduleCard}>
      <View style={styles.scheduleTop}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeText}>{formatClock(time)}</Text>
          <Text style={styles.periodText}>{label}</Text>
        </View>
        <View style={styles.medicineBlock}>
          <Text style={styles.medicineName}>{name}</Text>
          <Text style={commonTextStyles.muted}>{dosage}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBackground }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        {status === 'pending' ? (
          <>
            <AppButton label="Taken" icon={<AppIcon name="taken" color={AppColors.white} size={16} />} onPress={onTaken} compact style={styles.actionButton} />
            <AppButton label="Missed" icon={<AppIcon name="missed" color={AppColors.red} size={16} />} onPress={onMissed} compact variant="danger" style={styles.actionButton} />
          </>
        ) : (
          <AppButton label="Change status" onPress={onUndo} compact variant="secondary" style={styles.actionButton} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  profileButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.bluePale, borderWidth: 1, borderColor: '#D5E6FC' },
  profileInitial: { color: AppColors.blueDark, fontSize: 17, fontWeight: '800' },
  welcomePanel: { minHeight: 96, padding: AppSpacing.lg, borderRadius: 18, backgroundColor: AppColors.blueDark, flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md },
  welcomeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  welcomeCopy: { flex: 1, gap: AppSpacing.xs },
  welcomeTitle: { color: AppColors.white, fontSize: 16, fontWeight: '800' },
  welcomeSubtitle: { color: '#D3E5FD', fontSize: 12, lineHeight: 17 },
  statsGrid: { flexDirection: 'row', gap: AppSpacing.sm },
  statTile: { flex: 1, minWidth: 0, alignItems: 'flex-start', padding: AppSpacing.md, gap: AppSpacing.xs },
  statIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: AppColors.ink, fontSize: 21, fontWeight: '800' },
  statLabel: { color: AppColors.muted, fontSize: 11, fontWeight: '600' },
  adherenceCard: { gap: AppSpacing.md },
  adherenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adherenceCopy: { gap: 5 },
  cardEyebrow: { color: AppColors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  adherenceCaption: { color: AppColors.ink, fontSize: 13, fontWeight: '600' },
  adherenceValue: { color: AppColors.blue, fontSize: 28, fontWeight: '800' },
  sectionBlock: { gap: AppSpacing.sm },
  scheduleCard: { gap: AppSpacing.md },
  scheduleTop: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md },
  timeBlock: { width: 70, gap: 3 },
  timeText: { color: AppColors.ink, fontSize: 13, fontWeight: '800' },
  periodText: { color: AppColors.muted, fontSize: 10 },
  medicineBlock: { flex: 1, gap: 3 },
  medicineName: { color: AppColors.ink, fontSize: 13, fontWeight: '700' },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: AppSpacing.sm },
  actionButton: { flex: 1 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: AppSpacing.sm },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: AppColors.blue },
  legendText: { color: AppColors.muted, fontSize: 10 },
  chart: { height: 138, flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingTop: 10 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  chartPercent: { color: AppColors.muted, fontSize: 9, height: 12 },
  chartTrack: { width: '62%', height: 88, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 9, backgroundColor: AppColors.track },
  chartBar: { width: '100%', minHeight: 3, borderRadius: 9, backgroundColor: AppColors.blue },
  chartDay: { color: AppColors.muted, fontSize: 10 },
  demoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: AppSpacing.sm, paddingHorizontal: 2 },
  demoNoteText: { flex: 1, color: AppColors.muted, fontSize: 11, lineHeight: 16 },
});