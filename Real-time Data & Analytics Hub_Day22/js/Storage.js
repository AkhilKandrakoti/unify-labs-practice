const NS = "nexuspro:";

export const KEYS = {
  THEME: `${NS}theme`,
  FAVORITES: `${NS}favorites`,
  SORT: `${NS}sort`,
  PER_PAGE: `${NS}perPage`,
  AUTO_REFRESH: `${NS}autoRefresh`,
  CACHE: `${NS}cache:coins`,
  CACHE_TS: `${NS}cache:coins:ts`,
};

export function safeGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getJSON(key, fallback = null) {
  try {
    const raw = safeGet(key, null);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, obj) {
  return safeSet(key, JSON.stringify(obj));
}