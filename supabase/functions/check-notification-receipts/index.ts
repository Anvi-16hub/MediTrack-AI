import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: jsonHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cronSecret = Deno.env.get('NOTIFICATION_CRON_SECRET');
  if (!supabaseUrl || !serviceRoleKey || !cronSecret) {
    return Response.json({ error: 'Function secrets are not configured.' }, { status: 503, headers: jsonHeaders });
  }
  if ((request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') !== cronSecret) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: jsonHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: logs, error } = await admin.from('notification_delivery_logs')
    .select('id,event_id,expo_ticket_id,device_push_token_id')
    .eq('status', 'accepted')
    .not('expo_ticket_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(900);
  if (error) return Response.json({ error: 'Could not load delivery receipts.' }, { status: 500, headers: jsonHeaders });
  if (!logs?.length) return Response.json({ checked: 0 }, { headers: jsonHeaders });

  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
    },
    body: JSON.stringify({ ids: logs.map((log) => log.expo_ticket_id) }),
  });
  if (!response.ok) return Response.json({ error: `Expo receipts request failed (${response.status}).` }, { status: 502, headers: jsonHeaders });

  const body = await response.json();
  let delivered = 0;
  let failed = 0;
  for (const log of logs) {
    const receipt = body.data?.[log.expo_ticket_id];
    if (!receipt) continue;
    if (receipt.status === 'ok') {
      await admin.from('notification_delivery_logs').update({ status: 'delivered', error_code: null, error_message: null }).eq('id', log.id);
      delivered += 1;
      continue;
    }

    const errorCode = receipt.details?.error || receipt.message || 'ReceiptFailed';
    await admin.from('notification_delivery_logs').update({ status: 'failed', error_code: String(errorCode), error_message: receipt.message || 'Expo could not deliver this push.' }).eq('id', log.id);
    if (errorCode === 'DeviceNotRegistered') {
      await admin.from('device_push_tokens').update({ active: false }).eq('id', log.device_push_token_id);
      await admin.from('notification_events').update({ status: 'queued', available_at: new Date().toISOString(), last_error: 'A device token expired; waiting for an active linked device.' }).eq('id', log.event_id);
    }
    failed += 1;
  }

  return Response.json({ checked: logs.length, delivered, failed }, { headers: jsonHeaders });
});
