import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { AppButton, Card, FormField, PageHeader, Screen, SectionTitle } from '@/components/app-ui';
import { AppColors, AppSpacing, commonTextStyles } from '@/constants/app-theme';
import { useAppState } from '@/hooks/use-app-state';
import { useAuth } from '@/hooks/use-auth';

export default function ProfileScreen() {
  const {
    profile,
    notifications,
    caregiver,
    pendingCaregiverInvites,
    updateProfile,
    updateNotifications,
    updateCaregiver,
    acceptCaregiverInvite,
  } = useAppState();
  const { user, signOut, pushRegistrationMessage, registerPushToken, supabaseConfigured } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [profileError, setProfileError] = useState('');
  const [caregiverName, setCaregiverName] = useState(caregiver.name);
  const [caregiverEmail, setCaregiverEmail] = useState(caregiver.email);
  const [consentGiven, setConsentGiven] = useState(caregiver.consentGiven);
  const [caregiverMessage, setCaregiverMessage] = useState('');

  async function saveProfile() {
    if (name.trim().length < 2) {
      setProfileError('Enter a name with at least 2 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileError('Enter a valid demo email address.');
      return;
    }
    await updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
    setProfileError('');
    setEditingProfile(false);
  }

  async function saveCaregiver() {
    if (consentGiven && (!caregiverName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(caregiverEmail.trim()))) {
      setCaregiverMessage(user?.mode === 'supabase'
        ? 'Add the caregiver name and the email of an existing MediTrack account.'
        : 'Add a caregiver name and valid email before saving demo consent.');
      return;
    }
    await updateCaregiver({
      ...caregiver,
      name: caregiverName.trim(),
      email: caregiverEmail.trim().toLowerCase(),
      consentGiven,
    });
    setCaregiverMessage(user?.mode === 'supabase'
      ? consentGiven
        ? 'Invitation saved. Access becomes active only after the invited account accepts.'
        : 'Caregiver access is revoked.'
      : 'Demo settings saved locally. No information is actually shared.');
  }

  async function toggleNotification(key: 'remindersEnabled' | 'missedDoseAlerts', value: boolean) {
    await updateNotifications({ ...notifications, [key]: value });
  }

  return (
    <Screen>
      <PageHeader eyebrow="ACCOUNT & PREFERENCES" title="Profile" subtitle="Manage your demo profile and preferences" />

      <Card>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{profile.name.trim().charAt(0).toUpperCase() || 'U'}</Text></View>
          <View style={styles.profileSummary}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={commonTextStyles.muted}>{profile.email}</Text>
            <View style={[styles.demoBadge, user?.mode === 'supabase' && styles.supabaseBadge]}>
              <Text style={[styles.demoBadgeText, user?.mode === 'supabase' && styles.supabaseBadgeText]}>
                {user?.mode === 'supabase' ? 'SUPABASE ACCOUNT' : 'DEMO PROFILE'}
              </Text>
            </View>
          </View>
          {!editingProfile ? (
            <AppButton label="Edit" variant="secondary" compact icon={<AppIcon name="edit" color={AppColors.ink} size={15} />} onPress={() => setEditingProfile(true)} />
          ) : null}
        </View>

        {editingProfile ? (
          <View style={styles.formStack}>
            <FormField label="Display name" value={name} onChangeText={(value) => { setName(value); setProfileError(''); }} autoCapitalize="words" maxLength={70} />
            {user?.mode === 'demo' ? (
              <FormField label="Email" value={email} onChangeText={(value) => { setEmail(value); setProfileError(''); }} keyboardType="email-address" autoCapitalize="none" maxLength={120} />
            ) : (
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyLabel}>Email</Text>
                <Text style={styles.readOnlyValue}>{profile.email}</Text>
                <Text style={commonTextStyles.muted}>Email changes must be confirmed through Supabase Auth.</Text>
              </View>
            )}
            {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
            <View style={styles.actionRow}>
              <AppButton label="Cancel" variant="secondary" onPress={() => { setName(profile.name); setEmail(profile.email); setProfileError(''); setEditingProfile(false); }} style={styles.actionButton} />
              <AppButton label="Save profile" onPress={() => { void saveProfile(); }} style={styles.actionButton} />
            </View>
          </View>
        ) : null}
      </Card>

      {pendingCaregiverInvites.length > 0 ? (
        <Card>
          <SectionTitle title="Caregiver invitations" />
          {pendingCaregiverInvites.map((invite) => (
            <View key={invite.id} style={styles.invitationRow}>
              <View style={styles.invitationCopy}>
                <Text style={styles.preferenceTitle}>Invitation from {invite.patientName}</Text>
                <Text style={commonTextStyles.muted}>{invite.patientEmail}</Text>
                <Text style={commonTextStyles.muted}>
                  {invite.canManageMedicines || invite.canLogDoses ? 'View and update permissions' : 'View-only permission'}
                </Text>
              </View>
              <AppButton label="Accept" compact onPress={() => { void acceptCaregiverInvite(invite.id); }} />
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <View style={styles.cardHeading}>
          <View style={styles.sectionIcon}><AppIcon name="notifications" color={AppColors.blue} size={18} /></View>
          <View style={styles.headingCopy}>
            <SectionTitle title="Notification preferences" />
            <Text style={commonTextStyles.muted}>{user?.mode === 'supabase' ? 'Saved preferences; device permission and push credentials are also required.' : 'Demo preferences only; no notifications are sent.'}</Text>
          </View>
        </View>
        <PreferenceRow
          title="Medication reminders"
          subtitle={user?.mode === 'supabase' ? 'Used for scheduled dose notifications' : 'Demo preference only'}
          value={notifications.remindersEnabled}
          onValueChange={(value) => { void toggleNotification('remindersEnabled', value); }}
        />
        <PreferenceRow
          title="Missed-dose alerts"
          subtitle={user?.mode === 'supabase' ? 'Used for missed-dose alerts' : 'Demo preference only'}
          value={notifications.missedDoseAlerts}
          onValueChange={(value) => { void toggleNotification('missedDoseAlerts', value); }}
          last
        />
        {user?.mode === 'supabase' ? (
          <View style={styles.pushStatus}>
            <Text style={pushRegistrationMessage.includes('registered') ? styles.savedText : styles.errorText}>
              {pushRegistrationMessage || 'Checking device notification setup…'}
            </Text>
            <AppButton label="Register this device" variant="secondary" compact onPress={() => { void registerPushToken(); }} />
          </View>
        ) : null}
      </Card>

      <Card>
        <View style={styles.cardHeading}>
          <View style={[styles.sectionIcon, { backgroundColor: AppColors.tealPale }]}><AppIcon name="caregiver" color={AppColors.teal} size={18} /></View>
          <View style={styles.headingCopy}>
            <SectionTitle title="Caregiver access" />
            <Text style={commonTextStyles.muted}>{user?.mode === 'supabase' ? 'Sharing requires this consent and the caregiver accepting the invitation.' : 'Consent controls are simulated locally.'}</Text>
          </View>
        </View>
        <FormField label="Caregiver name" value={caregiverName} onChangeText={(value) => { setCaregiverName(value); setCaregiverMessage(''); }} placeholder="Optional" autoCapitalize="words" maxLength={70} />
        <FormField label="Caregiver email" value={caregiverEmail} onChangeText={(value) => { setCaregiverEmail(value); setCaregiverMessage(''); }} placeholder="name@example.test" keyboardType="email-address" autoCapitalize="none" maxLength={120} />
        <View style={styles.consentRow}>
          <View style={styles.consentCopy}>
            <Text style={styles.preferenceTitle}>{user?.mode === 'supabase' ? 'I consent to share with this caregiver' : 'I consent to demo sharing'}</Text>
            <Text style={commonTextStyles.muted}>{user?.mode === 'supabase' ? 'Only the selected permissions become active after acceptance.' : 'No real data or caregiver access is shared.'}</Text>
          </View>
          <Switch
            accessibilityLabel="Caregiver consent"
            value={consentGiven}
            onValueChange={(value) => { setConsentGiven(value); setCaregiverMessage(''); }}
            trackColor={{ false: '#D5DEE8', true: '#8DD4CA' }}
            thumbColor={consentGiven ? AppColors.teal : '#FFFFFF'}
          />
        </View>
        {caregiverMessage ? <Text style={caregiverMessage.startsWith('Add') ? styles.errorText : styles.savedText}>{caregiverMessage}</Text> : null}
        <AppButton label="Save caregiver settings" variant="secondary" onPress={() => { void saveCaregiver(); }} />
      </Card>

      <Card style={styles.sessionCard}>
        <View style={styles.cardHeading}>
          <View style={[styles.sectionIcon, { backgroundColor: AppColors.bluePale }]}><AppIcon name="lock" color={AppColors.blue} size={17} /></View>
          <View style={styles.headingCopy}>
            <SectionTitle title={user?.mode === 'supabase' ? 'Secure session' : 'Demo session'} />
            <Text style={commonTextStyles.muted}>{user?.mode === 'supabase' ? 'Authenticated by the configured Supabase project.' : 'No authentication service is configured.'}</Text>
          </View>
        </View>
        <View style={styles.sessionStatus}>
          <View style={[styles.sessionDot, { backgroundColor: AppColors.teal }]} />
          <Text style={styles.sessionStatusText}>{user?.mode === 'supabase' ? 'Account session active' : 'Local demo session active'}</Text>
        </View>
        <AppButton
          label="Log out"
          variant="danger"
          icon={<AppIcon name="logout" color={AppColors.red} size={16} />}
          onPress={() => { void signOut(); }}
        />
      </Card>

      <Text style={styles.footerNote}>{supabaseConfigured && user?.mode === 'supabase' ? 'Account data is shared through the configured project and protected by database policies.' : 'Demo profile, preferences, and caregiver settings exist only in this app session. They are not synced to a database.'}</Text>
    </Screen>
  );
}

function PreferenceRow({ title, subtitle, value, onValueChange, last = false }: { title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.preferenceRow, last && styles.preferenceRowLast]}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={commonTextStyles.muted}>{subtitle}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D5DEE8', true: '#8DD4CA' }}
        thumbColor={value ? AppColors.teal : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md },
  avatar: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: AppColors.bluePale },
  avatarText: { color: AppColors.blueDark, fontSize: 22, fontWeight: '800' },
  profileSummary: { flex: 1, gap: 4 },
  profileName: { color: AppColors.ink, fontSize: 16, fontWeight: '800' },
  demoBadge: { alignSelf: 'flex-start', marginTop: 2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: AppColors.tealPale },
  demoBadgeText: { color: AppColors.teal, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  supabaseBadge: { backgroundColor: AppColors.bluePale },
  supabaseBadgeText: { color: AppColors.blueDark },
  readOnlyField: { gap: AppSpacing.xs },
  readOnlyLabel: { color: AppColors.ink, fontSize: 12, fontWeight: '700' },
  readOnlyValue: { minHeight: 46, paddingHorizontal: AppSpacing.md, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: AppColors.line, backgroundColor: AppColors.page, color: AppColors.ink, fontSize: 14 },
  formStack: { gap: AppSpacing.md, borderTopWidth: 1, borderTopColor: AppColors.line, paddingTop: AppSpacing.md },
  errorText: { color: AppColors.red, fontSize: 11, lineHeight: 16 },
  savedText: { color: AppColors.teal, fontSize: 11, lineHeight: 16 },
  pushStatus: { gap: AppSpacing.sm, paddingTop: AppSpacing.sm, borderTopWidth: 1, borderTopColor: AppColors.line },
  invitationRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md, paddingVertical: AppSpacing.sm, borderBottomWidth: 1, borderBottomColor: AppColors.line },
  invitationCopy: { flex: 1, gap: 3 },
  actionRow: { flexDirection: 'row', gap: AppSpacing.sm },
  actionButton: { flex: 1 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: AppColors.bluePale, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 3 },
  preferenceRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md, borderBottomWidth: 1, borderBottomColor: AppColors.line, paddingVertical: AppSpacing.sm },
  preferenceRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  preferenceCopy: { flex: 1, gap: 3 },
  preferenceTitle: { color: AppColors.ink, fontSize: 12, fontWeight: '700' },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md, paddingVertical: AppSpacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: AppColors.line },
  consentCopy: { flex: 1, gap: 3 },
  sessionCard: { borderColor: '#D5E6FC' },
  sessionStatus: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.sm },
  sessionDot: { width: 8, height: 8, borderRadius: 5 },
  sessionStatusText: { color: AppColors.ink, fontSize: 12, fontWeight: '700' },
  footerNote: { color: AppColors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});