import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const DEVICE_ID_KEY = 'meditrack-device-id';

async function getDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}

async function uploadExpoToken(userId: string, expoPushToken: string, deviceId: string) {
  if (!supabase) return { success: false, message: 'Supabase is not configured.' };
  const { error } = await supabase.functions.invoke('register-device', {
    body: { expoPushToken, deviceId, platform: Platform.OS },
  });
  if (error) return { success: false, message: 'Push token could not be saved. Check that the register-device function is deployed.' };
  return { success: true, message: 'This device is registered for push notifications.' };
}

export async function registerDevicePushToken(userId: string) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { success: false, message: 'Remote push tokens are supported in the iOS and Android apps, not the web preview.' };
  }
  if (!supabase) return { success: false, message: 'Supabase is not configured.' };

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return { success: false, message: 'Add your EAS project ID after creating the Expo project before requesting a push token.' };
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const alreadyAllowed = existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    const permission = alreadyAllowed ? existing : await Notifications.requestPermissionsAsync();
    const allowed = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!allowed) return { success: false, message: 'Notification permission was not granted.' };

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return await uploadExpoToken(userId, token.data, await getDeviceId());
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Push token registration failed. Try again when online.',
    };
  }
}

export function listenForPushTokenChanges(userId: string) {
  if ((Platform.OS !== 'ios' && Platform.OS !== 'android') || !supabase) return { remove() {} };
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return { remove() {} };

  return Notifications.addPushTokenListener((devicePushToken) => {
    void (async () => {
      try {
        const token = await Notifications.getExpoPushTokenAsync({ projectId, devicePushToken });
        await uploadExpoToken(userId, token.data, await getDeviceId());
      } catch {
        // A later app launch or network reconnect will retry registration.
      }
    })();
  });
}

export async function deactivateDevicePushToken(userId: string) {
  if (!supabase || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;
  try {
    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!deviceId) return;
    await supabase
      .from('device_push_tokens')
      .update({ active: false })
      .eq('user_id', userId)
      .eq('device_id', deviceId);
  } catch {
    // Sign-out still proceeds when the device is offline; stale tokens are pruned by server receipts.
  }
}
