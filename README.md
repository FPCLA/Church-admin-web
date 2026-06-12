# FPCLA Church Admin Web

Phase 1 建立可部署到 Vercel 的 Next.js App Router + TypeScript 基礎專案，包含 Supabase Auth email/password、approved / active 登入檢查、角色與權限資料表、中英文切換，以及 PWA 基礎。

本階段不包含 Google Drive 功能，也不包含五大核心模組。

## 安裝

```bash
npm install
npm run dev
```

開發網址預設為：

```bash
http://localhost:3000
```

## 環境變數

請複製 `.env.example` 為 `.env.local`，再填入自己的值。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=
NEXT_PUBLIC_DEFAULT_LOCALE=
```

優先使用：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

相容支援：

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`APP_URL` 本機可填 `http://localhost:3000`。部署到 Vercel 後，改成正式網址，例如 `https://your-project.vercel.app`。

## Supabase 設定

1. 在 Supabase 建立專案。
2. 到 Project Settings -> API Keys 取得 public/publishable key。
3. service role key 只能放在 server-side 環境變數 `SUPABASE_SERVICE_ROLE_KEY`。
4. 不要把 service role key 放進任何 `NEXT_PUBLIC_` 變數。
5. 不要把 `.env.local` 提交到 GitHub。

## 執行 Migration

Migration 位於：

```bash
supabase/migrations/20260612000000_phase_1_auth_permissions.sql
```

可用 Supabase CLI 執行：

```bash
supabase db push
```

或在 Supabase SQL Editor 內執行該 SQL 檔內容。

Migration 會建立：

- `profiles`
- `roles`
- `user_roles`
- `permissions`
- `user_permission_overrides`
- `record_assignments`
- `change_logs`

也會建立 `updated_at` trigger、啟用 RLS、建立基本 policies，並建立 10 個預設角色。

## 建立第一個 Admin

系統不開放自由註冊。請先在 Supabase Auth Dashboard 手動建立第一個使用者：

1. 到 Supabase -> Authentication -> Users。
2. 點 Add user。
3. 建立 admin email/password。
4. Email Confirm 建議設為已確認。

密碼只存在 Supabase Auth，不要放進 SQL、GitHub、README 或聊天紀錄。

接著在 Supabase SQL Editor 執行下方 SQL。請只替換：

- `admin@example.com`：改成剛剛建立的 admin email。
- `Admin Name`：改成管理員姓名。

RLS 要保持 enabled，不需要關閉。

```sql
with admin_user as (
  select id, email
  from auth.users
  where lower(email) = lower('admin@example.com')
  limit 1
),
ensure_profile as (
  insert into public.profiles (
    id,
    full_name,
    email,
    active,
    approved,
    language_preference,
    approved_at,
    created_at,
    updated_at
  )
  select
    id,
    'Admin Name',
    email,
    true,
    true,
    'zh-TW',
    now(),
    now(),
    now()
  from admin_user
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    active = true,
    approved = true,
    approved_at = now(),
    updated_at = now()
  returning id
)
insert into public.user_roles (
  user_id,
  role_id,
  active,
  start_date,
  assigned_by,
  assigned_at,
  created_at,
  updated_at
)
select
  ensure_profile.id,
  roles.id,
  true,
  current_date,
  ensure_profile.id,
  now(),
  now(),
  now()
from ensure_profile
join public.roles on roles.name = 'admin'
where not exists (
  select 1
  from public.user_roles ur
  where ur.user_id = ensure_profile.id
    and ur.role_id = roles.id
);
```

如果執行後沒有新增任何資料，請確認 Supabase Authentication -> Users 裡已經有該 email，且 email 拼字完全一致。

可用下方 SQL 檢查 admin 是否建立成功：

```sql
select
  p.id,
  p.email,
  p.full_name,
  p.active,
  p.approved,
  r.name as role_name
from public.profiles p
left join public.user_roles ur on ur.user_id = p.id
left join public.roles r on r.id = ur.role_id
where lower(p.email) = lower('admin@example.com');
```

檢查結果應該看到 `active = true`、`approved = true`、`role_name = admin`。

