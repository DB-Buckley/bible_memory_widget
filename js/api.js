const API_KEY = '1085474b2991fc06a527e76388f707d5';

let cachedBibles = null;
let cachedBibleId = null; // Will hold NLT Bible ID

// Utility to strip HTML tags from passage content
function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Fetch and cache list of Bibles
async function fetchBibles() {
  if (cachedBibles) return cachedBibles;

  const res = await fetch('https://api.scripture.api.bible/v1/bibles', {
    headers: { 'api-key': API_KEY }
  });
  if (!res.ok) throw new Error(`Failed to fetch bibles: ${res.status}`);

  const data = await res.json();
  cachedBibles = data.data;
  return cachedBibles;
}

// Find NLT Bible ID by searching cached Bibles
async function getBibleId(versionName = 'NLT') {
  if (cachedBibleId) return cachedBibleId;

  const bibles = await fetchBibles();

  // Try to find exact match or partial match
  const bible = bibles.find(b =>
    b.name.toLowerCase().includes(versionName.toLowerCase())
  );

  if (!bible) throw new Error(`Bible version "${versionName}" not found.`);

  cachedBibleId = bible.id;
  return cachedBibleId;
}

// Convert user-friendly reference to API passage ID format
// e.g. "John 3:16" => "JHN.3.16"
function formatReference(ref) {
  // Basic parsing: split book, chapter, verse
  // This can be improved with a proper parser if needed
  const parts = ref.match(/([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)/);
  if (!parts) throw new Error(`Invalid reference format: ${ref}`);

  let book = parts[1].replace(/\s/g, '').toUpperCase();

  // API uses abbreviations like JHN for John, ROM for Romans, etc.
  // We need a small lookup table for common books:
  const bookMap = {
    'GENESIS': 'GEN',
    'EXODUS': 'EXO',
    'LEVITICUS': 'LEV',
    'NUMBERS': 'NUM',
    'DEUTERONOMY': 'DEU',
    'JOSHUA': 'JOS',
    'JUDGES': 'JDG',
    'RUTH': 'RUT',
    '1SAMUEL': '1SA',
    '2SAMUEL': '2SA',
    '1KINGS': '1KI',
    '2KINGS': '2KI',
    '1CHRONICLES': '1CH',
    '2CHRONICLES': '2CH',
    'EZRA': 'EZR',
    'NEHEMIAH': 'NEH',
    'ESTHER': 'EST',
    'JOB': 'JOB',
    'PSALMS': 'PSA',
    'PROVERBS': 'PRO',
    'ECCLESIASTES': 'ECC',
    'SONGOFSONGS': 'SNG',
    'ISAIAH': 'ISA',
    'JEREMIAH': 'JER',
    'LAMENTATIONS': 'LAM',
    'EZEKIEL': 'EZK',
    'DANIEL': 'DAN',
    'HOSEA': 'HOS',
    'JOEL': 'JOL',
    'AMOS': 'AMO',
    'OBADIAH': 'OBA',
    'JONAH': 'JON',
    'MICAH': 'MIC',
    'NAHUM': 'NAH',
    'HABAKKUK': 'HAB',
    'ZEPHANIAH': 'ZEP',
    'HAGGAI': 'HAG',
    'ZECHARIAH': 'ZEC',
    'MALACHI': 'MAL',
    'MATTHEW': 'MAT',
    'MARK': 'MRK',
    'LUKE': 'LUK',
    'JOHN': 'JHN',
    'ACTS': 'ACT',
    'ROMANS': 'ROM',
    '1CORINTHIANS': '1CO',
    '2CORINTHIANS': '2CO',
    'GALATIANS': 'GAL',
    'EPHESIANS': 'EPH',
    'PHILIPPIANS': 'PHP',
    'COLOSSIANS': 'COL',
    '1THESSALONIANS': '1TH',
    '2THESSALONIANS': '2TH',
    '1TIMOTHY': '1TI',
    '2TIMOTHY': '2TI',
    'TITUS': 'TIT',
    'PHILEMON': 'PHM',
    'HEBREWS': 'HEB',
    'JAMES': 'JAS',
    '1PETER': '1PE',
    '2PETER': '2PE',
    '1JOHN': '1JN',
    '2JOHN': '2JN',
    '3JOHN': '3JN',
    'JUDE': 'JUD',
    'REVELATION': 'REV'
  };

  // Normalize book for lookup: remove spaces & numbers
  let normBook = book.toUpperCase().replace(/\s/g, '').replace(/^([123])/, '$1');
  // Some books like '1 John' become '1JOHN', handle that
  // If not found, try to remove digits
  if (!bookMap[normBook]) normBook = normBook.replace(/[123]/g, '');

  const apiBook = bookMap[normBook];
  if (!apiBook) throw new Error(`Unsupported or unknown book: ${ref}`);

  const chapter = parts[2];
  const verse = parts[3];

  return `${apiBook}.${chapter}.${verse}`;
}

// Fetch verse by reference, returns { reference, text }
export async function fetchVerse(reference, version = 'NLT') {
  try {
    const bibleId = await getBibleId(version);
    const passageId = formatReference(reference);

    const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}`;
    const res = await fetch(url, {
      headers: { 'api-key': API_KEY }
    });

    if (!res.ok) {
      console.error('API.Bible fetch error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const html = data.data.content;
    const text = stripHtml(html).replace(/\s+/g, ' ').trim();

    return {
      reference,
      text
    };
  } catch (err) {
    console.error('fetchVerse error:', err);
    return null;
  }
}
