import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

type NotificationEvent = {
  id: string;
  recipient_user_id: string;
  event_type: 'welcome' | 'medicine_changed' | 'dose_reminder' | 'caregiver_update';
  payload: Record<string, unknown>;
};

function messageFor(event: NotificationEvent) {
  switch (event.event_type) {
    case 'welcome':
      return { title: 'Welcome to MediTrack AI', body: 'Your MediTrack account is ready.' };
    case 'medicine_changed':
      return { title: 'Medication list updated', body: 'Your medication plan was changed on a linked device.' };
    case 'dose_reminder':
      return { title: 'Medication reminder', body: 'A scheduled medication dose is due.' };
    case 'caregiver_update':
      return { title: 'Caregiver update', body: 'An authorized caregiver updated your medication information.' };
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: jsonHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return Response.json({ error: 'Function secrets are not configured.' }, { status: 503, headers: jsonHeaders });
  }

  const authorization = request.headers.get('Authorization') || '';
  const bearer = authorization.replace(/^Bearer\s+/i, '');
  const cronSecret = Deno.env.get('NOTIFICATION_CRON_SECRET');
  const isScheduledWorker = Boolean(cronSecret && bearer === cronSecret);
  let recipientUserId: string | null = null;

  if (!isScheduledWorker) {
    if (!bearer) return Response.json({ error: 'Authentication required.' }, { status: 401, headers: jsonHeaders });
    const caller = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await caller.auth.getUser(bearer);
    if (error || !data.user) return Response.json({ error: 'Invalid session.' }, { status: 401, headers: jsonHeaders });
    recipientUserId = data.user.id;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  if (isScheduledWorker) {
    const { error } = await admin.rpc('enqueue_due_dose_events');
    if (error) console.error('Could not enqueue due dose events:', error.message);
  }

  const { data: events, error: claimError } = await admin.rpc('claim_notification_events', {
    p_recipient_user_id: recipientUserId,
    p_limit: 50,
  });
  if (claimError) {
    console.error('Could not claim notification events:', claimError.message);
    return Response.json({ error: 'Could not claim notification events.' }, { status: 500, headers: jsonHeaders });
  }

  let acceptedCount = 0;
  let deferredCount = 0;
  for (const event of (events || []) as NotificationEvent[]) {
    const { data: preferences } = await admin.from('notification_preferences')
      .select('*').eq('user_id', event.recipient_user_id).maybeSingle();
    const enabled = event.event_type === 'welcome' ? preferences?.welcome_notifications !== false
      : event.event_type === 'medicine_changed' ? preferences?.medicine_update_notifications !== false
      : event.event_type === 'dose_reminder' ? preferences?.dose_reminder_notifications !== false
      : preferences?.caregiver_update_notifications !== false;

    if (!enabled) {
      await admin.from('notification_events').update({ status: 'suppressed', last_error: null }).eq('id', event.id);
      continue;
    }

    const { data: devices, error: deviceError } = await admin.from('device_push_tokens')
      .select('id,expo_push_token').eq('user_id', event.recipient_user_id).eq('active', true);
    if (deviceError) {
      await admin.from('notification_events').update({ status: 'queued', available_at: new Date(Date.now() + 60_000).toISOString(), last_error: deviceError.message }).eq('id', event.id);
      deferredCount += 1;
      continue;
    }
    if (!devices?.length) {
      await admin.from('notification_events').update({ status: 'queued', available_at: new Date(Date.now() + 300_000).toISOString(), last_error: null }).eq('id', event.id);
      deferredCount += 1;
      continue;
    }

    const message = messageFor(event);
    let eventFailed = false;
    let eventHasAcceptedTicket = false;
    for (const device of devices) {
      const { data: previous } = await admin.from('notification_delivery_logs')
        .select('id,status,attempts').eq('event_id', event.id).eq('device_push_token_id', device.id).maybeSingle();
      if (previous?.status === 'accepted' || previous?.status === 'delivered') {
        eventHasAcceptedTicket = true;
        continue;
      }

      const { data: log, error: logError } = await admin.from('notification_delivery_logs').upsert({
        event_id: event.id,
        recipient_user_id: event.recipient_user_id,
        device_push_token_id: device.id,
        status: 'queued',
        expo_ticket_id: null,
        error_code: null,
        error_message: null,
        attempts: (previous?.attempts || 0) + 1,
      }, { onConflict: 'event_id,device_push_token_id' }).select('id').single();
      if (logError || !log) {
        eventFailed = true;
        continue;
      }

      try {
        const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
            ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
          },
          body: JSON.stringify({
            to: device.expo_push_token,
            sound: 'default',
            title: message.title,
            body: message.body,
            data: { eventId: event.id, eventType: event.event_type },
          }),
        });
        const responseBody = await response.json();
        const ticket = Array.isArray(responseBody.data) ? responseBody.data[0] : responseBody.data;
        if (!response.ok || ticket?.status !== 'ok') {
          const errorCode = ticket?.details?.error || responseBody.errors?.[0]?.code || 'PushSendFailed';
          const errorMessage = ticket?.message || responseBody.errors?.[0]?.message || `Expo push request failed (${response.status}).`;
          await admin.from('notification_delivery_logs').update({ status: 'failed', error_code: errorCode, error_message: errorMessage }).eq('id', log.id);
          if (errorCode === 'DeviceNotRegistered') {
            await admin.from('device_push_tokens').update({ active: false }).eq('id', device.id);
          } else {
            eventFailed = true;
          }
          continue;
        }

        await admin.from('notification_delivery_logs').update({ status: 'accepted', expo_ticket_id: ticket.id }).eq('id', log.id);
        eventHasAcceptedTicket = true;
        acceptedCount += 1;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Expo push request failed.';
        await admin.from('notification_delivery_logs').update({ status: 'failed', error_code: 'NetworkError', error_message: errorMessage }).eq('id', log.id);
        eventFailed = true;
      }
    }

    if (eventFailed) {
      await admin.from('notification_events').update({ status: 'queued', available_at: new Date(Date.now() + 60_000).toISOString(), last_error: 'One or more device deliveries need retry.' }).eq('id', event.id);
      deferredCount += 1;
    } else if (eventHasAcceptedTicket) {
      await admin.from('notification_events').update({ status: 'sent', last_error: null }).eq('id', event.id);
    } else {
      await admin.from('notification_events').update({ status: 'queued', available_at: new Date(Date.now() + 300_000).toISOString(), last_error: null }).eq('id', event.id);
      deferredCount += 1;
    }
  }

  return Response.json({ processed: events?.length || 0, accepted: acceptedCount, deferred: deferredCount }, { headers: jsonHeaders });
});
