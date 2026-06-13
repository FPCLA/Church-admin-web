export const supportedLocales = ["zh-TW", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

export interface Dictionary {
  [key: string]: string | Dictionary;
}

export const dictionaries: Record<Locale, Dictionary> = {
  "zh-TW": {
    app: { name: "FPCLA 教會行政管理系統", shortName: "教會行政" },
    common: {
      all: "全部", cancel: "取消", comingSoon: "此功能尚未建立。", email: "Email", filter: "篩選", language: "語言", load: "載入", loading: "處理中...", none: "無", password: "密碼", save: "儲存", signIn: "登入", signOut: "登出", unauthorized: "無權限", unauthorizedMessage: "您沒有權限查看此頁面。", updateFailed: "修改失敗", updateSucceeded: "修改成功", zhTW: "繁體中文", en: "English",
    },
    login: {
      title: "登入", subtitle: "請使用管理者建立的帳號登入。", noRegistration: "本系統不開放自行註冊。身份與權限都由管理者指定。",
      errors: { required: "請輸入 Email 和密碼。", invalidCredentials: "Email 或密碼不正確。", profileMissing: "此帳號尚未建立使用者資料，請聯絡管理者。", notApproved: "此帳號尚未核准，請聯絡管理者。", inactive: "此帳號已停用，請聯絡管理者。", profile_missing: "此帳號尚未建立使用者資料，請聯絡管理者。", not_approved: "此帳號尚未核准，請聯絡管理者。" },
    },
    dashboard: { title: "儀表板", welcome: "歡迎回來", phase: "Phase 2 已加入管理者後台、權限矩陣與修改紀錄。", security: "資料存取仍需透過 Supabase RLS 與 server-side 權限檢查保護。", noModules: "目前沒有可預覽的模組入口。", modules: "模組入口", statusApproved: "帳號已核准", statusActive: "帳號啟用中" },
    admin: {
      title: "管理者後台",
      users: { title: "使用者管理", addCoworker: "新增同工", inviteCoworker: "邀請同工", approve: "核准", approved: "已核准", active: "已啟用", actions: "操作", assignRole: "指派角色", createdAt: "建立時間", disable: "停用", effectivePermissions: "目前有效權限", enable: "重新啟用", fullName: "姓名", initialRole: "初始角色", language: "語言偏好", lastLogin: "最後登入時間", notes: "備註", relatedLogs: "相關修改紀錄", removeRole: "移除角色", roles: "角色", status: "狀態" },
      permissions: { title: "權限管理", allow: "特別允許", create: "可新增", delete: "可刪除", deny: "特別禁止", edit: "可編輯", export: "可匯出", import: "可匯入", inherit: "使用角色預設", manage: "可管理", module: "模組", permissions: "權限", preview: "可預覽", recordAssignments: "單筆資料權限", roleDefaults: "角色預設權限", userOverrides: "單一使用者權限覆蓋" },
      logs: { title: "修改紀錄", action: "操作", changedAt: "修改時間", changedBy: "修改者", details: "詳細內容", from: "開始日期", tableName: "資料表", to: "結束日期" },
    },
    modules: { calendar_events: "行事曆", sunday_school_classes: "主日學課程", speakers: "講員", speaker_assignments: "講員安排", service_roles: "服事角色", service_assignments: "服事表", bulletins: "週報", drive_files: "Google Drive 檔案", imports: "匯入", exports: "匯出", search: "搜尋", user_management: "使用者管理", permission_management: "權限管理", change_logs: "修改紀錄" },
    offline: { title: "您目前離線", message: "請確認網路連線後再回到系統。此版本只提供離線提示，不支援離線編輯。" },
  },
  en: {
    app: { name: "FPCLA Church Admin", shortName: "Church Admin" },
    common: { all: "All", cancel: "Cancel", comingSoon: "This feature is not available yet.", email: "Email", filter: "Filter", language: "Language", load: "Load", loading: "Working...", none: "None", password: "Password", save: "Save", signIn: "Sign in", signOut: "Sign out", unauthorized: "No permission", unauthorizedMessage: "You do not have permission to view this page.", updateFailed: "Update failed", updateSucceeded: "Update succeeded", zhTW: "繁體中文", en: "English" },
    login: { title: "Sign in", subtitle: "Use the account created by an administrator.", noRegistration: "Self-registration is disabled. Roles and permissions are assigned by administrators.", errors: { required: "Enter your email and password.", invalidCredentials: "The email or password is incorrect.", profileMissing: "No profile exists for this account. Contact an administrator.", notApproved: "This account has not been approved. Contact an administrator.", inactive: "This account is inactive. Contact an administrator.", profile_missing: "No profile exists for this account. Contact an administrator.", not_approved: "This account has not been approved. Contact an administrator." } },
    dashboard: { title: "Dashboard", welcome: "Welcome back", phase: "Phase 2 adds the administrator console, permission matrix, and change logs.", security: "Data access remains protected by Supabase RLS and server-side permission checks.", noModules: "No module entries are available for preview.", modules: "Module entries", statusApproved: "Account approved", statusActive: "Account active" },
    admin: { title: "Admin Console", users: { title: "User Management", addCoworker: "Add coworker", inviteCoworker: "Invite coworker", approve: "Approve", approved: "Approved", active: "Active", actions: "Actions", assignRole: "Assign role", createdAt: "Created at", disable: "Disable", effectivePermissions: "Effective permissions", enable: "Enable", fullName: "Full name", initialRole: "Initial role", language: "Language preference", lastLogin: "Last login", notes: "Notes", relatedLogs: "Related change logs", removeRole: "Remove role", roles: "Roles", status: "Status" }, permissions: { title: "Permission Management", allow: "Special allow", create: "Can create", delete: "Can delete", deny: "Special deny", edit: "Can edit", export: "Can export", import: "Can import", inherit: "Use role default", manage: "Can manage", module: "Module", permissions: "Permissions", preview: "Can preview", recordAssignments: "Record assignments", roleDefaults: "Role default permissions", userOverrides: "User permission overrides" }, logs: { title: "Change Logs", action: "Action", changedAt: "Changed at", changedBy: "Changed by", details: "Details", from: "From", tableName: "Table", to: "To" } },
    modules: { calendar_events: "Calendar events", sunday_school_classes: "Sunday school classes", speakers: "Speakers", speaker_assignments: "Speaker assignments", service_roles: "Service roles", service_assignments: "Service assignments", bulletins: "Bulletins", drive_files: "Google Drive files", imports: "Imports", exports: "Exports", search: "Search", user_management: "User management", permission_management: "Permission management", change_logs: "Change logs" },
    offline: { title: "You are offline", message: "Check your network connection before returning to the system. This version only shows an offline notice and does not support offline editing." },
  },
};

export function normalizeLocale(locale?: string | null): Locale {
  return locale === "en" ? "en" : "zh-TW";
}

export function getDictionary(locale?: string | null) {
  return dictionaries[normalizeLocale(locale)];
}

export function translate(locale?: string | null) {
  const dictionary = getDictionary(locale);
  return (key: string) => {
    const value = key.split(".").reduce<string | Dictionary | undefined>((current, segment) => {
      if (!current || typeof current === "string") return undefined;
      return current[segment];
    }, dictionary);
    return typeof value === "string" ? value : key;
  };
}
