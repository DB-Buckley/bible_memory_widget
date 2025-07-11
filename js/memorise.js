import { getAllVerses } from './verses.js';
import { getSettings } from './settings.js';

let currentVerse = null;

export function startMemorisationFlow(containerId, onComplete) {
  const container = document.getElementById(containerId);
  const verses = getAllVerses();

  if (verses.length === 0) {
    container.innerHTML = "<p>No verses available. Please add some first.</p>";
    return;
  }

  currentVerse = verses[Math.floor(Math.random() * verses.length)];
  showPhase1(container, onComplete);
}

function showPhase1(container, onComplete) {
  container.innerHTML = `
    <div class="card"><strong>${currentVerse.reference}</strong></div>
    <div class="card">${currentVerse.text}</div>
    <button onclick="window.memoriseShowPhase2()">Next</button>
  `;
}

window.memoriseShowPhase2 = function () {
  const container = document.getElementById("memory-screen");

  const options = generateFakeOptions(currentVerse);
  container.innerHTML = `<div class="card"><strong>${currentVerse.reference}</strong></div>`;

  const backBtn = document.createElement("button");
  backBtn.innerText = "⬅ Back";
  backBtn.onclick = () => showPhase1(container, null);
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
    <textarea id="userInput" placeholder="Type the verse here..."></textarea>
    <button onclick="window.evaluateInput()">Submit</button>
    <div id="result"></div>
  `;

  container.innerHTML += `
    <br/><button onclick="window.memoriseShowPhase2()">⬅ Back</button>`;

};

window.evaluateInput = function () {
  const input = document.getElementById("userInput").value.trim();
  const settings = getSettings();

  const expected = currentVerse.text.trim();
  const score = calculateScore(input, expected, settings.mode);

  const resultBox = document.getElementById("result");
  resultBox.innerHTML = `You scored <strong>${score}%</strong>`;

  if (score >= settings.passThreshold) {
    resultBox.innerHTML += "<br/><span style='color:green;'>✅ Passed!</span>";
  } else {
    resultBox.innerHTML += "<br/><span style='color:red;'>❌ Try Again</span>";
  }
};

function calculateScore(input, expected, mode) {
  if (mode === 'first-letter') {
    input = input.split(/\s+/).map(w => w[0] || "").join("");
    expected = expected.split(/\s+/).map(w => w[0] || "").join("");
  }

  let correct = 0;
  const minLen = Math.min(input.length, expected.length);
  for (let i = 0; i < minLen; i++) {
    if (input[i] === expected[i]) correct++;
  }

  return Math.round((correct / expected.length) * 100);
}

function generateFakeOptions(correctVerse) {
  const all = getAllVerses().filter(v => v.reference !== correctVerse.reference);
  const wrongs = all.sort(() => 0.5 - Math.random()).slice(0, 2).map(v => v.text);
  const options = [correctVerse.text, ...wrongs];
  return options.sort(() => 0.5 - Math.random());
}
