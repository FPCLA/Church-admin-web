export const supportedLocales = ["zh-TW", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

type DictionaryValue = string | Record<string, DictionaryValue>;
export type Dictionary = Record<string, DictionaryValue>;

export const dictionaries: Record<Locale, Dictionary> = {
  "zh-TW": {
    app: {
      name: "FPCLA 教會行政系統",
      shortName: "教會行政",
    },
    common: {
      email: "電子郵件",
      password: "密碼",
      signIn: "登入",
      signOut: "登出",
      language: "語言",
      zhTW: "中文",
      en: "English",
      loading: "處理中...",
    },
    login: {
      title: "登入",
      subtitle: "請使用管理者建立的帳號登入。",
      noRegistration: "此系統不開放自由註冊，身份與權限由管理者設定。",
      errors: {
        required: "請輸入電子郵件與密碼。",
        invalidCredentials: "電子郵件或密碼不正確。",
        profileMissing: "找不到此帳號的使用者資料，請聯絡管理者。",
        notApproved: "此帳號尚未核准，請聯絡管理者。",
        inactive: "此帳號已停用，請聯絡管理者。",
        profile_missing: "找不到此帳號的使用者資料，請聯絡管理者。",
        not_approved: "此帳號尚未核准，請聯絡管理者。",
      },
    },
    dashboard: {
      title: "儀表板",
      welcome: "歡迎回來",
      phase: "Phase 1 已完成基礎登入、權限、語言與 PWA 架構。",
      security: "資料存取必須經過 Supabase RLS 與後端權限檢查。",
      noModules: "五大核心模組與 Google Drive 尚未在本階段建立。",
      statusApproved: "帳號已核准",
      statusActive: "帳號啟用中",
    },
    offline: {
      title: "目前離線",
      message: "請確認網路連線後再回到系統。第一版僅提供離線提示，不支援離線編輯。",
    },
  },
  en: {
    app: {
      name: "FPCLA Church Admin",
      shortName: "Church Admin",
    },
    common: {
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      signOut: "Sign out",
      language: "Language",
      zhTW: "中文",
      en: "English",
      loading: "Working...",
    },
    login: {
      title: "Sign in",
      subtitle: "Use the account created by an administrator.",
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
      },
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back",
      phase:
        "Phase 1 includes foundational sign-in, permissions, language, and PWA structure.",
      security:
        "Data access must be protected by Supabase RLS and server-side permission checks.",
      noModules:
        "The five core modules and Google Drive are not implemented in this phase.",
      statusApproved: "Account approved",
      statusActive: "Account active",
    },
    offline: {
      title: "You are offline",
      message:
        "Check your network connection before returning to the system. This first version only shows an offline notice and does not support offline editing.",
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
    const value = key.split(".").reduce<DictionaryValue | undefined>(
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
