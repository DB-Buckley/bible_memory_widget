import { getAllVerses } from './verses.js';
import { getSettings } from './settings.js';

let currentVerse = null;
let startTime = null;

export function startTypingPractice(containerId) {
  const container = document.getElementById(containerId);
  const verses = getAllVerses();

  if (verses.length === 0) {
    container.innerHTML = "<p>No verses available. Please add some first.</p>";
    return;
  }

  currentVerse = verses[Math.floor(Math.random() * verses.length)];
  renderTypingUI(container);
}

function renderTypingUI(container) {
  const settings = getSettings();

  container.innerHTML = `
    <div class="card"><strong>${currentVerse.reference}</strong></div>
    <div class="card">Start typing to begin tracking speed and accuracy.</div>

    <div id="inputContainer">
      <div id="ghostText"></div>
      <textarea id="userInput" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
    </div>

    <div id="tracker" style="margin-top: 1em;"></div>
  `;

  const textarea = document.getElementById("userInput");
  const ghostText = document.getElementById("ghostText");
  const tracker = document.getElementById("tracker");

  const targetText = currentVerse.text;
  let userInput = "";

  const targetTokens = targetText.match(/(\S+|\s+)/g);

  function renderGhostText() {
    ghostText.innerHTML = "";
    const userTokens = userInput.match(/(\S+|\s+)/g) || [];

    for (let i = 0; i < targetTokens.length; i++) {
      const targetToken = targetTokens[i];
      const userToken = userTokens[i] || "";
      const span = document.createElement("span");

      if (/^\s+$/.test(targetToken) || /^[^\w\s]+$/.test(targetToken)) {
        span.textContent = targetToken;
        span.style.color = "rgba(0,0,0,0.3)";
      } else {
        if (settings.mode === "first-letter") {
          if (
            userToken.length > 0 &&
            userToken[0].toLowerCase() === targetToken[0].toLowerCase()
          ) {
            span.textContent = targetToken;
            span.style.color = "black";
          } else {
            span.textContent = targetToken;
            span.style.color = "rgba(0,0,0,0.3)";
          }
        } else {
          let coloredText = "";
          for (let j = 0; j < targetToken.length; j++) {
            const typedChar = userToken[j];
            const targetChar = targetToken[j];
            if (typedChar == null) {
              coloredText += `<span style="color: rgba(0,0,0,0.3)">${targetChar}</span>`;
            } else if (typedChar === targetChar) {
              coloredText += `<span style="color: black">${typedChar}</span>`;
            } else {
              coloredText += `<span style="color: red; font-weight: bold;">${typedChar}</span>`;
            }
          }
          span.innerHTML = coloredText;
        }
      }

      ghostText.appendChild(span);
    }
  }

  textarea.addEventListener("input", (e) => {
    let val = e.target.value;

    if (!startTime) {
      startTime = Date.now();
    }

    if (settings.mode === "first-letter") {
      const inputTokens = val.match(/(\S+|\s+)/g) || [];

      for (let i = 0; i < inputTokens.length; i++) {
        const token = inputTokens[i];
        const targetToken = targetTokens[i];

        if (!targetToken) continue;

        if (/^\s+$/.test(targetToken) || /^[^\w\s]+$/.test(targetToken)) {
          inputTokens[i] = targetToken;
          continue;
        }

        if (
          token.length === 1 &&
          token[0].toLowerCase() === targetToken[0].toLowerCase()
        ) {
          inputTokens[i] = targetToken;
        }
      }

      val = inputTokens.join("");
      textarea.value = val;
      textarea.selectionStart = textarea.selectionEnd = val.length;
    }

    userInput = val;
    renderGhostText();
    updateTracker();
  });

  function updateTracker() {
    const elapsed = (Date.now() - startTime) / 1000;
    const wordsTyped = userInput.trim().split(/\s+/).length;
    const wpm = Math.round((wordsTyped / elapsed) * 60);

    const score = calculateAccuracy(userInput, targetText, settings.mode);
    tracker.innerHTML = `⏱️ <strong>${wpm} WPM</strong> | 🎯 <strong>${score}% Accuracy</strong>`;
  }

  renderGhostText();
  textarea.value = "";
  textarea.focus();
}

function calculateAccuracy(input, expected, mode) {
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
