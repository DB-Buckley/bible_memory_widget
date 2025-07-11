import { getSettings } from './settings.js';

const API_KEY = '1085474b2991fc06a527e76388f707d5';
const BASE_URL = 'https://api.scripture.api.bible/v1';

const bookAbbreviations = {
  "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
  "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
  "Ezra": "EZR", "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB", "Psalms": "PSA",
  "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA",
  "Jeremiah": "JER", "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS",
  "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC",
  "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC",
  "Malachi": "MAL", "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
  "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO",
  "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL",
  "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI",
  "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS", "1 Peter": "1PE",
  "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV"
};

// Default to ASV
function getBibleId(code) {
  switch (code) {
    case 'ASV': return '685d1470fe4d5c3b-01';
    case 'KJV': return 'de4e12af7f28f599-01';
    case 'WEB': return '9879dbb7cfe39e4d-01';
    case 'LSV': return '01b29f4b342acc35-01';
    default: return '685d1470fe4d5c3b-01'; // ASV fallback
  }
}

export async function fetchVerse(reference) {
  try {
    const settings = getSettings();
    const bibleId = getBibleId(settings.translation || 'ASV');

    const match = reference.match(/^([\d]?\s?[A-Za-z\s]+)\s+(\d+):(\d+)$/);
    if (!match) throw new Error(`Invalid format for "${reference}"`);

    let [_, book, chapter, verse] = match;
    book = book.trim();
    const bookId = bookAbbreviations[book];
    if (!bookId) throw new Error(`Unknown book: "${book}"`);

    const verseId = `${bookId}.${chapter}.${verse}`;

    const url = `${BASE_URL}/bibles/${bibleId}/verses/${verseId}?include-chapter-numbers=false&include-verse-numbers=false`;

    const response = await fetch(url, {
      headers: { 'api-key': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`Verse not found for "${reference}"`);
    }

    const data = await response.json();
    const cleanText = data?.data?.content?.replace(/<[^>]+>/g, '').trim();

    return {
      reference: `${book} ${chapter}:${verse}`,
      text: cleanText
    };
  } catch (err) {
    console.error("fetchVerse error:", err);
    return null;
  }
}
