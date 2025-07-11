const SETTINGS_KEY = 'bvm_user_settings';

let defaultSettings = {
  mode: 'full',         // 'full' or 'first-letter'
  passThreshold: 90     // percentage
};

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : defaultSettings;
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings() {
  return loadSettings();
}

export function updateSettings(newSettings) {
  const updated = { ...loadSettings(), ...newSettings };
  saveSettings(updated);
}
