// js/ui.js
import { LANG_META, t } from "./i18n.js";

export function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);

  // Optional: update <meta> color for mobile (not required, but professional polish)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0f17" : "#f6f7fb");
}

export function setThemeToggleState(isDark) {
  const btn = document.getElementById("themeToggle");
  const text = document.getElementById("themeToggleText");
  btn.setAttribute("aria-checked", String(isDark));
  text.textContent = isDark ? "Dark" : "Light";
}

export function hydrateLanguageOptions() {
  // Keeps option labels consistent (optional)
  const select = document.getElementById("languageSelect");
  [...select.options].forEach((opt) => {
    const meta = LANG_META[opt.value];
    if (meta) opt.textContent = meta.name;
  });
}

export function applyLanguageUI(lang, settings) {
  const strings = t(lang);

  // Main copy
  document.getElementById("title").textContent = strings.title;
  document.getElementById("subtitle").textContent = strings.subtitle;

  // Labels/hints
  document.getElementById("themeLabel").textContent = strings.themeLabel;
  document.getElementById("themeHint").textContent = strings.themeHint;
  document.getElementById("languageLabel").textContent = strings.languageLabel;
  document.getElementById("languageHint").textContent = strings.languageHint;

  // Preview
  document.getElementById("previewTitle").textContent = strings.previewTitle;
  document.getElementById("previewText").textContent = strings.previewText;

  // Buttons/footer
  document.getElementById("resetBtn").textContent = strings.reset;
  document.getElementById("saveText").textContent = strings.saved;

  // Theme toggle text
  const themeName = settings.theme === "dark" ? strings.themeDark : strings.themeLight;
  document.getElementById("themeToggleText").textContent = themeName;

  // Pills
  document.getElementById("pillTheme").textContent = strings.pillTheme(themeName);
  document.getElementById("pillLang").textContent = strings.pillLang(LANG_META[lang]?.name ?? "English");
}

export function setStatus(text) {
  document.getElementById("statusText").textContent = text;
}