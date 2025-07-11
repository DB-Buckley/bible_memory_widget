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
    <div id="inputContainer">
      <div id="ghostText"></div>
      <textarea id="userInput" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
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

  // Split target preserving spaces/punctuation as tokens
  const targetTokens = targetText.match(/(\S+|\s+)/g);

  function renderGhostText() {
    ghostText.innerHTML = "";
    // Split user input preserving spaces
    const userTokens = userInput.match(/(\S+|\s+)/g) || [];

    for (let i = 0; i < targetTokens.length; i++) {
      const targetToken = targetTokens[i];
      const userToken = userTokens[i] || "";

      const span = document.createElement("span");

      // If token is whitespace or punctuation
      if (/^\s+$/.test(targetToken) || /^[^\w\s]+$/.test(targetToken)) {
        span.textContent = targetToken;
        span.style.color = "rgba(0,0,0,0.3)";
      } else {
        if (settings.mode === "first-letter") {
          if (
            userToken.length > 0 &&
            userToken[0].toLowerCase() === targetToken[0].toLowerCase()
          ) {
            // Show full word in black if first letter matches
            span.textContent = targetToken;
            span.style.color = "black";
          } else {
            span.textContent = targetToken;
            span.style.color = "rgba(0,0,0,0.3)";
          }
        } else {
          // Normal mode: letter by letter, highlight mistakes
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

    if (settings.mode === "first-letter") {
      // Auto complete spaces and punctuation as user types
      // Also, if first letter matches, autocomplete full word

      const inputTokens = val.match(/(\S+|\s+)/g) || [];

      for (let i = 0; i < inputTokens.length; i++) {
        const token = inputTokens[i];
        const targetToken = targetTokens[i];

        if (!targetToken) continue;

        // Auto-complete spaces and punctuation exactly
        if (/^\s+$/.test(targetToken) || /^[^\w\s]+$/.test(targetToken)) {
          if (token !== targetToken) {
            inputTokens[i] = targetToken;
          }
          continue;
        }

        // Autocomplete full word if first letter typed correctly and only 1 letter typed
        if (
          token.length === 1 &&
          token[0].toLowerCase() === targetToken[0].toLowerCase()
        ) {
          inputTokens[i] = targetToken;
        }
      }

      const newVal = inputTokens.join("");
      if (newVal !== val) {
        val = newVal;
        textarea.value = newVal;
        // move cursor to end
        textarea.selectionStart = textarea.selectionEnd = newVal.length;
      }
    }

    userInput = val;
    renderGhostText();
  });

  textarea.value = "";
  userInput = "";
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
