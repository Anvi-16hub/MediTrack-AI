import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { AppButton, Card, FormField, PageHeader, Screen, SectionTitle } from '@/components/app-ui';
import { AppColors, AppSpacing, commonTextStyles } from '@/constants/app-theme';
import type { MedicineInput } from '@/data/meditrack-types';
import { useAppState } from '@/hooks/use-app-state';
import { formatClock } from '@/utils/dates';

const emptyForm: MedicineInput = { name: '', dosage: '', reminderTime: '', color: AppColors.blue };

export default function MedicinesScreen() {
  const { medicines, schedules, addMedicine, updateMedicine, deleteMedicine } = useAppState();
  const [form, setForm] = useState<MedicineInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setFormVisible(true);
  }

  function startEdit(medicineId: string) {
    const medicine = medicines.find((item) => item.id === medicineId);
    const schedule = schedules.find((item) => item.medicineId === medicineId);
    if (!medicine || !schedule) return;
    setEditingId(medicineId);
    setForm({ name: medicine.name, dosage: medicine.dosage, reminderTime: schedule.time, color: medicine.color });
    setErrors({});
    setFormVisible(true);
  }

  function updateField(field: keyof MedicineInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function saveMedicine() {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter a medicine name.';
    if (!form.dosage.trim()) nextErrors.dosage = 'Enter the prescribed dosage.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.reminderTime)) nextErrors.reminderTime = 'Use 24-hour time, for example 08:30.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const cleaned = { ...form, name: form.name.trim(), dosage: form.dosage.trim() };
    if (editingId) await updateMedicine(editingId, cleaned);
    else await addMedicine(cleaned);
    setFormVisible(false);
    setForm(emptyForm);
    setEditingId(null);
  }

  async function confirmDelete(medicineId: string) {
    await deleteMedicine(medicineId);
    setConfirmingId(null);
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="YOUR CARE PLAN"
        title="Medicines"
        subtitle={`${medicines.length} ${medicines.length === 1 ? 'medicine' : 'medicines'} in your list`}
        right={<AppButton label="Add medicine" compact icon={<AppIcon name="add" color={AppColors.white} size={17} />} onPress={startAdd} />}
      />

      <View style={styles.notice}>
        <AppIcon name="info" color={AppColors.blue} size={17} />
        <Text style={styles.noticeText}>Use the details from your prescription. MediTrack does not provide dosing advice.</Text>
      </View>

      {formVisible ? (
        <Card>
          <SectionTitle title={editingId ? 'Edit medicine' : 'Add a medicine'} />
          <FormField
            label="Medicine name"
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="e.g. Vitamin D3"
            error={errors.name}
            autoCapitalize="words"
            maxLength={70}
          />
          <FormField
            label="Dosage"
            value={form.dosage}
            onChangeText={(value) => updateField('dosage', value)}
            placeholder="e.g. 1 tablet"
            error={errors.dosage}
            maxLength={40}
          />
          <FormField
            label="Reminder time"
            value={form.reminderTime}
            onChangeText={(value) => updateField('reminderTime', value)}
            placeholder="08:30 (24-hour time)"
            error={errors.reminderTime}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            maxLength={5}
          />
          <View style={styles.formActions}>
            <AppButton label="Cancel" variant="secondary" onPress={() => { setFormVisible(false); setErrors({}); }} style={styles.formAction} />
            <AppButton label={editingId ? 'Save changes' : 'Add medicine'} onPress={() => { void saveMedicine(); }} style={styles.formAction} />
          </View>
        </Card>
      ) : null}

      <View style={styles.listHeader}>
        <SectionTitle title="Medicine list" />
        <Text style={commonTextStyles.muted}>Demo data</Text>
      </View>

      {medicines.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}><AppIcon name="medicines" color={AppColors.blue} size={22} /></View>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={[commonTextStyles.muted, styles.emptyCopy]}>Add a medicine to create a reminder schedule and track doses.</Text>
          <AppButton label="Add first medicine" icon={<AppIcon name="add" color={AppColors.white} size={17} />} onPress={startAdd} />
        </Card>
      ) : medicines.map((medicine) => {
        const schedule = schedules.find((item) => item.medicineId === medicine.id);
        const isConfirming = confirmingId === medicine.id;

        return (
          <Card key={medicine.id} style={styles.medicineCard}>
            <View style={styles.medicineMain}>
              <View style={[styles.medicineIcon, { backgroundColor: `${medicine.color}18` }]}>
                <AppIcon name="medicines" color={medicine.color} size={20} />
              </View>
              <View style={styles.medicineCopy}>
                <Text style={styles.medicineName}>{medicine.name}</Text>
                <Text style={commonTextStyles.muted}>{medicine.dosage}</Text>
                <View style={styles.timeRow}>
                  <AppIcon name="schedule" color={AppColors.blue} size={14} />
                  <Text style={styles.timeText}>{schedule ? formatClock(schedule.time) : 'No reminder'}</Text>
                  {schedule ? <Text style={styles.timeLabel}>{schedule.label}</Text> : null}
                </View>
              </View>
            </View>

            {isConfirming ? (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>Delete {medicine.name} and its demo dose history?</Text>
                <View style={styles.formActions}>
                  <AppButton label="Keep" variant="secondary" compact onPress={() => setConfirmingId(null)} style={styles.formAction} />
                  <AppButton label="Delete" variant="danger" compact onPress={() => { void confirmDelete(medicine.id); }} style={styles.formAction} />
                </View>
              </View>
            ) : (
              <View style={styles.medicineActions}>
                <AppButton label="Edit" variant="secondary" compact icon={<AppIcon name="edit" color={AppColors.ink} size={15} />} onPress={() => startEdit(medicine.id)} style={styles.medicineAction} />
                <AppButton label="Delete" variant="danger" compact icon={<AppIcon name="delete" color={AppColors.red} size={15} />} onPress={() => setConfirmingId(medicine.id)} style={styles.medicineAction} />
              </View>
            )}
          </Card>
        );
      })}

      <Text style={styles.disclaimer}>Demo information only. Confirm all medication instructions with your healthcare professional.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: AppSpacing.sm, padding: AppSpacing.md, borderRadius: 12, backgroundColor: AppColors.bluePale },
  noticeText: { flex: 1, color: AppColors.blueDark, fontSize: 11, lineHeight: 16 },
  formActions: { flexDirection: 'row', gap: AppSpacing.sm, marginTop: AppSpacing.xs },
  formAction: { flex: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCard: { alignItems: 'center', paddingVertical: AppSpacing.xxl },
  emptyIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: AppColors.bluePale, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: AppColors.ink, fontSize: 16, fontWeight: '800' },
  emptyCopy: { maxWidth: 250, textAlign: 'center' },
  medicineCard: { gap: AppSpacing.md },
  medicineMain: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md },
  medicineIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  medicineCopy: { flex: 1, gap: 4 },
  medicineName: { color: AppColors.ink, fontSize: 14, fontWeight: '800' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  timeText: { color: AppColors.blueDark, fontSize: 11, fontWeight: '700' },
  timeLabel: { color: AppColors.muted, fontSize: 10 },
  medicineActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: AppSpacing.sm, borderTopWidth: 1, borderTopColor: AppColors.line, paddingTop: AppSpacing.md },
  medicineAction: { minWidth: 94 },
  confirmBox: { gap: AppSpacing.sm, padding: AppSpacing.md, borderRadius: 12, backgroundColor: AppColors.redPale },
  confirmText: { color: AppColors.ink, fontSize: 12, lineHeight: 17 },
  disclaimer: { color: AppColors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 2 },
});