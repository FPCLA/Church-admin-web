export type FieldType =
  | "text"
  | "date"
  | "time"
  | "textarea"
  | "select"
  | "event"
  | "speaker"
  | "serviceRole"
  | "checkbox";

export type Phase3ModuleName =
  | "calendar_events"
  | "sunday_school_classes"
  | "speakers"
  | "speaker_assignments"
  | "service_roles"
  | "service_assignments"
  | "bulletins";

export type Phase3Field = {
  name: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  span?: "full";
};

export type Phase3ModuleConfig = {
  moduleName: Phase3ModuleName;
  tableName: Phase3ModuleName;
  basePath: string;
  titleField: string;
  dateField?: string;
  listFields: string[];
  formFields: Phase3Field[];
  newPath?: string;
  detailsByDate?: boolean;
};

export const coreModulePaths: Record<Phase3ModuleName, string> = {
  calendar_events: "/calendar",
  sunday_school_classes: "/sunday-school",
  speakers: "/speakers",
  speaker_assignments: "/speaker-assignments",
  service_roles: "/service-roles",
  service_assignments: "/service-assignments",
  bulletins: "/bulletins",
};

export const phase3Modules: Phase3ModuleConfig[] = [
  {
    moduleName: "calendar_events",
    tableName: "calendar_events",
    basePath: "/calendar",
    newPath: "/calendar/new",
    titleField: "title",
    dateField: "event_date",
    listFields: ["event_date", "start_time", "title", "event_type", "location", "status"],
    formFields: [
      { name: "title", type: "text", required: true },
      { name: "event_date", type: "date", required: true },
      { name: "start_time", type: "time" },
      { name: "end_time", type: "time" },
      { name: "location", type: "text" },
      { name: "event_type", type: "text" },
      { name: "description", type: "textarea", span: "full" },
      { name: "notes", type: "textarea", span: "full" },
      { name: "status", type: "text" },
    ],
  },
  {
    moduleName: "sunday_school_classes",
    tableName: "sunday_school_classes",
    basePath: "/sunday-school",
    newPath: "/sunday-school/new",
    titleField: "title",
    dateField: "class_date",
    listFields: ["class_date", "class_name", "title", "teacher_name", "location", "status"],
    formFields: [
      { name: "calendar_event_id", type: "event" },
      { name: "class_name", type: "text", required: true },
      { name: "title", type: "text" },
      { name: "class_date", type: "date", required: true },
      { name: "start_time", type: "time" },
      { name: "end_time", type: "time" },
      { name: "teacher_name", type: "text" },
      { name: "assistant_name", type: "text" },
      { name: "topic", type: "text" },
      { name: "scripture", type: "text" },
      { name: "location", type: "text" },
      { name: "progress", type: "text" },
      { name: "description", type: "textarea", span: "full" },
      { name: "notes", type: "textarea", span: "full" },
      { name: "status", type: "text" },
    ],
  },
  {
    moduleName: "speakers",
    tableName: "speakers",
    basePath: "/speakers",
    newPath: "/speakers/new",
    titleField: "name",
    listFields: ["name", "email", "phone", "notes"],
    formFields: [
      { name: "name", type: "text", required: true },
      { name: "email", type: "text" },
      { name: "phone", type: "text" },
      { name: "notes", type: "textarea", span: "full" },
    ],
  },
  {
    moduleName: "speaker_assignments",
    tableName: "speaker_assignments",
    basePath: "/speaker-assignments",
    newPath: "/speaker-assignments/new",
    titleField: "topic",
    dateField: "assignment_date",
    listFields: ["assignment_date", "meeting_type", "topic", "scripture", "confirmed_status"],
    formFields: [
      { name: "calendar_event_id", type: "event" },
      { name: "speaker_id", type: "speaker", required: true },
      { name: "assignment_date", type: "date", required: true },
      { name: "meeting_type", type: "text" },
      { name: "topic", type: "text" },
      { name: "scripture", type: "text" },
      {
        name: "confirmed_status",
        type: "select",
        options: ["pending", "confirmed", "declined"],
      },
      { name: "notes", type: "textarea", span: "full" },
    ],
  },
  {
    moduleName: "service_roles",
    tableName: "service_roles",
    basePath: "/service-roles",
    titleField: "display_name_zh",
    listFields: ["display_order", "display_name_zh", "display_name_en", "name", "active"],
    formFields: [
      { name: "name", type: "text", required: true },
      { name: "display_name_zh", type: "text", required: true },
      { name: "display_name_en", type: "text", required: true },
      { name: "display_order", type: "text" },
      { name: "active", type: "checkbox" },
      { name: "description", type: "textarea", span: "full" },
    ],
  },
  {
    moduleName: "service_assignments",
    tableName: "service_assignments",
    basePath: "/service-assignments",
    titleField: "person_name",
    dateField: "service_date",
    listFields: ["service_date", "service_role_id", "person_name", "backup_person_name", "confirmed_status"],
    formFields: [
      { name: "calendar_event_id", type: "event" },
      { name: "service_date", type: "date", required: true },
      { name: "service_role_id", type: "serviceRole", required: true },
      { name: "person_name", type: "text", required: true },
      { name: "backup_person_name", type: "text" },
      {
        name: "confirmed_status",
        type: "select",
        options: ["pending", "confirmed", "unavailable"],
      },
      { name: "notes", type: "textarea", span: "full" },
    ],
    detailsByDate: true,
  },
  {
    moduleName: "bulletins",
    tableName: "bulletins",
    basePath: "/bulletins",
    titleField: "title",
    dateField: "bulletin_date",
    listFields: ["bulletin_date", "title", "updated_at"],
    formFields: [
      { name: "calendar_event_id", type: "event" },
      { name: "bulletin_date", type: "date", required: true },
      { name: "title", type: "text", required: true },
      { name: "opening_text", type: "textarea", span: "full" },
      { name: "sunday_school_text", type: "textarea", span: "full" },
      { name: "worship_text", type: "textarea", span: "full" },
      { name: "announcements", type: "textarea", span: "full" },
      { name: "prayer_requests", type: "textarea", span: "full" },
      { name: "next_week_preview", type: "textarea", span: "full" },
      { name: "notes", type: "textarea", span: "full" },
    ],
    detailsByDate: true,
  },
];

