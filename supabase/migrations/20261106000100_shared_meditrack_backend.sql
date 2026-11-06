create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  condition text not null default '',
  prescribed_by text not null default '',
  dosage text not null default '',
  instructions text not null default '',
  schedule text[] not null default array[]::text[],
  reminder_times text[] not null default array[]::text[],
  start_date date,
  end_date date,
  color text not null default '#0ea5e9',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medicines_schedule_lengths_match check (cardinality(schedule) = cardinality(reminder_times)),
  constraint medicines_valid_dates check (end_date is null or start_date is null or end_date >= start_date),
  constraint medicines_id_user_id_unique unique (id, user_id)
);

create table if not exists public.dose_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  medicine_id uuid not null,
  medicine_name text not null default '',
  dose_date date not null,
  taken_at timestamptz,
  scheduled_time text not null,
  slot text not null,
  status text not null check (status in ('pending', 'taken', 'missed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dose_records_medicine_owner_fk foreign key (medicine_id, user_id)
    references public.medicines (id, user_id) on delete cascade,
  constraint dose_records_one_per_slot unique (medicine_id, dose_date, slot),
  constraint dose_records_taken_timestamp check (status <> 'taken' or taken_at is not null)
);

create table if not exists public.caregiver_access (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  patient_name text not null default '',
  patient_email text not null default '',
  caregiver_name text not null default '',
  caregiver_email text not null,
  caregiver_relationship text not null default '',
  caregiver_phone text not null default '',
  can_view boolean not null default true,
  can_manage_medicines boolean not null default false,
  can_log_doses boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  patient_consent_at timestamptz,
  caregiver_accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caregiver_access_not_self check (patient_id <> caregiver_id),
  constraint caregiver_access_active_requires_consent check (
    status <> 'active' or (patient_consent_at is not null and caregiver_accepted_at is not null and revoked_at is null)
  ),
  constraint caregiver_access_revoked_has_timestamp check (status <> 'revoked' or revoked_at is not null),
  constraint caregiver_access_pair_unique unique (patient_id, caregiver_id)
);

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id text not null,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_push_tokens_user_device_unique unique (user_id, device_id)
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  welcome_notifications boolean not null default true,
  medicine_update_notifications boolean not null default true,
  dose_reminder_notifications boolean not null default true,
  missed_dose_alerts boolean not null default true,
  caregiver_update_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (event_type in ('welcome', 'medicine_changed', 'dose_reminder', 'caregiver_update')),
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'suppressed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  device_push_token_id uuid not null references public.device_push_tokens (id) on delete cascade,
  expo_ticket_id text,
  status text not null default 'queued' check (status in ('queued', 'accepted', 'delivered', 'failed')),
  error_code text,
  error_message text,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_delivery_event_device_unique unique (event_id, device_push_token_id)
);

create index if not exists medicines_user_updated_idx on public.medicines (user_id, updated_at desc);
create index if not exists dose_records_user_date_idx on public.dose_records (user_id, dose_date desc);
create index if not exists caregiver_access_caregiver_status_idx on public.caregiver_access (caregiver_id, status);
create index if not exists device_push_tokens_user_active_idx on public.device_push_tokens (user_id) where active;
create index if not exists notification_events_queue_idx on public.notification_events (available_at, created_at) where status = 'queued';
create index if not exists notification_delivery_receipts_idx on public.notification_delivery_logs (created_at) where status = 'accepted' and expo_ticket_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.has_caregiver_permission(patient_uuid uuid, permission_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.caregiver_access ca
    where ca.patient_id = patient_uuid
      and ca.caregiver_id = auth.uid()
      and ca.status = 'active'
      and ca.revoked_at is null
      and ca.patient_consent_at is not null
      and ca.caregiver_accepted_at is not null
      and case permission_name
        when 'view' then ca.can_view
        when 'manage_medicines' then ca.can_manage_medicines
        when 'log_doses' then ca.can_log_doses
        else false
      end
  );
$$;

create or replace function public.guard_caregiver_access_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' or new.caregiver_accepted_at is not null then
      raise exception 'caregiver invitations must start pending and unaccepted';
    end if;
    return new;
  end if;

  if auth.uid() = old.patient_id then
    if new.caregiver_accepted_at is distinct from old.caregiver_accepted_at
      and new.caregiver_accepted_at is not null then
      raise exception 'only the caregiver can accept an invitation';
    end if;
    if row(new.caregiver_id, new.can_view, new.can_manage_medicines, new.can_log_doses)
      is distinct from row(old.caregiver_id, old.can_view, old.can_manage_medicines, old.can_log_doses) then
      new.caregiver_accepted_at := null;
      new.status := 'pending';
    end if;
  elsif auth.uid() = old.caregiver_id then
    if row(new.patient_id, new.caregiver_id, new.patient_name, new.patient_email,
      new.caregiver_name, new.caregiver_email, new.caregiver_relationship, new.caregiver_phone,
      new.can_view, new.can_manage_medicines, new.can_log_doses, new.patient_consent_at, new.revoked_at)
      is distinct from row(old.patient_id, old.caregiver_id, old.patient_name, old.patient_email,
      old.caregiver_name, old.caregiver_email, old.caregiver_relationship, old.caregiver_phone,
      old.can_view, old.can_manage_medicines, old.can_log_doses, old.patient_consent_at, old.revoked_at) then
      raise exception 'caregivers may only accept their own invitation';
    end if;
  else
    raise exception 'caregiver access changes require a participant';
  end if;

  if new.revoked_at is not null then
    new.status := 'revoked';
    new.caregiver_accepted_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.has_caregiver_permission(uuid, text) from public, anon;
