// js/i18n.js
export const LANG_META = {
  en: { name: "English" },
  hi: { name: "Hindi" },
  te: { name: "Telugu" }
};

export const STRINGS = {
  en: {
    title: "Persistent Settings Manager",
    subtitle: "Your preferences are saved in your browser and restored when you return.",
    themeLabel: "Theme",
    themeHint: "Switch between Light and Dark mode.",
    languageLabel: "Language",
    languageHint: "Choose your preferred language.",
    previewTitle: "Preview",
    previewText: "This area updates instantly based on your saved settings.",
    reset: "Reset to defaults",
    saved: "Changes are saved automatically.",
    statusReady: "Ready",
    statusSaved: "Saved",
    themeLight: "Light",
    themeDark: "Dark",
    pillTheme: (t) => `Theme: ${t}`,
    pillLang: (l) => `Language: ${l}`
  },
  hi: {
    title: "स्थायी सेटिंग्स मैनेजर",
    subtitle: "आपकी पसंद ब्राउज़र में सेव होती है और वापस आने पर फिर से लागू हो जाती है।",
    themeLabel: "थीम",
    themeHint: "लाइट और डार्क मोड के बीच बदलें।",
    languageLabel: "भाषा",
    languageHint: "अपनी पसंदीदा भाषा चुनें।",
    previewTitle: "प्रीव्यू",
    previewText: "यह सेक्शन आपकी सेव सेटिंग्स के अनुसार तुरंत अपडेट होता है।",
    reset: "डिफ़ॉल्ट पर रीसेट करें",
    saved: "बदलाव अपने आप सेव हो जाते हैं।",
    statusReady: "तैयार",
    statusSaved: "सेव हो गया",
    themeLight: "लाइट",
    themeDark: "डार्क",
    pillTheme: (t) => `थीम: ${t}`,
    pillLang: (l) => `भाषा: ${l}`
  },
  te: {
    title: "శాశ్వత సెట్టింగ్స్ మేనేజర్",
    subtitle: "మీ ఎంపికలు బ్రౌజర్‌లో సేవ్ అవుతాయి—మీరు తిరిగి వచ్చినప్పుడు కూడా అలాగే ఉంటాయి.",
    themeLabel: "థీమ్",
    themeHint: "లైట్ మరియు డార్క్ మోడ్‌ల మధ్య మారండి.",
    languageLabel: "భాష",
    languageHint: "మీకు నచ్చిన భాషను ఎంచుకోండి.",
    previewTitle: "ప్రివ్యూ",
    previewText: "సేవ్ చేసిన సెట్టింగ్స్ ప్రకారం ఇది వెంటనే అప్‌డేట్ అవుతుంది.",
    reset: "డిఫాల్ట్‌కు రీసెట్ చేయండి",
    saved: "మార్పులు ఆటోమేటిక్‌గా సేవ్ అవుతాయి.",
    statusReady: "సిద్ధం",
    statusSaved: "సేవ్ అయ్యింది",
    themeLight: "లైట్",
    themeDark: "డార్క్",
    pillTheme: (t) => `థీమ్: ${t}`,
    pillLang: (l) => `భాష: ${l}`
  }
};

export function t(lang) {
  return STRINGS[lang] ?? STRINGS.en;
}