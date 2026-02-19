// js/main.js
import { loadSettings, updateSettings, resetSettings } from "./settings.js";
import {
  applyTheme,
  applyLanguageUI,
  hydrateLanguageOptions,
  setStatus
} from "./ui.js";
import { LANG_META, t } from "./i18n.js";

function init() {
  hydrateLanguageOptions();

  // 1) Load persisted settings (JSON from localStorage)
  let settings = loadSettings();

  // 2) Apply settings on first load
  applyTheme(settings.theme);
  document.getElementById("languageSelect").value = settings.language;

  // Apply language UI text + pill preview
  applyLanguageUI(settings.language, settings);

  // Set initial status
  setStatus(t(settings.language).statusReady);

  // 3) Theme Toggle Logic (persist on change)
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    settings = updateSettings({ theme: nextTheme });

    applyTheme(settings.theme);
    applyLanguageUI(settings.language, settings);
    setStatus(t(settings.language).statusSaved);
  });

  // 4) Language Change Logic (persist on change)
  const languageSelect = document.getElementById("languageSelect");
  languageSelect.addEventListener("change", (e) => {
    const nextLang = e.target.value;
    settings = updateSettings({ language: nextLang });

    // Update the document lang attribute (professional touch)
    document.documentElement.lang = nextLang === "en" ? "en" : "en"; // keep as "en" if you want; or map properly

    applyLanguageUI(settings.language, settings);
    setStatus(t(settings.language).statusSaved);
  });

  // 5) Reset button
  const resetBtn = document.getElementById("resetBtn");
  resetBtn.addEventListener("click", () => {
    settings = resetSettings();

    applyTheme(settings.theme);
    document.getElementById("languageSelect").value = settings.language;
    applyLanguageUI(settings.language, settings);
    setStatus(t(settings.language).statusSaved);
  });

  // Optional: reflect changes across multiple tabs/windows
  window.addEventListener("storage", (event) => {
    if (event.key !== "app.settings.v1") return;
    settings = loadSettings();

    applyTheme(settings.theme);
    document.getElementById("languageSelect").value = settings.language;
    applyLanguageUI(settings.language, settings);
    setStatus(t(settings.language).statusSaved);
  });
}

init();