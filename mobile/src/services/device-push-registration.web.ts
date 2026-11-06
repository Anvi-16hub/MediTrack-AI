export async function registerDevicePushToken() {
  return { success: false, message: 'Remote push token registration is available in the iOS or Android app, not the web preview.' };
}

export function listenForPushTokenChanges() {
  return { remove() {} };
}

export async function deactivateDevicePushToken() {}
