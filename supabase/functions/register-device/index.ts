import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

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
  const accessToken = authorization.replace(/^Bearer\s+/i, '');
  if (!accessToken) return Response.json({ error: 'Authentication required.' }, { status: 401, headers: jsonHeaders });

  const callerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } } });
  const { data: userData, error: userError } = await callerClient.auth.getUser(accessToken);
  if (userError || !userData.user) return Response.json({ error: 'Invalid session.' }, { status: 401, headers: jsonHeaders });

  let body: { expoPushToken?: unknown; deviceId?: unknown; platform?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400, headers: jsonHeaders });
  }

  const expoPushToken = typeof body.expoPushToken === 'string' ? body.expoPushToken : '';
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
  const platform = body.platform;
  if (!/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/.test(expoPushToken)
    || deviceId.length < 8 || deviceId.length > 160
    || (platform !== 'ios' && platform !== 'android')) {
    return Response.json({ error: 'Invalid device registration.' }, { status: 400, headers: jsonHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: tokenOwner, error: ownerError } = await admin.from('device_push_tokens')
    .select('id,user_id,active').eq('expo_push_token', expoPushToken).maybeSingle();
  if (ownerError) return Response.json({ error: 'Could not validate this device token.' }, { status: 500, headers: jsonHeaders });
  if (tokenOwner && tokenOwner.user_id !== userData.user.id && tokenOwner.active) {
    return Response.json({ error: 'This device token is still linked to another account. Sign out from that account and retry.' }, { status: 409, headers: jsonHeaders });
  }

  const tokenRow = {
    user_id: userData.user.id,
    device_id: deviceId,
    expo_push_token: expoPushToken,
    platform,
    active: true,
    last_seen_at: new Date().toISOString(),
  };
  const saveResult = tokenOwner
    ? await admin.from('device_push_tokens').update(tokenRow).eq('id', tokenOwner.id)
    : await admin.from('device_push_tokens').upsert(tokenRow, { onConflict: 'user_id,device_id' });
  const saveError = saveResult.error;

  if (saveError) {
    return Response.json({ error: 'Device token could not be saved. If this device was previously linked to another account, sign out there first.' }, { status: 409, headers: jsonHeaders });
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/dispatch-notifications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch {
    // Queued welcome events remain available for the scheduled worker retry.
  }

  return Response.json({ registered: true }, { headers: jsonHeaders });
});
