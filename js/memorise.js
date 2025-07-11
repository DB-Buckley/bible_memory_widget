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
    <div id="ghostText" style="font-family: monospace; font-size: 1.2rem; line-height: 1.4; margin-bottom: 1em; user-select:none;"></div>
    <input
      id="userInput"
      type="text"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      style="width: 100%; padding: 8px; font-size: 1.1rem; font-family: monospace; box-sizing: border-box;"
      placeholder="Start typing the verse here..."
    />
    <br/>
    <button onclick="window.evaluateInput()">Submit</button>
    <button onclick="window.showHint()">💡 Hint</button>
    <div id="result" style="margin-top: 1em;"></div>
    <br/>
    <button onclick="window.memoriseShowPhase2()">⬅ Back</button>
  `;

  const input = document.getElementById("userInput");
  const ghostText = document.getElementById("ghostText");

  let currentInput = "";

  // Render ghost text with typed chars replacing placeholders
  function renderGhostText() {
    ghostText.innerHTML = "";
    const target = currentVerse.text;

    for (let i = 0; i < target.length; i++) {
      const span = document.createElement("span");
      const typedChar = currentInput[i];
      const targetChar = target[i];

      if (typedChar == null) {
        // Not typed yet: show faded char
        span.textContent = targetChar;
        span.style.opacity = "0.3";
      } else {
        span.textContent = typedChar;
        if (typedChar === targetChar) {
          span.style.color = "#000";
        } else {
          span.style.color = "red";
          span.style.fontWeight = "bold";
        }
      }
      ghostText.appendChild(span);
    }
  }

  // Update input handler
  input.addEventListener("input", (e) => {
    currentInput = e.target.value;
    renderGhostText();
  });

  // Focus input
  setTimeout(() => input.focus(), 100);

  // Initialize ghost text
  renderGhostText();

  window._hintIndices = null;
  window._originalWords = null;
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
