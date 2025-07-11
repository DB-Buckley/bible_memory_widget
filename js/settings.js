const SETTINGS_KEY = 'bvm_user_settings';

const defaultSettings = {
  mode: 'full',             // 'full' or 'first-letter'
  passThreshold: 90,        // % required to pass a verse
  translation: 'ASV'        // Preferred Bible translation
};

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;

  const parsed = JSON.parse(raw);
  // Ensure all default keys are present (for backward compatibility)
  return { ...defaultSettings, ...parsed };
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
