# Changelog

## 2026-06-12 - Phase 1 baseline deployed

Phase 1 has been established for the existing GitHub repository `FPCLA/Church-admin-web`.

Completed:

- Initialized the Next.js App Router + TypeScript project structure.
- Added Tailwind CSS foundation.
- Added Supabase Auth email/password login flow.
- Added `/login`, `/dashboard`, and `/offline` pages.
- Added approved and active account checks through `profiles.approved` and `profiles.active`.
- Added role, permission, record assignment, and change log migration tables.
- Enabled Row Level Security setup in the Supabase migration.
- Added zh-TW and en language support with a language switcher.
- Added PWA basics, including manifest, service worker, and offline page.
- Added `.env.example` with blank fields only.
- Confirmed `.gitignore` excludes `.env`, `.env.local`, and `.env*.local`.
- Deployed to Vercel production.
- Confirmed the production login page loads.
- Confirmed admin login reaches the dashboard.

Production URL:

- https://church-admin-web.vercel.app

Security notes:

- `.env.local` is not present in the GitHub repository.
- Real Supabase keys are not stored in GitHub.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only and should be marked Sensitive in Vercel.
- Public browser variables should only use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the legacy-compatible `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Not included in Phase 1:

- Google Drive integration.
- The five core modules.
- Full offline editing.
