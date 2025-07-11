import { fetchVerse } from './api.js';

const STORAGE_KEY = 'bvm_user_verses';

let verses = loadVerses();

function loadVerses() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveVerses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verses));
}

export async function addVerse(reference, text = null) {
  // Avoid duplicates
  if (verses.some(v => v.reference.toLowerCase() === reference.toLowerCase())) {
    return { success: false, message: "Verse already exists" };
  }

  // Fetch if no text given
  if (!text) {
    const result = await fetchVerse(reference);
    if (!result) return { success: false, message: "Could not fetch verse" };
    text = result.text;
    reference = result.reference;
  }

  verses.push({ reference, text });
  saveVerses();
  return { success: true };
}

export function getAllVerses() {
  return [...verses];
}

export function deleteVerse(reference) {
  verses = verses.filter(v => v.reference.toLowerCase() !== reference.toLowerCase());
  saveVerses();
}

export function getVerse(reference) {
  return verses.find(v => v.reference.toLowerCase() === reference.toLowerCase());
}

export function clearAllVerses() {
  verses = [];
  saveVerses();
}
