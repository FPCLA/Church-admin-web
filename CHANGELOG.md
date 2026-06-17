# Changelog

## 2026-06-16 - Calendar Builder

- Added `/calendar/builder` for creating a print-style annual church calendar by year.
- Auto-generates all Sundays for the selected year.
- Auto-calculates New Year's Day, Chinese New Year, LA Marathon known dates, Oscars known dates, Palm Sunday, Good Friday, Easter, Mother's Day, Memorial Day, Dragon Boat Festival, Father's Day, Independence Day, Labor Day, Mid-Autumn Festival, World Communion Day, Thanksgiving, Advent Sundays, and Christmas.
- Shows a date confirmation table every time the calendar is built, including calculation method, Sunday-note placement, and confirmation status.
- Places special dates into the Sunday table using church-calendar logic: same Sunday, previous Sunday, next Sunday, or nearest Sunday depending on the event.
- Reworked the calendar builder into a 2026-reference style one-week-per-row layout.
- Added clickable Sunday rows for entering church calendar items, with movable item controls for previous week, next week, direct Sunday selection, and drag/drop placement.
- Added a Calendar Builder entry on the Calendar module page.
- Styled the builder with a print-friendly table layout inspired by the FPCLA 2026 calendar reference.

## 2026-06-15 - Phase 3 Core Modules

- Added Supabase tables, triggers, RLS policies, and seed data for calendar events, Sunday school classes, speakers, speaker assignments, service roles, service assignments, and bulletins.
- Added permission-aware CRUD pages for calendar, Sunday school, speakers, speaker assignments, service roles, service schedules, and bulletins.
- Added read-only behavior for preview-only users and create/edit/delete controls gated by module permissions.
- Added change log writes for Phase 3 create, update, and delete actions.
- Added bulletin editing with live preview and date-based auto-fill from calendar, Sunday school, speaker assignment, and service assignment data.
- Updated the dashboard to link to Phase 3 core modules and keep Google Drive/search out of this phase.
- Updated ESLint configuration for Next 16 flat config and fixed the locale hook lint issue.

## 2026-06-12 - Phase 2

- Added administrator pages for user management, permission management, and change logs.
- Added server actions for approving, disabling, enabling, and editing users.
- Added role assignment and deactivation flows.
- Added role default permission matrix, per-user permission overrides, and record assignment management.
- Added permission-aware dashboard links and Coming Soon module pages.
- Added Phase 2 Supabase migration for admin modules, default role permissions, and record permission helper.
- Rebuilt the i18n dictionary with readable `zh-TW` and `en` strings.
- Documented Phase 2 usage, permissions, change logs, and current limits.

## 2026-06-12 - Phase 1

- Added Supabase Auth sign-in foundation.
- Added profile approval and active-account checks.
- Added permission, role, record assignment, and change log tables.
- Added RLS policies and permission helper functions.
- Added i18n and PWA foundations.
