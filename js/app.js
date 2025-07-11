import { addVerse, getAllVerses, deleteVerse } from './verses.js';
import { getSettings, updateSettings } from './settings.js';
import { startTypingPractice } from './memorise.js'; // 🆕 Renamed import

window.onload = () => {
  document.getElementById("addVerseBtn").onclick = handleAddVerse;

  document.getElementById("startBtn").onclick = () => {
    toggleScreen("memory-screen");
    startTypingPractice("memory-screen"); // 🆕 Start typing widget
  };

  document.getElementById("saveSettingsBtn").onclick = () => {
    updateSettings({
      mode: document.getElementById("typingMode").value,
      passThreshold: parseInt(document.getElementById("passScore").value)
    });
    toggleSettings();
  };

  loadVerseList();
  applyUserSettings();
};

function handleAddVerse() {
  const input = document.getElementById("verseInput").value.trim();
  if (!input) return;

  const [ref, ...rest] = input.split("|");
  const text = rest.join("|").trim() || null;

  addVerse(ref, text).then(result => {
    if (!result.success) alert(result.message);
    loadVerseList();
  });
}

function loadVerseList() {
  const list = document.getElementById("verseList");
  list.innerHTML = "";

  getAllVerses().forEach(v => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${v.reference}</strong><p>${v.text}</p>
    <button onclick="window.deleteVerseAction('${v.reference}')">❌</button>`;
    list.appendChild(div);
  });
}

window.deleteVerseAction = function (ref) {
  deleteVerse(ref);
  loadVerseList();
};

window.toggleSettings = function () {
  const settingsBox = document.getElementById("settings");
  settingsBox.style.display = settingsBox.style.display === "none" ? "block" : "none";
};

function toggleScreen(idToShow) {
  document.querySelectorAll("section").forEach(sec => {
    sec.style.display = "none";
  });
  document.getElementById(idToShow).style.display = "block";
}

function applyUserSettings() {
  const settings = getSettings();
  document.getElementById("typingMode").value = settings.mode;
  document.getElementById("passScore").value = settings.passThreshold;
}