grant execute on function public.has_caregiver_permission(uuid, text) to authenticated, service_role;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update
    set email = excluded.email,
        full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_events (recipient_user_id, actor_user_id, event_type, payload, dedupe_key)
  values (new.id, new.id, 'welcome', '{}'::jsonb, 'welcome:' || new.id::text)
  on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles
  set email = new.email,
      full_name = coalesce(new.raw_user_meta_data ->> 'full_name', full_name)
  where id = new.id;
  return new;
end;
$$;

create or replace function public.enqueue_due_dose_events()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer := 0;
begin
  with due_slots as (
    select
      m.user_id,
      m.id as medicine_id,
      m.name as medicine_name,
      slot_data.slot,
      slot_data.reminder_time,
      local_clock.local_date
    from public.medicines m
    join public.profiles p on p.id = m.user_id
    cross join lateral unnest(m.schedule, m.reminder_times) as slot_data(slot, reminder_time)
    cross join lateral (select now() at time zone coalesce(nullif(p.timezone, ''), 'UTC') as local_now) local_clock_value
    cross join lateral (select local_clock_value.local_now::date as local_date, local_clock_value.local_now::time as local_time) local_clock
    where (m.start_date is null or m.start_date <= local_clock.local_date)
      and (m.end_date is null or m.end_date >= local_clock.local_date)
      and left(slot_data.reminder_time, 5) = to_char(local_clock.local_time, 'HH24:MI')
      and not exists (
        select 1 from public.dose_records dr
        where dr.user_id = m.user_id
          and dr.medicine_id = m.id
          and dr.dose_date = local_clock.local_date
          and dr.slot = slot_data.slot
          and dr.status in ('taken', 'missed')
      )
  )
  insert into public.notification_events (recipient_user_id, event_type, payload, dedupe_key)
  select
    user_id,
    'dose_reminder',
    jsonb_build_object('medicine_id', medicine_id, 'medicine_name', medicine_name, 'slot', slot, 'scheduled_time', reminder_time),
    'dose:' || medicine_id::text || ':' || local_date::text || ':' || slot
  from due_slots
  on conflict (dedupe_key) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.claim_notification_events(p_recipient_user_id uuid default null, p_limit integer default 50)
returns setof public.notification_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  update public.notification_events
  set status = 'failed', last_error = coalesce(last_error, 'Maximum delivery attempts reached.'), updated_at = now()
  where attempts >= 10
    and (status = 'queued' or (status = 'processing' and updated_at < now() - interval '10 minutes'));

  return query
  with candidates as (
      select e.id
      from public.notification_events e
      where (e.status = 'queued' or (e.status = 'processing' and e.updated_at < now() - interval '10 minutes'))
      and e.available_at <= now()
      and e.attempts < 10
      and (p_recipient_user_id is null or e.recipient_user_id = p_recipient_user_id)
    order by e.created_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
  )
  update public.notification_events e
  set status = 'processing', attempts = e.attempts + 1, updated_at = now()
  from candidates c
  where e.id = c.id
  returning e.*;
end;
$$;

revoke all on function public.enqueue_due_dose_events() from public, anon, authenticated;
revoke all on function public.claim_notification_events(uuid, integer) from public, anon, authenticated;
grant execute on function public.enqueue_due_dose_events() to service_role;
grant execute on function public.claim_notification_events(uuid, integer) to service_role;

