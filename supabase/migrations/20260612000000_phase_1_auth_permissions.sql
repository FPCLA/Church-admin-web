create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text,
  email text unique,
  active boolean not null default true,
  approved boolean not null default false,
  invited_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  last_login_at timestamptz,
  language_preference text not null default 'zh-TW',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name_zh text not null,
  display_name_en text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  active boolean not null default true,
  start_date date not null default current_date,
  end_date date,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  module_name text not null,
  can_preview boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_export boolean not null default false,
  can_import boolean not null default false,
  can_manage boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, module_name)
);

create table if not exists public.user_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_name text not null,
  can_preview boolean,
  can_create boolean,
  can_edit boolean,
  can_delete boolean,
  can_export boolean,
  can_import boolean,
  can_manage boolean,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_name)
);

create table if not exists public.record_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_name text not null,
  record_id uuid not null,
  can_preview boolean not null default false,
  can_edit boolean not null default false,
  can_manage boolean not null default false,
  start_date date not null default current_date,
  end_date date,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.change_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at before update on public.user_roles for each row execute function public.set_updated_at();

drop trigger if exists set_permissions_updated_at on public.permissions;
create trigger set_permissions_updated_at before update on public.permissions for each row execute function public.set_updated_at();

drop trigger if exists set_user_permission_overrides_updated_at on public.user_permission_overrides;
create trigger set_user_permission_overrides_updated_at before update on public.user_permission_overrides for each row execute function public.set_updated_at();

drop trigger if exists set_record_assignments_updated_at on public.record_assignments;
create trigger set_record_assignments_updated_at before update on public.record_assignments for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_permission_overrides enable row level security;
alter table public.record_assignments enable row level security;
alter table public.change_logs enable row level security;

alter table public.profiles force row level security;
alter table public.roles force row level security;
alter table public.user_roles force row level security;
alter table public.permissions force row level security;
alter table public.user_permission_overrides force row level security;
alter table public.record_assignments force row level security;
alter table public.change_logs force row level security;

create or replace function public.is_active_approved(check_user uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = check_user and p.active = true and p.approved = true
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
  end into override_value
  from public.user_permission_overrides upo
  where upo.user_id = check_user and upo.module_name = check_module
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
  ) into role_value;

  return coalesce(role_value, false);
end;
$$;

drop policy if exists profiles_select_own_or_manage on public.profiles;
create policy profiles_select_own_or_manage on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin() or public.has_module_permission('user_management', 'can_manage')
);

drop policy if exists profiles_manage on public.profiles;
create policy profiles_manage on public.profiles for all to authenticated using (
  public.is_admin() or public.has_module_permission('user_management', 'can_manage')
) with check (
  public.is_admin() or public.has_module_permission('user_management', 'can_manage')
);

drop policy if exists roles_select_approved on public.roles;
create policy roles_select_approved on public.roles for select to authenticated using (public.is_active_approved());

drop policy if exists roles_manage on public.roles;
create policy roles_manage on public.roles for all to authenticated using (
  public.is_admin() or public.has_module_permission('permission_management', 'can_manage')
) with check (
  public.is_admin() or public.has_module_permission('permission_management', 'can_manage')
);

drop policy if exists user_roles_select_own_or_manage on public.user_roles;
create policy user_roles_select_own_or_manage on public.user_roles for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or public.has_module_permission('user_management', 'can_manage') or public.has_module_permission('permission_management', 'can_manage')
);

drop policy if exists user_roles_manage on public.user_roles;
create policy user_roles_manage on public.user_roles for all to authenticated using (
  public.is_admin() or public.has_module_permission('user_management', 'can_manage') or public.has_module_permission('permission_management', 'can_manage')
) with check (
  public.is_admin() or public.has_module_permission('user_management', 'can_manage') or public.has_module_permission('permission_management', 'can_manage')
);