export const phase3ModuleMap = Object.fromEntries(
  phase3Modules.map((moduleConfig) => [moduleConfig.moduleName, moduleConfig]),
) as Record<Phase3ModuleName, Phase3ModuleConfig>;

export const routeConfigByPath = Object.fromEntries(
  phase3Modules.map((moduleConfig) => [moduleConfig.basePath, moduleConfig]),
) as Record<string, Phase3ModuleConfig>;

export const fieldLabels: Record<"zh-TW" | "en", Record<string, string>> = {
  "zh-TW": {
    active: "啟用",
    announcements: "報告事項",
    assistant_name: "助教",
    assignment_date: "安排日期",
    backup_person_name: "備用人員",
    bulletin_date: "週報日期",
    calendar_event_id: "連結行事曆",
    class_date: "課程日期",
    class_name: "班級",
    confirmed_status: "確認狀態",
    description: "說明",
    display_name_en: "英文名稱",
    display_name_zh: "中文名稱",
    display_order: "排序",
    email: "Email",
    end_time: "結束時間",
    event_date: "日期",
    event_type: "類型",
    location: "地點",
    meeting_type: "聚會類型",
    name: "代號",
    next_week_preview: "下週預告",
    notes: "備註",
    opening_text: "開場文字",
    person_name: "服事人員",
    phone: "電話",
    prayer_requests: "代禱事項",
    progress: "進度",
    scripture: "經文",
    searchable_text: "搜尋文字",
    service_date: "服事日期",
    service_role_id: "服事項目",
    speaker_id: "講員",
    start_time: "開始時間",
    status: "狀態",
    sunday_school_text: "主日學",
    teacher_name: "老師",
    title: "標題",
    topic: "主題",
    updated_at: "更新時間",
    worship_text: "崇拜內容",
  },
  en: {
    active: "Active",
    announcements: "Announcements",
    assistant_name: "Assistant",
    assignment_date: "Assignment date",
    backup_person_name: "Backup",
    bulletin_date: "Bulletin date",
    calendar_event_id: "Calendar event",
    class_date: "Class date",
    class_name: "Class",
    confirmed_status: "Confirmation",
    description: "Description",
    display_name_en: "English name",
    display_name_zh: "Chinese name",
    display_order: "Order",
    email: "Email",
    end_time: "End time",
    event_date: "Date",
    event_type: "Type",
    location: "Location",
    meeting_type: "Meeting type",
    name: "Key",
    next_week_preview: "Next week",
    notes: "Notes",
    opening_text: "Opening text",
    person_name: "Person",
    phone: "Phone",
    prayer_requests: "Prayer requests",
    progress: "Progress",
    scripture: "Scripture",
    searchable_text: "Searchable text",
    service_date: "Service date",
    service_role_id: "Service role",
    speaker_id: "Speaker",
    start_time: "Start time",
    status: "Status",
    sunday_school_text: "Sunday school",
    teacher_name: "Teacher",
    title: "Title",
    topic: "Topic",
    updated_at: "Updated at",
    worship_text: "Worship text",
  },
};

export const moduleLabels: Record<"zh-TW" | "en", Record<Phase3ModuleName, string>> = {
  "zh-TW": {
    calendar_events: "行事曆",
    sunday_school_classes: "主日學",
    speakers: "講員資料",
    speaker_assignments: "講員安排",
    service_roles: "服事項目",
    service_assignments: "服事表",
    bulletins: "週報",
  },
  en: {
    calendar_events: "Calendar",
    sunday_school_classes: "Sunday School",
    speakers: "Speakers",
    speaker_assignments: "Speaker Assignments",
    service_roles: "Service Roles",
    service_assignments: "Service Schedule",
    bulletins: "Bulletins",
  },
};

export function phase3Text(locale?: string | null) {
  const language = locale === "en" ? "en" : "zh-TW";
  return {
    language,
    module: (moduleName: Phase3ModuleName) => moduleLabels[language][moduleName],
    field: (fieldName: string) => fieldLabels[language][fieldName] || fieldName,
    text: (key: keyof typeof uiText.en) => uiText[language][key],
  };
}

const uiText = {
  "zh-TW": {
    actions: "操作",
    add: "新增",
    autoFill: "自動帶入資料",
    back: "返回",
    create: "建立",
    delete: "刪除",
    deleteConfirm: "確認刪除",
    edit: "編輯",
    list: "列表",
    noData: "目前沒有資料",
    preview: "預覽",
    readOnly: "唯讀模式",
    save: "儲存",
    saved: "已儲存",
    select: "請選擇",
    unauthorized: "沒有權限",
  },
  en: {
    actions: "Actions",
    add: "Add",
    autoFill: "Auto-fill",
    back: "Back",
    create: "Create",
    delete: "Delete",
    deleteConfirm: "Confirm delete",
    edit: "Edit",
    list: "List",
    noData: "No records yet",
    preview: "Preview",
    readOnly: "Read-only",
    save: "Save",
    saved: "Saved",
    select: "Select",
    unauthorized: "No permission",
  },
} as const;