create or replace function public.invite_caregiver_by_email(
  p_email text,
  p_caregiver_name text,
  p_can_view boolean default true,
  p_can_manage_medicines boolean default false,
  p_can_log_doses boolean default false,
  p_patient_consent boolean default false,
  p_caregiver_relationship text default '',
  p_caregiver_phone text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caregiver_uuid uuid;
  access_uuid uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select u.id into caregiver_uuid
  from auth.users u
  where lower(u.email) = lower(trim(p_email)) and u.id <> auth.uid()
  limit 1;

  if caregiver_uuid is null then
    raise exception 'No MediTrack account found for that email.';
  end if;

  insert into public.caregiver_access (
    patient_id, caregiver_id, patient_name, patient_email, caregiver_name, caregiver_email, caregiver_relationship, caregiver_phone,
    can_view, can_manage_medicines, can_log_doses, patient_consent_at,
    caregiver_accepted_at, status, revoked_at
  ) values (
    auth.uid(), caregiver_uuid,
    coalesce((select p.full_name from public.profiles p where p.id = auth.uid()), ''),
    coalesce((select p.email from public.profiles p where p.id = auth.uid()), ''),
    coalesce(trim(p_caregiver_name), ''), lower(trim(p_email)),
    coalesce(trim(p_caregiver_relationship), ''), coalesce(trim(p_caregiver_phone), ''),
    coalesce(p_can_view, false), coalesce(p_can_manage_medicines, false), coalesce(p_can_log_doses, false),
    case when p_patient_consent then now() else null end,
    null, 'pending', null
  )
  on conflict (patient_id, caregiver_id) do update set
    patient_name = excluded.patient_name,
    patient_email = excluded.patient_email,
    caregiver_name = excluded.caregiver_name,
    caregiver_email = excluded.caregiver_email,
    caregiver_relationship = excluded.caregiver_relationship,
    caregiver_phone = excluded.caregiver_phone,
    can_view = excluded.can_view,
    can_manage_medicines = excluded.can_manage_medicines,
    can_log_doses = excluded.can_log_doses,
    patient_consent_at = excluded.patient_consent_at,
    caregiver_accepted_at = null,
    status = 'pending',
    revoked_at = null,
    updated_at = now()
  returning id into access_uuid;

  return access_uuid;
end;
$$;

create or replace function public.accept_caregiver_invite(p_access_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_id uuid;
begin
  update public.caregiver_access ca
  set caregiver_accepted_at = now(),
      status = 'active',
      updated_at = now()
  where ca.id = p_access_id
    and ca.caregiver_id = auth.uid()
    and ca.patient_consent_at is not null
    and ca.revoked_at is null
    and ca.status = 'pending'
  returning ca.id into updated_id;

  if updated_id is null then
    raise exception 'invite not found, consent is missing, or invite is no longer active';
  end if;
end;
$$;

revoke all on function public.invite_caregiver_by_email(text, text, boolean, boolean, boolean, boolean, text, text) from public, anon;
revoke all on function public.accept_caregiver_invite(uuid) from public, anon;
grant execute on function public.invite_caregiver_by_email(text, text, boolean, boolean, boolean, boolean, text, text) to authenticated;
grant execute on function public.accept_caregiver_invite(uuid) to authenticated;

create or replace function public.enqueue_medicine_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  target_event_type text;
  action_name text;
begin
  if tg_op = 'UPDATE' and row(new.name, new.condition, new.prescribed_by, new.dosage, new.instructions, new.schedule, new.reminder_times, new.start_date, new.end_date)
    is not distinct from row(old.name, old.condition, old.prescribed_by, old.dosage, old.instructions, old.schedule, old.reminder_times, old.start_date, old.end_date) then
    return new;
  end if;

  if actor is not null and actor <> new.user_id then
    if not public.has_caregiver_permission(new.user_id, 'manage_medicines') then
      return new;
    end if;
    target_event_type := 'caregiver_update';
  else
    target_event_type := 'medicine_changed';
  end if;

  action_name := case when tg_op = 'INSERT' then 'added' else 'updated' end;

  insert into public.notification_events (recipient_user_id, actor_user_id, event_type, payload, dedupe_key)
  values (
    new.user_id,
    actor,
    target_event_type,
    jsonb_build_object('medicine_id', new.id, 'medicine_name', new.name, 'action', action_name),
    'medicine:' || new.id::text || ':' || new.updated_at::text
  )
  on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

create or replace function public.enqueue_caregiver_dose_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or actor = new.user_id or not public.has_caregiver_permission(new.user_id, 'log_doses') then
    return new;
  end if;

  insert into public.notification_events (recipient_user_id, actor_user_id, event_type, payload, dedupe_key)
  values (
    new.user_id,
    actor,
    'caregiver_update',
    jsonb_build_object('medicine_name', new.medicine_name, 'slot', new.slot, 'status', new.status),
    'caregiver-dose:' || new.id::text || ':' || new.updated_at::text
  )
  on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

create or replace function public.enqueue_caregiver_access_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.notification_events (recipient_user_id, actor_user_id, event_type, payload, dedupe_key)
    values (
      new.patient_id,
      auth.uid(),
      'caregiver_update',
      jsonb_build_object('caregiver_name', new.caregiver_name, 'action', 'accepted'),
      'caregiver-access:' || new.id::text || ':' || new.updated_at::text
    )
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
create trigger auth_user_updated_profile
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_auth_user_updated();

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger medicines_set_updated_at before update on public.medicines
  for each row execute function public.set_updated_at();
create trigger dose_records_set_updated_at before update on public.dose_records
  for each row execute function public.set_updated_at();
create trigger caregiver_access_set_updated_at before update on public.caregiver_access
  for each row execute function public.set_updated_at();
create trigger caregiver_access_guard_changes before insert or update on public.caregiver_access
  for each row execute function public.guard_caregiver_access_changes();
create trigger device_push_tokens_set_updated_at before update on public.device_push_tokens
  for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();
create trigger notification_events_set_updated_at before update on public.notification_events
  for each row execute function public.set_updated_at();
create trigger notification_delivery_logs_set_updated_at before update on public.notification_delivery_logs
  for each row execute function public.set_updated_at();

create trigger medicines_notification_event
  after insert or update on public.medicines
  for each row execute function public.enqueue_medicine_notification();
create trigger caregiver_dose_notification_event
  after insert or update on public.dose_records
  for each row execute function public.enqueue_caregiver_dose_update();
create trigger caregiver_access_notification_event
  after insert or update on public.caregiver_access
  for each row execute function public.enqueue_caregiver_access_update();

alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.dose_records enable row level security;
alter table public.caregiver_access enable row level security;
alter table public.device_push_tokens enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_delivery_logs enable row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert on public.profiles to authenticated;
grant update (full_name, timezone) on public.profiles to authenticated;
grant select, insert, update, delete on public.medicines, public.dose_records to authenticated;
grant select, insert, update, delete on public.caregiver_access to authenticated;
grant select, update on public.device_push_tokens to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant select on public.notification_events, public.notification_delivery_logs to authenticated;
grant all on public.profiles, public.medicines, public.dose_records, public.caregiver_access,
  public.device_push_tokens, public.notification_preferences, public.notification_events,
  public.notification_delivery_logs to service_role;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy medicines_select_owner_or_shared on public.medicines for select to authenticated
  using (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'view'));
create policy medicines_insert_owner_or_authorized_caregiver on public.medicines for insert to authenticated
  with check (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'manage_medicines'));
