export const bibleBooks = [
  ["genesis", "創世記", "Genesis"], ["exodus", "出埃及記", "Exodus"],
  ["leviticus", "利未記", "Leviticus"], ["numbers", "民數記", "Numbers"],
  ["deuteronomy", "申命記", "Deuteronomy"], ["joshua", "約書亞記", "Joshua"],
  ["judges", "士師記", "Judges"], ["ruth", "路得記", "Ruth"],
  ["1-samuel", "撒母耳記上", "1 Samuel"], ["2-samuel", "撒母耳記下", "2 Samuel"],
  ["1-kings", "列王紀上", "1 Kings"], ["2-kings", "列王紀下", "2 Kings"],
  ["1-chronicles", "歷代志上", "1 Chronicles"], ["2-chronicles", "歷代志下", "2 Chronicles"],
  ["ezra", "以斯拉記", "Ezra"], ["nehemiah", "尼希米記", "Nehemiah"],
  ["esther", "以斯帖記", "Esther"], ["job", "約伯記", "Job"],
  ["psalms", "詩篇", "Psalms"], ["proverbs", "箴言", "Proverbs"],
  ["ecclesiastes", "傳道書", "Ecclesiastes"], ["song-of-songs", "雅歌", "Song of Songs"],
  ["isaiah", "以賽亞書", "Isaiah"], ["jeremiah", "耶利米書", "Jeremiah"],
  ["lamentations", "耶利米哀歌", "Lamentations"], ["ezekiel", "以西結書", "Ezekiel"],
  ["daniel", "但以理書", "Daniel"], ["hosea", "何西阿書", "Hosea"],
  ["joel", "約珥書", "Joel"], ["amos", "阿摩司書", "Amos"],
  ["obadiah", "俄巴底亞書", "Obadiah"], ["jonah", "約拿書", "Jonah"],
  ["micah", "彌迦書", "Micah"], ["nahum", "那鴻書", "Nahum"],
  ["habakkuk", "哈巴谷書", "Habakkuk"], ["zephaniah", "西番雅書", "Zephaniah"],
  ["haggai", "哈該書", "Haggai"], ["zechariah", "撒迦利亞書", "Zechariah"],
  ["malachi", "瑪拉基書", "Malachi"], ["matthew", "馬太福音", "Matthew"],
  ["mark", "馬可福音", "Mark"], ["luke", "路加福音", "Luke"],
  ["john", "約翰福音", "John"], ["acts", "使徒行傳", "Acts"],
  ["romans", "羅馬書", "Romans"], ["1-corinthians", "哥林多前書", "1 Corinthians"],
  ["2-corinthians", "哥林多後書", "2 Corinthians"], ["galatians", "加拉太書", "Galatians"],
  ["ephesians", "以弗所書", "Ephesians"], ["philippians", "腓立比書", "Philippians"],
  ["colossians", "歌羅西書", "Colossians"], ["1-thessalonians", "帖撒羅尼迦前書", "1 Thessalonians"],
  ["2-thessalonians", "帖撒羅尼迦後書", "2 Thessalonians"], ["1-timothy", "提摩太前書", "1 Timothy"],
  ["2-timothy", "提摩太後書", "2 Timothy"], ["titus", "提多書", "Titus"],
  ["philemon", "腓利門書", "Philemon"], ["hebrews", "希伯來書", "Hebrews"],
  ["james", "雅各書", "James"], ["1-peter", "彼得前書", "1 Peter"],
  ["2-peter", "彼得後書", "2 Peter"], ["1-john", "約翰一書", "1 John"],
  ["2-john", "約翰二書", "2 John"], ["3-john", "約翰三書", "3 John"],
  ["jude", "猶大書", "Jude"], ["revelation", "啟示錄", "Revelation"],
] as const;

export const calendarMonths = [
  [1, "一月", "Jan."], [2, "二月", "Feb."], [3, "三月", "Mar."], [4, "四月", "Apr."],
  [5, "五月", "May."], [6, "六月", "Jun."], [7, "七月", "Jul."], [8, "八月", "Aug."],
  [9, "九月", "Sep."], [10, "十月", "Oct."], [11, "十一月", "Nov."], [12, "十二月", "Dec."],
] as const;

export function bibleBook(bookId: string) {
  return bibleBooks.find(([id]) => id === bookId) || null;
}
