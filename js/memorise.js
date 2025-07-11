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
    <div id="inputContainer" style="position: relative; width: 100%; min-height: 5em; font-family: monospace; font-size: 1.2rem; line-height: 1.4; border: 1px solid #ccc; padding: 8px; box-sizing: border-box;">
      <div id="ghostText" style="position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; color: rgba(0,0,0,0.3); white-space: pre-wrap; word-wrap: break-word;"></div>
      <textarea id="userInput" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        style="position: relative; background: transparent; color: transparent; caret-color: black; border: none; resize: none; width: 100%; height: 100%; overflow: hidden; font-family: monospace; font-size: 1.2rem; line-height: 1.4;"></textarea>
    </div>
    <br/>
    <button onclick="window.evaluateInput()">Submit</button>
    <button onclick="window.showHint()">💡 Hint</button>
    <div id="result" style="margin-top: 1em;"></div>
    <br/>
    <button onclick="window.memoriseShowPhase2()">⬅ Back</button>
  `;

  const textarea = document.getElementById("userInput");
  const ghostText = document.getElementById("ghostText");

  const targetText = currentVerse.text;
  let userInput = "";

  // Split target into words for first-letter mode completion
  const targetWords = targetText.split(/(\s+)/); // keep spaces as tokens for spacing

  // Helper to rebuild ghostText with colored spans and auto-complete words if first-letter mode
  function renderGhostText() {
    ghostText.innerHTML = "";

    // Split user input by spaces
    const userWords = userInput.split(/(\s+)/);

    let wordIndex = 0;  // index in targetWords
    let userWordIndex = 0;  // index in userWords

    while (wordIndex < targetWords.length) {
      const targetWord = targetWords[wordIndex];

      // Spaces: just append as-is
      if (/^\s+$/.test(targetWord)) {
        const span = document.createElement("span");
        span.textContent = targetWord;
        ghostText.appendChild(span);
        wordIndex++;
        continue;
      }

      // Word processing
      const userWord = userWords[userWordIndex] || "";

      if (settings.mode === "first-letter") {
        // If user typed first letter correct => complete whole word
        if (userWord.length > 0 && userWord[0].toLowerCase() === targetWord[0].toLowerCase()) {
          // show full word in black
          appendColoredWord(targetWord, "black");
        } else {
          // show word faded
          appendColoredWord(targetWord, "rgba(0,0,0,0.3)");
        }
      } else {
        // Normal mode: show letter by letter, highlight mistakes
        for (let i = 0; i < targetWord.length; i++) {
          const span = document.createElement("span");
          const typedChar = userWord[i];
          const targetChar = targetWord[i];
          if (typedChar == null) {
            span.textContent = targetChar;
            span.style.color = "rgba(0,0,0,0.3)";
          } else if (typedChar === targetChar) {
            span.textContent = typedChar;
            span.style.color = "black";
          } else {
            span.textContent = typedChar;
            span.style.color = "red";
            span.style.fontWeight = "bold";
          }
          ghostText.appendChild(span);
        }
      }

      wordIndex++;
      userWordIndex++;
    }
  }

  function appendColoredWord(word, color) {
    const span = document.createElement("span");
    span.textContent = word;
    span.style.color = color;
    ghostText.appendChild(span);
  }

  // Handle user input event
  textarea.addEventListener("input", (e) => {
    userInput = e.target.value;

    if (settings.mode === "first-letter") {
      // Auto complete logic:
      // If user typed first letter correctly for a word, replace that word with full in input.

      let splitInput = userInput.split(/(\s+)/); // include spaces

      for (let i = 0; i < splitInput.length; i++) {
        if (/^\s+$/.test(splitInput[i])) continue; // skip spaces

        const targetWord = targetWords[i];
        const inputWord = splitInput[i];

        if (
          inputWord.length === 1 &&
          targetWord &&
          inputWord[0].toLowerCase() === targetWord[0].toLowerCase()
        ) {
          // Auto complete word in input
          splitInput[i] = targetWord;
        }
      }

      const newInput = splitInput.join("");
      if (newInput !== userInput) {
        userInput = newInput;
        textarea.value = newInput;
        // Set cursor to end
        textarea.selectionStart = textarea.selectionEnd = newInput.length;
      }
    }

    renderGhostText();
  });

  // Initialize
  textarea.value = "";
  renderGhostText();

  textarea.focus();

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
