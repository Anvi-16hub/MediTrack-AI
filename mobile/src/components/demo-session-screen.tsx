import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { AppButton, Card, Screen } from '@/components/app-ui';
import { AppColors, AppSpacing } from '@/constants/app-theme';

export function DemoSessionScreen({ onResume }: { onResume: () => void }) {
  return (
    <Screen>
      <View style={styles.wrapper}>
        <Card style={styles.card}>
          <View style={styles.iconBox}><AppIcon name="lock" color={AppColors.blue} size={25} /></View>
          <Text style={styles.title}>Demo session ended</Text>
          <Text style={styles.copy}>This is a local demo state. No authentication service is connected.</Text>
          <AppButton label="Resume demo session" icon={<AppIcon name="forward" color={AppColors.white} size={17} />} onPress={onResume} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, minHeight: 520, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 420, alignItems: 'center', padding: AppSpacing.xxl },
  iconBox: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.bluePale },
  title: { color: AppColors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  copy: { color: AppColors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});