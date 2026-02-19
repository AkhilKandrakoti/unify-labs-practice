import { fetchMarketCoins } from "./API.js";
import { KEYS, safeGet, safeSet, getJSON, setJSON } from "./Storage.js";
import { debounce, compareCoins, nowISO } from "./Utils.js";
import {
  showToast,
  setTheme,
  setNetworkBadge,
  setLastUpdated,
  updateMeta,
  renderSkeleton,
  renderCoins,
  renderWatchlist,
  renderAnalytics,
} from "./UI.js";

/**
 * Central State Object (Requirement: Step 1)
 */
const State = {
  coins: [],
  view: [],
  favorites: new Set(),
  search: "",
  sort: "marketCap_desc",
  theme: "dark",
  perPage: 30,
  autoRefresh: false,
  isLoading: false,

  // advanced async control
  controller: null,
  autoTimer: null,
};

const els = {
  list: document.getElementById("list"),
  favorites: document.getElementById("favorites"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  refreshBtn: document.getElementById("refreshBtn"),
  openSettings: document.getElementById("openSettings"),
  settingsDialog: document.getElementById("settingsDialog"),
  themeToggle: document.getElementById("themeToggle"),
  autoRefresh: document.getElementById("autoRefresh"),
  perPage: document.getElementById("perPage"),
};

/* ---------------------------
   Persistence (Requirement: Step 4)
---------------------------- */
function hydrateFromStorage() {
  const theme = safeGet(KEYS.THEME, "dark");
  if (theme === "light" || theme === "dark") State.theme = theme;

  const sort = safeGet(KEYS.SORT, "marketCap_desc");
  State.sort = sort;

  const perPage = Number(safeGet(KEYS.PER_PAGE, "30"));
  State.perPage = Number.isFinite(perPage) ? perPage : 30;

  const auto = safeGet(KEYS.AUTO_REFRESH, "false") === "true";
  State.autoRefresh = auto;

  const fav = getJSON(KEYS.FAVORITES, []);
  State.favorites = new Set(Array.isArray(fav) ? fav : []);

  // warm-start with cached coins for instant UI (advanced UX)
  const cache = getJSON(KEYS.CACHE, null);
  const cacheTs = safeGet(KEYS.CACHE_TS, null);
  if (Array.isArray(cache) && cache.length) {
    State.coins = cache;
    computeView();
    renderAll();
    setLastUpdated(cacheTs ? new Date(cacheTs).toLocaleString() : "Cached");
  }
}

function persistAll() {
  safeSet(KEYS.THEME, State.theme);
  safeSet(KEYS.SORT, State.sort);
  safeSet(KEYS.PER_PAGE, String(State.perPage));
  safeSet(KEYS.AUTO_REFRESH, String(State.autoRefresh));
  setJSON(KEYS.FAVORITES, [...State.favorites]);
}

function cacheCoins(coins) {
  setJSON(KEYS.CACHE, coins);
  safeSet(KEYS.CACHE_TS, nowISO());
}

/* ---------------------------
   Data Fetch (Requirement: Step 2)
   - Try/Catch
   - AbortController
   - Skeleton loading
---------------------------- */
async function loadData({ silent = false } = {}) {
  // Cancel any in-flight request
  if (State.controller) State.controller.abort();
  State.controller = new AbortController();

  State.isLoading = true;
  if (!silent) renderSkeleton(els.list, 9);

  try {
    const data = await fetchMarketCoins({
      perPage: Math.max(20, State.perPage),
      page: 1,
      currency: "usd",
      signal: State.controller.signal,
    });

    State.coins = data;
    State.isLoading = false;

    cacheCoins(data);
    computeView();
    renderAll();

    setLastUpdated(new Date().toLocaleString());
    if (!silent) showToast("Live data fetched successfully.", "Fetch Complete");
  } catch (err) {
    State.isLoading = false;

    // Abort is not a real "error" from user perspective
    if (err?.name === "AbortError") return;

    // Requirement: handle network failures gracefully with UI notification
    showToast(
      "Unable to fetch live data right now. Showing last known data (if available).",
      "Network Error"
    );

    // keep cached/previous State.coins if present
    computeView();
    renderAll();
    console.error(err);
  }
}

/* ---------------------------
   Smart UI (Requirement: Step 3)
   - filter() for search
   - sort() for sorting
---------------------------- */
function computeView() {
  const q = State.search.trim().toLowerCase();

  // .filter() requirement
  const filtered = State.coins.filter((c) => {
    if (!q) return true;
    return (
      String(c.name).toLowerCase().includes(q) ||
      String(c.symbol).toLowerCase().includes(q)
    );
  });

  // .sort() requirement
  State.view = filtered.slice().sort((a, b) => compareCoins(a, b, State.sort));
}

/* ---------------------------
   Derived selectors
---------------------------- */
function getFavoriteCoins() {
  // map + filter (functional programming)
  return [...State.favorites]
    .map((id) => State.coins.find((c) => c.id === id))
    .filter(Boolean);
}

/* ---------------------------
   Rendering
---------------------------- */
function renderAll() {
  renderCoins(els.list, State.view, State.favorites);
  renderWatchlist(els.favorites, getFavoriteCoins());
  renderAnalytics({ coins: State.coins });

  updateMeta({ totalCount: State.view.length, favCount: State.favorites.size });
  setTheme(State.theme);

  if (els.sortSelect) els.sortSelect.value = State.sort;
  if (els.autoRefresh) els.autoRefresh.checked = State.autoRefresh;
  if (els.perPage) els.perPage.value = String(State.perPage);
}

/* ---------------------------
   Events (Event delegation + accessibility)
---------------------------- */
function onListClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const card = e.target.closest("[data-id]");
  if (!card) return;

  const id = card.dataset.id;
  const action = btn.dataset.action;

  if (action === "toggle-fav") {
    if (State.favorites.has(id)) {
      State.favorites.delete(id);
      showToast("Removed from watchlist.", "Watchlist");
    } else {
      State.favorites.add(id);
      showToast("Saved to watchlist.", "Watchlist");
    }
    persistAll();
    renderAll();
  }
}

function onWatchlistClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const row = e.target.closest("[data-id]");
  if (!row) return;

  const id = row.dataset.id;
  if (btn.dataset.action === "remove-fav") {
    State.favorites.delete(id);
    persistAll();
    renderAll();
    showToast("Removed from watchlist.", "Watchlist");
  }
}

const onSearchInput = debounce((value) => {
  State.search = value;
  computeView();
  renderAll();
}, 120);

function onSortChange(value) {
  State.sort = value;
  persistAll();
  computeView();
  renderAll();
}

function toggleTheme() {
  State.theme = State.theme === "dark" ? "light" : "dark";
  persistAll();
  setTheme(State.theme);
  showToast(`Theme set to ${State.theme}.`, "Preference Saved");
}

function openSettings() {
  els.settingsDialog?.showModal();
}

function setAutoRefresh(on) {
  State.autoRefresh = on;
  persistAll();
  armAutoRefresh();
  showToast(on ? "Auto refresh enabled (60s)." : "Auto refresh disabled.", "Settings");
}

function setPerPage(n) {
  State.perPage = n;
  persistAll();
  showToast(`Fetch size set to ${n}.`, "Settings");
  loadData();
}

/* ---------------------------
   Auto refresh (advanced extra, still compliant)
---------------------------- */
function armAutoRefresh() {
  if (State.autoTimer) clearInterval(State.autoTimer);
  State.autoTimer = null;

  if (!State.autoRefresh) return;

  State.autoTimer = setInterval(() => {
    loadData({ silent: true });
  }, 60_000);
}

/* ---------------------------
   Online/offline UX
---------------------------- */
function wireNetwork() {
  const update = () => {
    const online = navigator.onLine;
    setNetworkBadge(online);
    if (!online) showToast("You are offline. Live fetch will fail.", "Offline Mode");
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

/* ---------------------------
   Bind + Init
---------------------------- */
function bindEvents() {
  els.list?.addEventListener("click", onListClick);
  els.favorites?.addEventListener("click", onWatchlistClick);

  els.searchInput?.addEventListener("input", (e) => onSearchInput(e.target.value));
  els.sortSelect?.addEventListener("change", (e) => onSortChange(e.target.value));

  els.refreshBtn?.addEventListener("click", () => loadData());
  els.openSettings?.addEventListener("click", openSettings);
  els.themeToggle?.addEventListener("click", toggleTheme);

  els.autoRefresh?.addEventListener("change", (e) => setAutoRefresh(e.target.checked));
  els.perPage?.addEventListener("change", (e) => setPerPage(Number(e.target.value)));

  // close dialog on ESC handled by browser; keep UX consistent
}

function init() {
  hydrateFromStorage();
  bindEvents();
  wireNetwork();
  armAutoRefresh();

  // Always fetch fresh on load (Requirement: Step 2)
  loadData();
}

init();