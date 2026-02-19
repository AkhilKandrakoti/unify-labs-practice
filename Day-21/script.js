'use strict'; // ✅ Strict Mode Explained

// ✅ Cookies helpers
function setCookie(name, value, days = 30) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}
function getCookie(name) {
  const key = encodeURIComponent(name) + '=';
  return document.cookie.split(';').map(s => s.trim()).find(x => x.startsWith(key))?.slice(key.length) ? decodeURIComponent(
    document.cookie.split(';').map(s => s.trim()).find(x => x.startsWith(key)).slice(key.length)
  ) : null;
}
function delCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// ✅ JSON helpers
function safeParse(text) {
  try { return { ok: true, value: JSON.parse(text) }; }
  catch (e) { return { ok: false, error: e.message }; }
}
function pretty(obj) { return JSON.stringify(obj, null, 2); } // ✅ stringify

// DOM
const $ = (s) => document.querySelector(s);
const els = {
  mins: $('#mins'),
  goal: $('#goal'),
  start: $('#start'),
  saveDraft: $('#saveDraft'),
  loadDraft: $('#loadDraft'),
  exportBtn: $('#export'),
  importBtn: $('#import'),
  box: $('#box'),
  time: $('#time'),
  status: $('#status'),
  reset: $('#reset'),
  pillLocal: $('#pillLocal'),
  pillSession: $('#pillSession'),
  pillCookie: $('#pillCookie'),
  pillModule: $('#pillModule')
};

const LS_KEY = 'miniFocus_state';     // ✅ localStorage
const SS_KEY = 'miniFocus_draft';     // ✅ sessionStorage
const COOKIE_THEME = 'miniFocus_theme';

let intervalId = null;

// ✅ Modules (dynamic import using a Blob URL)
async function loadModule() {
  const src = `
    export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
    export function formatSec(s){
      const mm = String(Math.floor(s/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
      return mm + ':' + ss;
    }
  `;
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  const mod = await import(url);
  URL.revokeObjectURL(url);
  return mod;
}

let mod = null;

// ✅ this / bind / call / apply demo inside a tiny "logger"
const logger = {
  prefix: 'FOCUS',
  write(msg) {
    // `this.prefix` depends on binding
    els.status.textContent = `[${this.prefix}] ${msg}`;
  }
};

function updatePills() {
  const localOk = (() => { try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return true; } catch { return false; } })();
  const sessOk = (() => { try { sessionStorage.setItem('__t','1'); sessionStorage.removeItem('__t'); return true; } catch { return false; } })();
  els.pillLocal.textContent = `Local: ${localOk ? 'OK' : 'Blocked'}`;
  els.pillSession.textContent = `Session: ${sessOk ? 'OK' : 'Blocked'}`;
  els.pillCookie.textContent = `Cookie: ${navigator.cookieEnabled ? 'OK' : 'Blocked'}`;
  els.pillModule.textContent = `Module: ${mod ? 'Loaded' : '—'}`;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  setCookie(COOKIE_THEME, theme, 30); // ✅ cookies
}

function loadTheme() {
  const t = getCookie(COOKIE_THEME);
  if (t) applyTheme(t);
}

// Save app state to localStorage
function saveState(extra = {}) {
  const state = {
    mins: Number(els.mins.value || 25),
    goal: String(els.goal.value || ''),
    savedAt: new Date().toISOString(),
    ...extra
  };
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  return state;
}

// Load state from localStorage
function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  const p = safeParse(raw);
  return p.ok ? p.value : null;
}

function setTimeDisplay(totalSec) {
  els.time.textContent = mod ? mod.formatSec(totalSec) : `${Math.floor(totalSec/60)}:${String(totalSec%60).padStart(2,'0')}`;
}

function stopTimer() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  els.start.textContent = 'Start';
}

// Start timer with binding demo
function startTimer(totalSec) {
  stopTimer();

  // ✅ bind: permanently binds this
  const boundWrite = logger.write.bind({ prefix: 'BOUND' });

  // ✅ call: immediate invoke with chosen this
  logger.write.call({ prefix: 'CALL' }, `Starting ${Math.ceil(totalSec/60)} min`);

  // ✅ apply: immediate invoke with args array
  logger.write.apply({ prefix: 'APPLY' }, [`Goal: ${els.goal.value || '—'}`]);

  // Use bound for updates
  boundWrite('Timer running…');

  let sec = totalSec;
  setTimeDisplay(sec);

  intervalId = setInterval(() => {
    sec -= 1;
    setTimeDisplay(Math.max(sec, 0));

    if (sec === 10) boundWrite('10 seconds left… stay focused!');
    if (sec <= 0) {
      stopTimer();
      // ✅ localStorage persist completion info
      saveState({ lastCompletedAt: new Date().toISOString() });
      logger.write.call({ prefix: 'DONE' }, 'Session complete ✅');
    }
  }, 1000);

  els.start.textContent = 'Stop';
}

