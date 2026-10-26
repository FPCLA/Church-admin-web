export type CalendarWordActivityLine = {
  left: string;
  right: string;
};

export type CalendarWordRow =
  | {
      kind: "special";
      text: string;
    }
  | {
      activityLines: CalendarWordActivityLine[];
      date: string;
      kind: "sunday";
      month: string;
      monthStart: boolean;
    };

export type CalendarWordElderAssignment = {
  month: string;
  name: string;
};

export type CalendarWordPage = {
  elders: CalendarWordElderAssignment[];
  rows: CalendarWordRow[];
};

export type CalendarWordExportPayload = {
  isEnglish: boolean;
  pages: [CalendarWordPage, CalendarWordPage];
  themeEnglish: string;
  themeChinese: string;
  year: number;
};

