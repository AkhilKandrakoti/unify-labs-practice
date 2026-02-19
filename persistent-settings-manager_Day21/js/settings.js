// js/settings.js
const STORAGE_KEY = "app.settings.v1";

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "light",     // "light" | "dark"
  language: "en"      // "en" | "hi" | "te"
});

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };

    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return { ...DEFAULT_SETTINGS };

    // Merge + validate (prevents broken values from crashing UI)
    const theme = parsed.theme === "dark" ? "dark" : "light";
    const language = ["en", "hi", "te"].includes(parsed.language) ? parsed.language : "en";

    return { ...DEFAULT_SETTINGS, theme, language };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  // Expecting one object that holds multiple settings
  const safe = {
    theme: settings?.theme === "dark" ? "dark" : "light",
    language: ["en", "hi", "te"].includes(settings?.language) ? settings.language : "en"
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function updateSettings(patch) {
  const current = loadSettings();
  const next = { ...current, ...patch };
  return saveSettings(next);
}

export function resetSettings() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_SETTINGS };
}