import { fetchVerse } from './api.js';
import { getSettings } from './settings.js';

const STORAGE_KEY = 'bvm_user_verses';
let verses = loadVerses();

function loadVerses() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  // Default seed verses
  const defaultVerses = [
    {
      reference: "Romans 12:2",
      text: "Don’t copy the behavior and customs of this world, but let God transform you into a new person by changing the way you think."
    },
    {
      reference: "Philippians 4:13",
      text: "For I can do everything through Christ, who gives me strength."
    },
    {
      reference: "Proverbs 3:5",
      text: "Trust in the Lord with all your heart; do not depend on your own understanding."
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultVerses));
  return defaultVerses;
}

function saveVerses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verses));
}

export async function addVerse(reference, text = null) {
  const normalizedRef = reference.trim().toLowerCase();

  if (verses.some(v => v.reference.toLowerCase() === normalizedRef)) {
    return { success: false, message: "Verse already exists" };
  }

  try {
    if (!text) {
      const { translation } = getSettings();
      const result = await fetchVerse(reference, translation);

      if (!result || !result.text) {
        return { success: false, message: "Could not fetch verse" };
      }

      text = result.text;
      reference = result.reference;
    }

    verses.push({ reference, text });
    saveVerses();

    return { success: true };
  } catch (err) {
    console.error("addVerse error:", err);
    return { success: false, message: err.message || "Unknown error" };
  }
}

export function getAllVerses() {
  return [...verses];
}

export function deleteVerse(reference) {
  const normalized = reference.toLowerCase();
  verses = verses.filter(v => v.reference.toLowerCase() !== normalized);
  saveVerses();
}

export function getVerse(reference) {
  const normalized = reference.toLowerCase();
  return verses.find(v => v.reference.toLowerCase() === normalized);
}

export function clearAllVerses() {
  verses = [];
  saveVerses();
}
