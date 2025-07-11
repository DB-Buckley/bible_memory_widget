import { getAllVerses } from './verses.js';
import { getSettings } from './settings.js';

let currentVerse = null;

export function startMemorisationFlow(containerId) {
  const container = document.getElementById(containerId);
  const verses = getAllVerses();

  if (verses.length === 0) {
    container.innerHTML = "<p>No verses available. Please add some first.</p>";
    return;
  }

  currentVerse = verses[Math.floor(Math.random() * verses.length)];
  showPhase1(container);
}

function showPhase1(container) {
  container.innerHTML = `
    <div class="card"><strong>${currentVerse.reference}</strong></div>
    <div class="card">${currentVerse.text}</div>
    <button onclick="window.memoriseShowPhase2()">Next</button>
  `;
}

window.memoriseShowPhase1 = function () {
  const container = document.getElementById("memory-screen");
  showPhase1(container);
};

window.memoriseShowPhase2 = function () {
  const container = document.getElementById("memory-screen");

  const options = generateFakeOptions(currentVerse);
  container.innerHTML = `<div class="card"><strong>${currentVerse.reference}</strong></div>`;

  const backBtn = document.createElement("button");
  backBtn.innerText = "⬅ Back";
  backBtn.onclick = () => window.memoriseShowPhase1();
  container.appendChild(backBtn);

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "card";
    btn.innerText = opt;
    btn.onclick = () => {
      if (opt === currentVerse.text) {
        window.memoriseShowPhase3();
      } else {
        alert("Incorrect. Try again.");
      }
    };
    container.appendChild(btn);
  });
};

window.memoriseShowPhase3 = function () {
  const container = document.getElementById("memory-screen");
  const settings = getSettings();

  container.innerHTML = `
    <div class="card"><strong>${currentVerse.reference}</strong></div>
    <textarea
      id="userInput"
      placeholder="Type the verse here..."
      oninput="window.liveHintUpdate()"
      rows="5"
      style="width: 100%; box-sizing: border-box;"
    ></textarea>
    <br/>
    <button onclick="window.evaluateInput()">Submit</button>
    <button onclick="window.showHint()">💡 Hint</button>
    <div id="result" style="margin-top: 1em;"></div>
    <br/>
    <button onclick="window.memoriseShowPhase2()">⬅ Back</button>
  `;

  setTimeout(() => {
    const textarea = document.getElementById("userInput");
    if (textarea) textarea.focus();
  }, 100);

  window._hintIndices = null;
  window._originalWords = null;
};

window.showHint = function () {
  if (!currentVerse) return;

  const words = currentVerse.text.split(" ");
  const totalToShow = Math.max(1, Math.floor(words.length * 0.3));
  const indices = [];

  while (indices.length < totalToShow) {
    const idx = Math.floor(Math.random() * words.length);
    if (!indices.includes(idx)) indices.push(idx);
  }

  const hintWords = words.map((word, i) => (indices.includes(i) ? word : "_____"));
  const hintText = hintWords.join(" ");

  const textarea = document.getElementById("userInput");
  if (textarea) textarea.placeholder = hintText;

  window._hintIndices = indices;
  window._originalWords = words;
};

window.liveHintUpdate = function () {
  const textarea = document.getElementById("userInput");
  if (!textarea) return;

  const userInput = textarea.value.trim();
  if (!userInput) return;

  const userInputWords = userInput.split(/\s+/);
  const settings = getSettings();

  if (!window._hintIndices || !window._originalWords) return;

  const displayWords = window._originalWords.map((word, i) => {
    if (userInputWords[i] === word) return word;

    if (
      settings.mode === "first-letter" &&
      userInputWords[i] &&
      word.toLowerCase().startsWith(userInputWords[i][0].toLowerCase())
    ) {
      return word;
    }

    return window._hintIndices.includes(i) ? word : "_____";
  });

  textarea.placeholder = displayWords.join(" ");
};

window.evaluateInput = function () {
  const textarea = document.getElementById("userInput");
  if (!textarea) return;

  const input = textarea.value.trim();
  const settings = getSettings();
  const expected = currentVerse.text.trim();
  const score = calculateScore(input, expected, settings.mode);

  const resultBox = document.getElementById("result");
  if (!resultBox) return;

  resultBox.innerHTML = `You scored <strong>${score}%</strong>`;

  if (score >= settings.passThreshold) {
    resultBox.innerHTML += "<br/><span style='color:green;'>✅ Passed!</span>";
  } else {
    resultBox.innerHTML += "<br/><span style='color:red;'>❌ Try Again</span>";
  }
};

function calculateScore(input, expected, mode) {
  if (mode === "first-letter") {
    input = input
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w[0] : ""))
      .join("");
    expected = expected
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w[0] : ""))
      .join("");
  }

  let correct = 0;
  const minLen = Math.min(input.length, expected.length);
  for (let i = 0; i < minLen; i++) {
    if (input[i] === expected[i]) correct++;
  }

  return Math.round((correct / expected.length) * 100);
}

function generateFakeOptions(correctVerse) {
  const all = getAllVerses().filter(
    (v) => v.reference.toLowerCase() !== correctVerse.reference.toLowerCase()
  );
  const wrongs = all
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .map((v) => v.text);

  const options = [correctVerse.text, ...wrongs];
  return options.sort(() => 0.5 - Math.random());
}