drop policy if exists permissions_select_approved on public.permissions;
create policy permissions_select_approved on public.permissions for select to authenticated using (public.is_active_approved());

drop policy if exists permissions_manage on public.permissions;
create policy permissions_manage on public.permissions for all to authenticated using (
  public.is_admin() or public.has_module_permission('permission_management', 'can_manage')
) with check (
  public.is_admin() or public.has_module_permission('permission_management', 'can_manage')
);

drop policy if exists overrides_select_own_or_manage on public.user_permission_overrides;
create policy overrides_select_own_or_manage on public.user_permission_overrides for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or public.has_module_permission('permission_management', 'can_manage')
);

drop policy if exists overrides_manage on public.user_permission_overrides;
create policy overrides_manage on public.user_permission_overrides for all to authenticated using (
  public.is_admin() or public.has_module_permission('permission_management', 'can_manage')
) with check (
  public.is_admin() or public.has_module_permission('permission_management', 'can_manage')
);

drop policy if exists record_assignments_select_own_or_manage on public.record_assignments;
create policy record_assignments_select_own_or_manage on public.record_assignments for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or public.has_module_permission(module_name, 'can_manage')
);

drop policy if exists record_assignments_manage on public.record_assignments;
create policy record_assignments_manage on public.record_assignments for all to authenticated using (
  public.is_admin() or public.has_module_permission(module_name, 'can_manage')
) with check (
  public.is_admin() or public.has_module_permission(module_name, 'can_manage')
);

drop policy if exists change_logs_select_manage on public.change_logs;
create policy change_logs_select_manage on public.change_logs for select to authenticated using (
  public.is_admin() or public.has_module_permission('change_logs', 'can_preview') or public.has_module_permission('change_logs', 'can_manage')
);

drop policy if exists change_logs_insert_self on public.change_logs;
create policy change_logs_insert_self on public.change_logs for insert to authenticated with check (
  changed_by = auth.uid() or public.is_admin() or public.has_module_permission('change_logs', 'can_manage')
);

insert into public.roles (name, display_name_zh, display_name_en, description)
values
  ('admin', '管理員', 'Admin', 'Full system administrator. Keep this role limited.'),
  ('session_member', '小會成員', 'Session Member', 'Session member.'),
  ('deacon_board', '執事會', 'Deacon Board', 'Deacon board member.'),
  ('sunday_school_teacher', '主日學老師', 'Sunday School Teacher', 'Sunday school teacher.'),
  ('sunday_school_coordinator', '主日學負責人', 'Sunday School Coordinator', 'Sunday school coordinator.'),
  ('speaker_coordinator', '講員安排負責人', 'Speaker Coordinator', 'Speaker coordinator.'),
  ('service_scheduler', '服事表負責人', 'Service Scheduler', 'Service scheduler.'),
  ('bulletin_editor', '週報負責人', 'Bulletin Editor', 'Bulletin editor.'),
  ('ministry_coworker', '其他同工', 'Ministry Coworker', 'Ministry coworker.'),
  ('viewer', '查看者', 'Viewer', 'Read-only viewer.')
on conflict (name) do update set
  display_name_zh = excluded.display_name_zh,
  display_name_en = excluded.display_name_en,
  description = excluded.description;

insert into public.permissions (
  role_id,
  module_name,
  can_preview,
  can_create,
  can_edit,
  can_delete,
  can_export,
  can_import,
  can_manage
)
select r.id, 'all', true, true, true, true, true, true, true
from public.roles r
where r.name = 'admin'
on conflict (role_id, module_name) do update set
  can_preview = excluded.can_preview,
  can_create = excluded.can_create,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_export = excluded.can_export,
  can_import = excluded.can_import,
  can_manage = excluded.can_manage;

insert into public.permissions (role_id, module_name, can_preview)
select r.id, 'dashboard', true
from public.roles r
on conflict (role_id, module_name) do update set can_preview = excluded.can_preview;
