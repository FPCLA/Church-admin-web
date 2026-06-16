# FPCLA Church Admin Web

Next.js App Router + TypeScript + Supabase Auth/RLS + i18n + PWA.

Production deployment: https://church-admin-web.vercel.app

## Local Development

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=
NEXT_PUBLIC_DEFAULT_LOCALE=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in client components, browser bundles, or public logs.

## Supabase Migrations

Phase 1:

```bash
supabase/migrations/20260612000000_phase_1_auth_permissions.sql
```

Phase 2:

```bash
supabase/migrations/20260612010000_phase_2_admin_permissions.sql
```

Phase 3:

```bash
supabase/migrations/20260615030000_phase_3_core_modules.sql
```

Apply with Supabase CLI:

```bash
supabase db push
```

Or paste the SQL into the Supabase SQL Editor in order.

## Phase 1 Summary

Phase 1 established:

- Supabase Auth email/password sign-in.
- Password setup and forgot-password email flows.
- `profiles`, `roles`, `user_roles`, `permissions`, `user_permission_overrides`, `record_assignments`, and `change_logs`.
- RLS policies and helper functions for active/approved users and module permissions.
- i18n foundation for `zh-TW` and `en`.
- PWA manifest, icons, service worker, and offline page.

The first administrator must be created in Supabase Auth, then linked to a `profiles` record and the `admin` role.

## Phase 2 Admin Console

Phase 2 adds:

- `/admin/users`
- `/admin/permissions`
- `/admin/change-logs`
- `/forgot-password`
- `/set-password`
- Permission-aware dashboard module entries.
- Coming Soon pages for future modules.

Only `admin` users or users with the required permissions can access admin pages.

Required permissions:

- `/admin/users`: `user_management can_manage`
- `/admin/permissions`: `permission_management can_manage`
- `/admin/change-logs`: `change_logs can_preview`

Unauthorized users are redirected to `/dashboard` with a localized no-permission message.

## `/admin/users`

Use this page to:

- View all users.
- Invite a coworker by email.
- Approve a coworker.
- Disable or re-enable a coworker.
- Resend a password setup email.
- Edit full name and notes.
- Assign roles with optional start and end dates.
- Deactivate a user role.
- View related change logs.

Inviting a coworker sends a Supabase Auth invitation email and creates the matching `profiles` record. If the email already exists in Auth, the system sends a password setup/reset email instead and updates the profile. Both email flows return to `/set-password`.

Set `APP_URL` to the deployed site origin, for example `https://church-admin-web.vercel.app`, so invitation links return to the correct app.

Users can also open `/forgot-password` from the login page to request a password setup/reset email. Supabase should allow the deployed callback URL:

```text
https://church-admin-web.vercel.app/auth/callback
```

Users cannot choose their own identity or role. Do not create `/select-role`; identity and permissions are assigned only by administrators.

## `/admin/permissions`

This page manages three permission layers:

- Role default permissions in `permissions`.
- Per-user overrides in `user_permission_overrides`.
- Per-record permissions in `record_assignments`.

Permission fields:

- `can_preview`: view, preview, or search module data.
- `can_create`: create data.
- `can_edit`: edit data.
- `can_delete`: delete data.
- `can_export`: export data or generate files.
- `can_import`: import from Google Drive or external sources.
- `can_manage`: manage module settings.

User overrides are tri-state:

- `null`: use role default.
- `true`: special allow.
- `false`: special deny.

Record assignments support targeted access with:

- `user_id`
- `module_name`
- `record_id`
- `can_preview`
- `can_edit`
- `can_manage`
- `start_date`
- `end_date`

This supports later phases where, for example, a Sunday school teacher can edit only assigned classes or a coworker can edit only a specific bulletin.

## `/admin/change-logs`

This page displays `change_logs` with filters for:

- Date range.
- Changed by.
- Table name.
- Action.

All Phase 2 management actions write change logs, including:

- User creation, approval, disable, enable, and profile updates.
- Role assignment and role removal.
- Role permission changes.
- User permission override changes.
- Record assignment changes.
- Optional unauthorized access attempts.

## Phase 2 Limits

This phase intentionally does not implement:

- Core five-module CRUD.
- Google Drive OAuth.
- Google Drive import.
- Search.
- Mobile upload to Google Drive.
- Multi-user version conflict handling.

Those are reserved for later phases.

## Phase 3 Core Modules

Phase 3 adds the daily administration modules:

- `/calendar`, `/calendar/new`, `/calendar/[id]`
- `/sunday-school`, `/sunday-school/new`, `/sunday-school/[id]`
- `/speakers`, `/speakers/new`, `/speakers/[id]`
- `/speaker-assignments`, `/speaker-assignments/new`, `/speaker-assignments/[id]`
- `/service-roles`
- `/service-assignments`, `/service-assignments/[date]`
- `/bulletins`, `/bulletins/[date]`

Database tables:

- `calendar_events`
- `sunday_school_classes`
- `speakers`
- `speaker_assignments`
- `service_roles`
- `service_assignments`
- `bulletins`

Permission behavior:

- Users without `can_preview` cannot enter the module.
- Users with `can_preview` but without `can_edit` see read-only forms.
- `can_create` controls new records.
- `can_edit` controls saving changes.
- `can_delete` controls delete actions.
- Create, update, and delete actions write to `change_logs`.

Bulletins can auto-fill content by date from calendar events, Sunday school classes, speaker assignments, and service assignments. This phase intentionally does not add Google Drive, full-text search UI, or mobile upload to Google Drive.

## Admin UI Conventions

- Interactive controls use the global cursor rules in `app/globals.css`, so links, buttons, selects, summaries, checkboxes, and radio buttons show a pointer cursor when available.
- Wide admin tables should use `components/SyncedHorizontalScroll.tsx` so users can scroll horizontally from the top of the table without moving to the bottom first.
