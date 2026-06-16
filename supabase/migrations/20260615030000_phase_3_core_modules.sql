create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text,
  event_date date,
  start_time time,
  end_time time,
  location text,
  event_type text,
  description text,
  notes text,
  status text,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sunday_school_classes (
  id uuid primary key default gen_random_uuid(),
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  class_name text,
  title text,
  class_date date,
  start_time time,
  end_time time,
  teacher_name text,
  assistant_name text,
  topic text,
  scripture text,
  location text,
  progress text,
  description text,
  notes text,
  status text,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.speakers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  notes text,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.speaker_assignments (
  id uuid primary key default gen_random_uuid(),
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  speaker_id uuid references public.speakers(id) on delete restrict,
  assignment_date date,
  meeting_type text,
  topic text,
  scripture text,
  confirmed_status text,
  notes text,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint speaker_assignments_confirmed_status_check
    check (confirmed_status is null or confirmed_status in ('pending', 'confirmed', 'declined'))
);

create table if not exists public.service_roles (
  id uuid primary key default gen_random_uuid(),
  name text unique,
  display_name_zh text,
  display_name_en text,
  description text,
  display_order integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_assignments (
  id uuid primary key default gen_random_uuid(),
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  service_date date,
  service_role_id uuid references public.service_roles(id) on delete restrict,
  person_name text,
  backup_person_name text,
  confirmed_status text,
  notes text,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_assignments_confirmed_status_check
    check (confirmed_status is null or confirmed_status in ('pending', 'confirmed', 'unavailable'))
);

create table if not exists public.bulletins (
  id uuid primary key default gen_random_uuid(),
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  bulletin_date date,
  title text,
  opening_text text,
  sunday_school_text text,
  worship_text text,
  announcements text,
  prayer_requests text,
  next_week_preview text,
  notes text,
  searchable_text text,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_calendar_events_updated_at on public.calendar_events;
create trigger set_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

drop trigger if exists set_sunday_school_classes_updated_at on public.sunday_school_classes;
create trigger set_sunday_school_classes_updated_at
before update on public.sunday_school_classes
for each row execute function public.set_updated_at();

drop trigger if exists set_speakers_updated_at on public.speakers;
create trigger set_speakers_updated_at
before update on public.speakers
for each row execute function public.set_updated_at();

drop trigger if exists set_speaker_assignments_updated_at on public.speaker_assignments;
create trigger set_speaker_assignments_updated_at
before update on public.speaker_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_service_roles_updated_at on public.service_roles;
create trigger set_service_roles_updated_at
before update on public.service_roles
for each row execute function public.set_updated_at();

drop trigger if exists set_service_assignments_updated_at on public.service_assignments;
create trigger set_service_assignments_updated_at
before update on public.service_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_bulletins_updated_at on public.bulletins;
create trigger set_bulletins_updated_at
before update on public.bulletins
for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;
alter table public.sunday_school_classes enable row level security;
alter table public.speakers enable row level security;
alter table public.speaker_assignments enable row level security;
alter table public.service_roles enable row level security;
alter table public.service_assignments enable row level security;
alter table public.bulletins enable row level security;

alter table public.calendar_events force row level security;
alter table public.sunday_school_classes force row level security;
alter table public.speakers force row level security;
alter table public.speaker_assignments force row level security;
alter table public.service_roles force row level security;
alter table public.service_assignments force row level security;
alter table public.bulletins force row level security;

create or replace function public.is_active_approved(check_user uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = check_user
      and p.active = true
      and p.approved = true
  );
$$;

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.user_id = p.id
    join public.roles r on r.id = ur.role_id
    where p.id = check_user
      and p.active = true
      and p.approved = true
      and ur.active = true
      and (ur.start_date is null or ur.start_date <= current_date)
      and (ur.end_date is null or ur.end_date >= current_date)
      and r.name = 'admin'
  );
$$;

create or replace function public.has_module_permission(
  check_module text,
  check_permission text,
  check_user uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  override_value boolean;
  role_value boolean;
begin
  if public.is_admin(check_user) then
    return true;
  end if;

  if not public.is_active_approved(check_user) then
    return false;
  end if;

  select case check_permission
    when 'can_preview' then upo.can_preview
    when 'can_create' then upo.can_create
    when 'can_edit' then upo.can_edit
    when 'can_delete' then upo.can_delete
    when 'can_export' then upo.can_export
    when 'can_import' then upo.can_import
    when 'can_manage' then upo.can_manage
    else false
  end
  into override_value
  from public.user_permission_overrides upo
  where upo.user_id = check_user
    and upo.module_name = check_module
  limit 1;

  if override_value is not null then
    return override_value;
  end if;

  select exists (
    select 1
    from public.user_roles ur
    join public.permissions p on p.role_id = ur.role_id
    where ur.user_id = check_user
      and ur.active = true
      and (ur.start_date is null or ur.start_date <= current_date)
      and (ur.end_date is null or ur.end_date >= current_date)
      and p.module_name in (check_module, 'all')
      and case check_permission
        when 'can_preview' then p.can_preview
        when 'can_create' then p.can_create
        when 'can_edit' then p.can_edit
        when 'can_delete' then p.can_delete
        when 'can_export' then p.can_export
        when 'can_import' then p.can_import
        when 'can_manage' then p.can_manage
        else false
      end = true
  )
  into role_value;

  return coalesce(role_value, false);
end;
$$;

create or replace function public.has_record_permission(
  check_module text,
  check_record_id uuid,
  check_permission text,
  check_user uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_module_permission(check_module, check_permission, check_user) then
    return true;
  end if;

  if not public.is_active_approved(check_user) then
    return false;
  end if;

  return exists (
    select 1
    from public.record_assignments ra
    where ra.user_id = check_user
      and ra.module_name = check_module
      and ra.record_id = check_record_id
      and (ra.start_date is null or ra.start_date <= current_date)
      and (ra.end_date is null or ra.end_date >= current_date)
      and case check_permission
        when 'can_preview' then ra.can_preview
        when 'can_edit' then ra.can_edit
        when 'can_manage' then ra.can_manage
        else false
      end = true
  );
end;
$$;

create or replace function public.install_phase3_module_policies(table_name text, module_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format('drop policy if exists %I on public.%I', table_name || '_select', table_name);
  execute format(
    'create policy %I on public.%I for select to authenticated using (public.has_module_permission(%L::text, %L::text, auth.uid()) or public.has_record_permission(%L::text, id, %L::text, auth.uid()))',
    table_name || '_select',
    table_name,
    module_name,
    'can_preview',
    module_name,
    'can_preview'
  );

  execute format('drop policy if exists %I on public.%I', table_name || '_insert', table_name);
  execute format(
    'create policy %I on public.%I for insert to authenticated with check (public.has_module_permission(%L::text, %L::text, auth.uid()))',
    table_name || '_insert',
    table_name,
    module_name,
    'can_create'
  );

  execute format('drop policy if exists %I on public.%I', table_name || '_update', table_name);
  execute format(
    'create policy %I on public.%I for update to authenticated using (public.has_module_permission(%L::text, %L::text, auth.uid()) or public.has_record_permission(%L::text, id, %L::text, auth.uid())) with check (public.has_module_permission(%L::text, %L::text, auth.uid()) or public.has_record_permission(%L::text, id, %L::text, auth.uid()))',
    table_name || '_update',
    table_name,
    module_name,
    'can_edit',
    module_name,
    'can_edit',
    module_name,
    'can_edit',
    module_name,
    'can_edit'
  );

  execute format('drop policy if exists %I on public.%I', table_name || '_delete', table_name);
  execute format(
    'create policy %I on public.%I for delete to authenticated using (public.has_module_permission(%L::text, %L::text, auth.uid()))',
    table_name || '_delete',
    table_name,
    module_name,
    'can_delete'
  );
end;
$$;

select public.install_phase3_module_policies('calendar_events', 'calendar_events');
select public.install_phase3_module_policies('sunday_school_classes', 'sunday_school_classes');
select public.install_phase3_module_policies('speakers', 'speakers');
select public.install_phase3_module_policies('speaker_assignments', 'speaker_assignments');
select public.install_phase3_module_policies('service_roles', 'service_roles');
select public.install_phase3_module_policies('service_assignments', 'service_assignments');
select public.install_phase3_module_policies('bulletins', 'bulletins');

drop function if exists public.install_phase3_module_policies(text, text);

insert into public.service_roles (name, display_name_zh, display_name_en, display_order, active)
values
  ('presider', '領會', 'Presider', 10, true),
  ('pianist', '司琴', 'Pianist', 20, true),
  ('worship', '詩歌', 'Worship', 30, true),
  ('usher', '招待', 'Usher', 40, true),
  ('av', '影音', 'AV', 50, true),
  ('attendance', '點名', 'Attendance', 60, true),
  ('childcare', '兒童照顧', 'Childcare', 70, true),
  ('cleaning', '清潔', 'Cleaning', 80, true),
  ('refreshments', '茶點', 'Refreshments', 90, true)
on conflict (name) do update
set
  display_name_zh = excluded.display_name_zh,
  display_name_en = excluded.display_name_en,
  display_order = excluded.display_order,
  active = excluded.active;

insert into public.service_roles (name, display_name_zh, display_name_en, display_order, active)
values
  ('presider', U&'\9818\6703', 'Presider', 10, true),
  ('pianist', U&'\53F8\7434', 'Pianist', 20, true),
  ('worship', U&'\8A69\6B4C', 'Worship', 30, true),
  ('usher', U&'\62DB\5F85', 'Usher', 40, true),
  ('av', U&'\5F71\97F3', 'AV', 50, true),
  ('attendance', U&'\9EDE\540D', 'Attendance', 60, true),
  ('childcare', U&'\5152\7AE5\7167\9867', 'Childcare', 70, true),
  ('cleaning', U&'\6E05\6F54', 'Cleaning', 80, true),
  ('refreshments', U&'\8336\9EDE', 'Refreshments', 90, true)
on conflict (name) do update
set
  display_name_zh = excluded.display_name_zh,
  display_name_en = excluded.display_name_en,
  display_order = excluded.display_order,
  active = excluded.active;