// Export / Import JSON
function exportJSON() {
  const state = saveState({ running: Boolean(intervalId) });
  els.box.value = pretty(state);
  // tiny cookie demo: last export time
  setCookie('miniFocus_lastExport', state.savedAt, 7);
  logger.write.call({ prefix: 'EXPORT' }, 'State exported to JSON.');
}

function importJSON() {
  const text = els.box.value.trim();
  const p = safeParse(text);
  if (!p.ok) {
    logger.write.call({ prefix: 'ERROR' }, `Invalid JSON: ${p.error}`);
    return;
  }
  const s = p.value || {};
  els.mins.value = Number(s.mins || 25);
  els.goal.value = String(s.goal || '');
  localStorage.setItem(LS_KEY, JSON.stringify(s)); // ✅ localStorage + stringify
  logger.write.call({ prefix: 'IMPORT' }, 'State imported ✅');
}

// session draft
function saveDraft() {
  const draft = { mins: els.mins.value, goal: els.goal.value };
  sessionStorage.setItem(SS_KEY, JSON.stringify(draft)); // ✅ sessionStorage
  logger.write.call({ prefix: 'SESSION' }, 'Draft saved (session).');
}

function loadDraft() {
  const raw = sessionStorage.getItem(SS_KEY);
  if (!raw) {
    logger.write.call({ prefix: 'SESSION' }, 'No session draft found.');
    return;
  }
  const p = safeParse(raw);
  if (!p.ok) {
    logger.write.call({ prefix: 'SESSION' }, 'Draft corrupted.');
    return;
  }
  els.mins.value = p.value.mins ?? 25;
  els.goal.value = p.value.goal ?? '';
  logger.write.call({ prefix: 'SESSION' }, 'Draft loaded ✅');
}

function resetAll() {
  stopTimer();
  localStorage.removeItem(LS_KEY);
  sessionStorage.removeItem(SS_KEY);
  delCookie(COOKIE_THEME);
  delCookie('miniFocus_lastExport');
  applyTheme('dark');
  els.mins.value = 25;
  els.goal.value = '';
  els.box.value = '';
  setTimeDisplay(25 * 60);
  logger.write.call({ prefix: 'RESET' }, 'Everything cleared ✅');
  updatePills();
}

// UI events
async function init() {
  loadTheme();

  mod = await loadModule(); // ✅ modules
  updatePills();

  // restore local state
  const s = loadState();
  if (s) {
    els.mins.value = s.mins ?? 25;
    els.goal.value = s.goal ?? '';
    logger.write.call({ prefix: 'RESTORE' }, 'Restored from localStorage.');
  } else {
    logger.write.call({ prefix: 'READY' }, 'Ready. Set minutes and Start.');
  }

  setTimeDisplay((Number(els.mins.value || 25)) * 60);

  els.start.addEventListener('click', () => {
    if (intervalId) {
      stopTimer();
      logger.write.call({ prefix: 'STOP' }, 'Timer stopped.');
      return;
    }
    const minutes = mod.clamp(Number(els.mins.value || 25), 1, 180);
    els.mins.value = minutes;
    saveState();
    startTimer(minutes * 60);
  });

  // presets
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains('chip') && t.dataset.preset) {
      const m = Number(t.dataset.preset);
      els.mins.value = m;
      setTimeDisplay(m * 60);
      logger.write.call({ prefix: 'PRESET' }, `Preset set to ${m} minutes.`);
    }
  });

  els.saveDraft.addEventListener('click', saveDraft);
  els.loadDraft.addEventListener('click', loadDraft);
  els.exportBtn.addEventListener('click', exportJSON);
  els.importBtn.addEventListener('click', importJSON);
  els.reset.addEventListener('click', resetAll);

  // click title to toggle theme (cookie)
  document.querySelector('h1').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
    logger.write.call({ prefix: 'THEME' }, `Theme: ${document.documentElement.getAttribute('data-theme')}`);
    updatePills();
  });

  updatePills();
}

init().catch(err => {
  console.error(err);
  els.status.textContent = `Fatal: ${String(err)}`;
});