## 登入規則

- 不開放自由註冊。
- 使用者使用 email/password 登入。
- 登入後必須存在 `profiles`。
- `profiles.approved` 必須是 `true`。
- `profiles.active` 必須是 `true`。
- 不符合條件時拒絕進入 `/dashboard`。
- 使用者不能自行選擇身份。
- 不建立 `/select-role`。
- 身份與權限全部由管理者設定。

## 權限檢查規則

不可以只靠前端隱藏按鈕保護資料。所有 server actions、API routes、database queries 都必須做後端權限檢查。

- 讀取資料：檢查 `can_preview`
- 新增資料：檢查 `can_create`
- 修改資料：檢查 `can_edit`
- 刪除資料：檢查 `can_delete`
- 匯出資料：檢查 `can_export`
- 匯入資料：檢查 `can_import`
- 管理功能：檢查 `can_manage`

權限 helper 位於：

```bash
lib/permissions/index.ts
```

包含：

- `hasPermission()`
- `hasRecordPermission()`
- `requirePermission()`
- `requireRecordPermission()`
- `resolveEffectivePermissions()`

## 安全要求

- 所有 Supabase public schema 資料表都必須啟用 Row Level Security。
- `SUPABASE_SERVICE_ROLE_KEY` 只能在 server-side 使用。
- `SUPABASE_SERVICE_ROLE_KEY` 不得出現在 client component。
- `SUPABASE_SERVICE_ROLE_KEY` 不得出現在 browser bundle。
- `SUPABASE_SERVICE_ROLE_KEY` 不得寫入 GitHub。
- `.env.local` 必須留在 `.gitignore`。
- `.env.example` 只能放空白欄位，不可放真實 key。
- Vercel 中的 `SUPABASE_SERVICE_ROLE_KEY` 與未來的 `GOOGLE_CLIENT_SECRET` 建議設為 sensitive。
- 使用者不能自行選擇角色。
- 使用者不能自行提升權限。
- 停用帳號時只設定 `active = false`，不要刪除歷史資料。
- 使用者管理、權限變更、資料新增、修改、刪除、匯入、匯出、Google Drive 同步都必須寫入 `change_logs`。
- 只有 `admin` 或具有 `user_management can_manage` 權限者可以管理使用者。
- 只有 `admin` 或具有 `permission_management can_manage` 權限者可以修改權限。
- `admin` 永遠擁有全部權限，但 admin 數量應保持最少。
- 無權限存取嘗試可選擇性寫入 `change_logs`。

## Google Drive 安全要求

Phase 1 不做 Google Drive。未來加入時必須遵守：

- Google Drive 只允許連接管理者指定資料夾。
- 不要掃描整個 Google Drive。
- 不要明文儲存 Google OAuth token。
- 不要把 Google Drive 檔案預設設成公開連結。
- Google Drive 資料夾不要設成 Anyone with the link。
- 一般 editor 不可覆蓋既有 Google Drive 檔案。
- 預設建立新版本檔案。
- 只有 admin 可以覆蓋既有檔案。

## 中英文切換

支援 `zh-TW` 和 `en`，預設 `zh-TW`。

- 未登入語言偏好存 localStorage。
- 登入後語言偏好存 `profiles.language_preference`。
- UI 文案集中在 `lib/i18n/dictionaries.ts`。

## PWA 基礎

PWA 檔案位於：

- `public/manifest.json`
- `public/icon-192.svg`
- `public/icon-512.svg`
- `public/sw.js`
- `/offline`

第一版只提供離線提示，不做完整離線編輯。

## Vercel 部署

1. 將專案 push 到既有 GitHub repository：`church-admin-web`。
2. 到 Vercel 匯入該 repository。
3. 在 Vercel Project Settings -> Environment Variables 設定環境變數。
4. `SUPABASE_SERVICE_ROLE_KEY` 設為 sensitive。
5. 第一次 deploy 後取得 Vercel 網址。
6. 將 `APP_URL` 更新為正式網址。
7. 到 Supabase Authentication -> URL Configuration 設定正式網址與 redirect URL。
8. 重新 deploy 一次。
