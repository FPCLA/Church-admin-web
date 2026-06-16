# Saved Version: 2026-06-16 06:10 PDT

Production URL: https://church-admin-web.vercel.app

Latest Vercel deployment:

- Deployment ID: dpl_7JeT7Uh8YVPFgsvjthkmgnP6yCB4
- Deployment URL: https://church-admin-9jmses9z0-sam-w998-s-projects.vercel.app
- Status: Ready

Latest local backup archive:

- versions/church-admin-web-20260616-0610-final.zip

Included work:

- Phase 3 core module tables and RLS migration.
- Phase 3 migration updated after Supabase SQL install feedback.
- Calendar CRUD pages.
- Sunday school CRUD pages.
- Speaker CRUD pages and speaker assignment CRUD pages.
- Service role management and date-based service assignment pages.
- Bulletin editor with live preview and date-based auto-fill.
- Dashboard links for Phase 3 modules only, excluding Google Drive/search for this phase.
- Server-side permission checks and change log writes for Phase 3 changes.
- ESLint config updated for Next 16 flat config.
- Locale hook updated to pass React 19 lint rules.
- Supabase reset password flow updates.
- Login after setting a new password.
- Admin coworker soft-delete option.
- Pointer cursor rules for interactive controls.
- Reusable synced horizontal scroll for wide admin tables.
- Dashboard only shows pages/modules the user has permission to view.
- Language switcher refreshes the current page after saving preference.

Git/GitHub status:

- Local Git repository initialized.
- Branch: `codex/phase-3-production`
- Commit: current `HEAD` (`chore: save phase 3 production rollback point`)
- Tag: `phase-3-production-20260616`
- No GitHub remote is configured locally.

Verification:

- `eslint .` passed.
- `tsc --noEmit --incremental false` passed.
- `next build` passed.
- Vercel production deployment is READY.
- Production runtime error scan found no error/fatal logs in the first 30 minutes queried.

Pending external steps:

- Run a signed-in smoke test for Phase 3 modules with an admin account.
