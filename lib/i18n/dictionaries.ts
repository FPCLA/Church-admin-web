export const supportedLocales = ["zh-TW", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

export interface Dictionary {
  [key: string]: string | Dictionary;
}

export const dictionaries: Record<Locale, Dictionary> = {
  "zh-TW": {
    app: {
      name: "FPCLA 教會行政管理",
      shortName: "教會行政",
    },
    common: {
      all: "全部",
      cancel: "取消",
      comingSoon: "此功能尚未開放。",
      email: "Email",
      filter: "篩選",
      language: "語言",
      load: "載入",
      loading: "處理中...",
      none: "無",
      password: "密碼",
      save: "儲存",
      signIn: "登入",
      signOut: "登出",
      unauthorized: "無權限",
      unauthorizedMessage: "您沒有權限查看此頁面。",
      updateFailed: "更新失敗",
      updateSucceeded: "更新成功",
      zhTW: "繁體中文",
      en: "English",
    },
    login: {
      title: "登入",
      subtitle: "請使用管理者建立的帳號登入。",
      forgotPassword: "忘記密碼？",
      firstLoginOrForgotPassword: "第一次登入 / 忘記密碼？",
      noRegistration: "系統不開放自行註冊；角色與權限由管理員指派。",
      errors: {
        required: "請輸入 Email 和密碼。",
        invalidCredentials: "Email 或密碼不正確。",
        profileMissing: "此帳號尚未建立個人資料，請聯絡管理員。",
        notApproved: "此帳號尚未核准，請聯絡管理員。",
        inactive: "此帳號已停用，請聯絡管理員。",
        profile_missing: "此帳號尚未建立個人資料，請聯絡管理員。",
        not_approved: "此帳號尚未核准，請聯絡管理員。",
        invite_invalid: "邀請或密碼重設連結無效或已過期，請重新申請。",
      },
    },
    forgotPassword: {
      title: "忘記密碼",
      subtitle: "輸入帳號 Email，系統會寄出重新設定密碼的連結。",
      submit: "寄出設定密碼信",
      success: "如果此 Email 可使用，系統已寄出設定密碼信。請到信箱查看。",
      backToLogin: "返回登入",
      errors: {
        required: "請輸入 Email。",
        sendFailed: "設定密碼信寄送失敗，請稍後再試或聯絡管理員。",
      },
    },
    resetPassword: {
      title: "第一次登入 / 重設密碼",
      subtitle: "第一次登入或忘記密碼時，請輸入帳號 Email，系統會寄出設定新密碼的連結。",
    },
    setPassword: {
      title: "設定密碼",
      subtitle: "請建立至少 8 個字元的新密碼，之後即可使用此帳號登入。",
      confirmPassword: "確認密碼",
      submit: "設定密碼",
      errors: {
        required: "請輸入並確認密碼。",
        tooShort: "密碼至少需要 8 個字元。",
        mismatch: "兩次輸入的密碼不一致。",
        sessionExpired: "連結已過期，請重新申請設定密碼信。",
        updateFailed: "密碼設定失敗，請稍後再試。",
      },
    },
    dashboard: {
      title: "儀表板",
      welcome: "歡迎回來",
      phase: "Phase 2 已加入管理員控制台、權限矩陣和異動紀錄。",
      security: "資料存取仍由 Supabase RLS 與伺服器端權限檢查保護。",
      noModules: "目前沒有可預覽的模組項目。",
      modules: "模組項目",
      statusApproved: "帳號已核准",
      statusActive: "帳號啟用中",
    },
    admin: {
      title: "管理員控制台",
      users: {
        title: "使用者管理",
        addCoworker: "新增同工",
        inviteCoworker: "邀請同工",
        approve: "核准",
        approved: "已核准",
        active: "啟用",
        actions: "動作",
        assignRole: "指派角色",
        createdAt: "建立時間",
        disable: "停用",
        effectivePermissions: "有效權限",
        enable: "重新啟用",
        fullName: "姓名",
        initialRole: "初始角色",
        inviteSent: "邀請信已寄出。",
        language: "語言偏好",
        lastLogin: "最後登入",
        notes: "備註",
        relatedLogs: "相關異動紀錄",
        removeRole: "移除角色",
        resendInvitation: "重寄設定密碼信",
        roles: "角色",
        status: "狀態",
      },
      permissions: {
        title: "權限管理",
        allow: "特別允許",
        bulkActions: "快速設定",
        clearAll: "全取消",
        create: "可新增",
        delete: "可刪除",
        deny: "特別拒絕",
        edit: "可編輯",
        export: "可匯出",
        import: "可匯入",
        inherit: "使用角色預設",
        manage: "可管理",
        module: "模組",
        permissions: "權限",
        preview: "可預覽",
        selectAll: "全選",
        recordAssignments: "單筆資料權限",
        roleDefaults: "角色預設權限",
        userOverrides: "使用者權限覆寫",
      },
      logs: {
        title: "異動紀錄",
        action: "動作",
        changedAt: "異動時間",
        changedBy: "異動者",
        details: "詳細內容",
        from: "原值",
        tableName: "資料表",
        to: "新值",
      },
    },
    modules: {
      calendar_events: "行事曆",
      sunday_school_classes: "主日學班級",
      speakers: "講員",
      speaker_assignments: "講員安排",
      service_roles: "服事角色",
      service_assignments: "服事安排",
      bulletins: "週報",
      drive_files: "Google Drive 檔案",
      imports: "匯入",
      exports: "匯出",
      search: "搜尋",
      user_management: "使用者管理",
      permission_management: "權限管理",
      change_logs: "異動紀錄",
    },
    offline: {
      title: "您目前離線",
      message: "請確認網路連線後再回到系統。本版本只顯示離線提醒，尚不支援離線編輯。",
    },
  },
  en: {
    app: {
      name: "FPCLA Church Admin",
      shortName: "Church Admin",
    },
    common: {
      all: "All",
      cancel: "Cancel",
      comingSoon: "This feature is not available yet.",
      email: "Email",
      filter: "Filter",
      language: "Language",
      load: "Load",
      loading: "Working...",
      none: "None",
      password: "Password",
      save: "Save",
      signIn: "Sign in",
      signOut: "Sign out",
      unauthorized: "No permission",
      unauthorizedMessage: "You do not have permission to view this page.",
      updateFailed: "Update failed",
      updateSucceeded: "Update succeeded",
      zhTW: "繁體中文",
      en: "English",
    },
    login: {
      title: "Sign in",
      subtitle: "Use the account created by an administrator.",
      forgotPassword: "Forgot password?",
      firstLoginOrForgotPassword: "First sign-in / Forgot password?",
      noRegistration:
        "Self-registration is disabled. Roles and permissions are assigned by administrators.",
      errors: {
        required: "Enter your email and password.",
        invalidCredentials: "The email or password is incorrect.",
        profileMissing:
          "No profile exists for this account. Contact an administrator.",
        notApproved:
          "This account has not been approved. Contact an administrator.",
        inactive: "This account is inactive. Contact an administrator.",
        profile_missing:
          "No profile exists for this account. Contact an administrator.",
        not_approved:
          "This account has not been approved. Contact an administrator.",
        invite_invalid:
          "The invitation or password reset link is invalid or expired. Please request a new one.",
      },
    },
    forgotPassword: {
      title: "Forgot password",
      subtitle:
        "Enter your account email and the system will send a password setup link.",
      submit: "Send setup email",
      success:
        "If this email can be used, a password setup email has been sent. Please check your inbox.",
      backToLogin: "Back to sign in",
      errors: {
        required: "Enter your email.",
        sendFailed:
          "Password setup email failed to send. Try again later or contact an administrator.",
      },
    },
    resetPassword: {
      title: "First sign-in / Reset password",
      subtitle:
        "For first sign-in or a forgotten password, enter your account email and the system will send a link to set a new password.",
    },
    setPassword: {
      title: "Set password",
      subtitle:
        "Create a new password with at least 8 characters. You can use it to sign in afterward.",
      confirmPassword: "Confirm password",
      submit: "Set password",
      errors: {
        required: "Enter and confirm your password.",
        tooShort: "Password must be at least 8 characters.",
        mismatch: "The passwords do not match.",
        sessionExpired:
          "This link has expired. Please request a new password setup email.",
        updateFailed: "Password update failed. Try again later.",
      },
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back",
      phase:
        "Phase 2 adds the administrator console, permission matrix, and change logs.",
      security:
        "Data access remains protected by Supabase RLS and server-side permission checks.",
      noModules: "No module entries are available for preview.",
      modules: "Module entries",
      statusApproved: "Account approved",
      statusActive: "Account active",
    },
    admin: {
      title: "Admin Console",
      users: {
        title: "User Management",
        addCoworker: "Add coworker",
        inviteCoworker: "Invite coworker",
        approve: "Approve",
        approved: "Approved",
        active: "Active",
        actions: "Actions",
        assignRole: "Assign role",
        createdAt: "Created at",
        disable: "Disable",
        effectivePermissions: "Effective permissions",
        enable: "Enable",
        fullName: "Full name",
        initialRole: "Initial role",
        inviteSent: "Invitation email sent.",
        language: "Language preference",
        lastLogin: "Last login",
        notes: "Notes",
        relatedLogs: "Related change logs",
        removeRole: "Remove role",
        resendInvitation: "Resend setup email",
        roles: "Roles",
        status: "Status",
      },
      permissions: {
        title: "Permission Management",
        allow: "Special allow",
        bulkActions: "Quick actions",
        clearAll: "Clear all",
        create: "Can create",
        delete: "Can delete",
        deny: "Special deny",
        edit: "Can edit",
        export: "Can export",
        import: "Can import",
        inherit: "Use role default",
        manage: "Can manage",
        module: "Module",
        permissions: "Permissions",
        preview: "Can preview",
        selectAll: "Select all",
        recordAssignments: "Record assignments",
        roleDefaults: "Role default permissions",
        userOverrides: "User permission overrides",
      },
      logs: {
        title: "Change Logs",
        action: "Action",
        changedAt: "Changed at",
        changedBy: "Changed by",
        details: "Details",
        from: "From",
        tableName: "Table",
        to: "To",
      },
    },
    modules: {
      calendar_events: "Calendar events",
      sunday_school_classes: "Sunday school classes",
      speakers: "Speakers",
      speaker_assignments: "Speaker assignments",
      service_roles: "Service roles",
      service_assignments: "Service assignments",
      bulletins: "Bulletins",
      drive_files: "Google Drive files",
      imports: "Imports",
      exports: "Exports",
      search: "Search",
      user_management: "User management",
      permission_management: "Permission management",
      change_logs: "Change logs",
    },
    offline: {
      title: "You are offline",
      message:
        "Check your network connection before returning to the system. This version only shows an offline notice and does not support offline editing.",
    },
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
    const value = key.split(".").reduce<string | Dictionary | undefined>(
      (current, segment) => {
        if (!current || typeof current === "string") {
          return undefined;
        }

        return current[segment];
      },
      dictionary,
    );

    return typeof value === "string" ? value : key;
  };
}
