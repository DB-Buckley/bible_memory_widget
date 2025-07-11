import { getSettings } from './settings.js';

const API_KEY = '1085474b2991fc06a527e76388f707d5'; // Replace with your own key if needed
const BASE_URL = 'https://api.scripture.api.bible/v1';

const knownBibles = {
  ASV: "685d1470fe4d5c3b-01",
  KJV: "de4e12af7f28f599-01",
  LSV: "01b29f4b342acc35-01",
  WEB: "9879dbb7cfe39e4d-01"
};

function getBibleId(translation) {
  if (!knownBibles[translation]) {
    throw new Error(`Bible version "${translation}" is not supported.`);
  }
  return knownBibles[translation];
}

export async function fetchVerse(reference) {
  try {
    const settings = getSettings();
    const bibleId = getBibleId(settings.translation || 'ASV');

    // Step 1: Search the verse to get verse ID
    const searchUrl = `${BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(reference)}&limit=1`;

    const searchRes = await fetch(searchUrl, {
      headers: { 'api-key': API_KEY }
    });

    if (!searchRes.ok) {
      throw new Error(`Search failed: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();

    const verseId = searchData?.data?.verses?.[0]?.id;
    const refText = searchData?.data?.verses?.[0]?.reference;

    if (!verseId) {
      throw new Error(`Verse not found for "${reference}"`);
    }

    // Step 2: Fetch actual verse content using verse ID
    const verseUrl = `${BASE_URL}/bibles/${bibleId}/verses/${verseId}`;
    const verseRes = await fetch(verseUrl, {
      headers: { 'api-key': API_KEY }
    });

    if (!verseRes.ok) {
      throw new Error(`Verse fetch failed: ${verseRes.status}`);
    }

    const verseData = await verseRes.json();
    const cleanText = verseData?.data?.content?.replace(/<[^>]+>/g, '').trim();

    return {
      reference: refText,
      text: cleanText
    };
  } catch (err) {
    console.error("fetchVerse error:", err);
    return null;
  }
}
