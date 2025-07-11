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

    // Parse reference into book, chapter, and verse
    const refEncoded = encodeURIComponent(reference);

    const res = await fetch(`${BASE_URL}/bibles/${bibleId}/verses/${refEncoded}`, {
      headers: { 'api-key': API_KEY }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const json = await res.json();
    const text = json.data?.content?.replace(/<[^>]+>/g, '').trim(); // Strip HTML

    return {
      reference: json.data.reference,
      text
    };
  } catch (err) {
    console.error("fetchVerse error:", err);
    return null;
  }
}
