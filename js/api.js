export async function fetchVerse(reference) {
  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=nlt`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      reference: data.reference,
      text: data.text.trim().replace(/\s+/g, ' ')
    };
  } catch (err) {
    console.error("Verse fetch failed:", err);
    return null;
  }
}