create policy medicines_update_owner_or_authorized_caregiver on public.medicines for update to authenticated
  using (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'manage_medicines'))
  with check (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'manage_medicines'));
create policy medicines_delete_owner_or_authorized_caregiver on public.medicines for delete to authenticated
  using (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'manage_medicines'));

create policy dose_records_select_owner_or_shared on public.dose_records for select to authenticated
  using (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'view'));
create policy dose_records_insert_owner_or_authorized_caregiver on public.dose_records for insert to authenticated
  with check (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'log_doses'));
create policy dose_records_update_owner_or_authorized_caregiver on public.dose_records for update to authenticated
  using (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'log_doses'))
  with check (user_id = auth.uid() or public.has_caregiver_permission(user_id, 'log_doses'));
create policy dose_records_delete_owner on public.dose_records for delete to authenticated using (user_id = auth.uid());

create policy caregiver_access_select_participants on public.caregiver_access for select to authenticated
  using (patient_id = auth.uid() or caregiver_id = auth.uid());
create policy caregiver_access_insert_patient on public.caregiver_access for insert to authenticated
  with check (patient_id = auth.uid() and caregiver_id <> auth.uid() and status = 'pending' and caregiver_accepted_at is null);
create policy caregiver_access_update_patient on public.caregiver_access for update to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy caregiver_access_delete_patient on public.caregiver_access for delete to authenticated
  using (patient_id = auth.uid());

create policy device_push_tokens_select_own on public.device_push_tokens for select to authenticated using (user_id = auth.uid());
create policy device_push_tokens_update_own on public.device_push_tokens for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notification_preferences_select_own on public.notification_preferences for select to authenticated using (user_id = auth.uid());
create policy notification_preferences_insert_own on public.notification_preferences for insert to authenticated with check (user_id = auth.uid());
create policy notification_preferences_update_own on public.notification_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notification_events_select_recipient on public.notification_events for select to authenticated
  using (recipient_user_id = auth.uid());
create policy notification_delivery_logs_select_recipient on public.notification_delivery_logs for select to authenticated
  using (recipient_user_id = auth.uid());

comment on table public.medicines is 'Shared website/mobile medicine rows. Schedule and reminder arrays are paired by index to match current app contracts.';
comment on table public.notification_events is 'Transactional outbox. Database triggers enqueue events; only server-side workers can claim or send them.';

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['medicines', 'dose_records', 'caregiver_access', 'notification_preferences'] loop
      begin
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      exception when duplicate_object then
        null;
      end;
    end loop;
  end if;
end;
$$;
comment on table public.device_push_tokens is 'One row per authenticated user device. Expo push tokens are private and must never be logged or returned to other users.';
