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

with modules(module_name) as (
  values
    ('calendar_events'),
    ('sunday_school_classes'),
    ('speakers'),
    ('speaker_assignments'),
    ('service_roles'),
    ('service_assignments'),
    ('bulletins'),
    ('drive_files'),
    ('imports'),
    ('exports'),
    ('search'),
    ('user_management'),
    ('permission_management'),
    ('change_logs')
),
admin_role as (
  select id from public.roles where name = 'admin'
)
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
select
  admin_role.id,
  modules.module_name,
  true,
  true,
  true,
  true,
  true,
  true,
  true
from admin_role
cross join modules
on conflict (role_id, module_name) do update
set
  can_preview = excluded.can_preview,
  can_create = excluded.can_create,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_export = excluded.can_export,
  can_import = excluded.can_import,
  can_manage = excluded.can_manage;

with role_permissions(role_name, module_name, can_preview, can_create, can_edit, can_delete, can_export, can_import, can_manage) as (
  values
    ('session_member', 'calendar_events', true, false, false, false, false, false, false),
    ('session_member', 'sunday_school_classes', true, false, false, false, false, false, false),
    ('session_member', 'speaker_assignments', true, false, false, false, false, false, false),
    ('session_member', 'service_assignments', true, false, false, false, false, false, false),
    ('session_member', 'bulletins', true, false, false, false, false, false, false),
    ('session_member', 'drive_files', true, false, false, false, false, false, false),
    ('session_member', 'search', true, false, false, false, false, false, false),
    ('deacon_board', 'calendar_events', true, false, false, false, false, false, false),
    ('deacon_board', 'sunday_school_classes', true, false, false, false, false, false, false),
    ('deacon_board', 'speaker_assignments', true, false, false, false, false, false, false),
    ('deacon_board', 'service_assignments', true, false, false, false, false, false, false),
    ('deacon_board', 'bulletins', true, false, false, false, false, false, false),
    ('deacon_board', 'drive_files', true, false, false, false, false, false, false),
    ('deacon_board', 'search', true, false, false, false, false, false, false),
    ('sunday_school_teacher', 'calendar_events', true, false, false, false, false, false, false),
    ('sunday_school_teacher', 'sunday_school_classes', true, false, false, false, false, false, false),
    ('sunday_school_teacher', 'service_assignments', true, false, false, false, false, false, false),
    ('sunday_school_teacher', 'bulletins', true, false, false, false, false, false, false),
    ('sunday_school_teacher', 'search', true, false, false, false, false, false, false),
    ('sunday_school_coordinator', 'calendar_events', true, false, false, false, false, false, false),
    ('sunday_school_coordinator', 'sunday_school_classes', true, true, true, false, true, false, false),
    ('sunday_school_coordinator', 'speaker_assignments', true, false, false, false, false, false, false),
    ('sunday_school_coordinator', 'service_assignments', true, false, false, false, false, false, false),
    ('sunday_school_coordinator', 'bulletins', true, false, false, false, false, false, false),
    ('sunday_school_coordinator', 'search', true, false, false, false, false, false, false),
    ('speaker_coordinator', 'speakers', true, true, true, false, true, false, false),
    ('speaker_coordinator', 'speaker_assignments', true, true, true, false, true, false, false),
    ('service_scheduler', 'service_roles', true, true, true, false, true, false, false),
    ('service_scheduler', 'service_assignments', true, true, true, false, true, false, false),
    ('bulletin_editor', 'bulletins', true, true, true, false, true, false, false),
    ('viewer', 'calendar_events', true, false, false, false, false, false, false),
    ('viewer', 'sunday_school_classes', true, false, false, false, false, false, false),
    ('viewer', 'speaker_assignments', true, false, false, false, false, false, false),
    ('viewer', 'service_assignments', true, false, false, false, false, false, false),
    ('viewer', 'bulletins', true, false, false, false, false, false, false)
)
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
select
  roles.id,
  role_permissions.module_name,
  role_permissions.can_preview,
  role_permissions.can_create,
  role_permissions.can_edit,
  role_permissions.can_delete,
  role_permissions.can_export,
  role_permissions.can_import,
  role_permissions.can_manage
from role_permissions
join public.roles on roles.name = role_permissions.role_name
on conflict (role_id, module_name) do update
set
  can_preview = excluded.can_preview,
  can_create = excluded.can_create,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_export = excluded.can_export,
  can_import = excluded.can_import,
  can_manage = excluded.can_manage;
