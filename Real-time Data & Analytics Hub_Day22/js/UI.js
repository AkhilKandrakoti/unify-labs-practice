import { escapeHtml, formatCurrency, formatNumber } from "./Utils.js";

export function showToast(message, title = "Notification") {
  const host = document.getElementById("toastHost");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  host.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "all 240ms ease";
    setTimeout(() => el.remove(), 260);
  }, 3200);
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function setNetworkBadge(isOnline) {
  const badge = document.getElementById("netBadge");
  if (!badge) return;
  badge.textContent = isOnline ? "Online" : "Offline";
}

export function setLastUpdated(text) {
  const el = document.getElementById("lastUpdated");
  if (el) el.textContent = `Last updated: ${text}`;
}

export function updateMeta({ totalCount, favCount }) {
  const countPill = document.getElementById("countPill");
  const favPill = document.getElementById("favPill");
  if (countPill) countPill.textContent = `${totalCount} items`;
  if (favPill) favPill.textContent = `${favCount} watchlist`;
}

export function renderSkeleton(targetEl, count = 9) {
  targetEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "skeleton";
    frag.appendChild(s);
  }
  targetEl.appendChild(frag);
}

/**
 * High-performance list render:
 * - documentFragment batching
 * - minimal layout thrash
 * - event delegation used in App.js
 */
export function renderCoins(targetEl, coins, favoritesSet) {
  targetEl.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const c of coins) {
    const change = Number(c.price_change_percentage_24h ?? 0);
    const isFav = favoritesSet.has(c.id);

    const card = document.createElement("article");
    card.className = "coin-card";
    card.dataset.id = c.id;

    card.innerHTML = `
      <div class="coin-top">
        <div class="coin-id">
          <img src="${c.image}" alt="${escapeHtml(c.name)} logo" loading="lazy" />
          <div style="min-width:0">
            <h3 title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</h3>
            <p>${escapeHtml(c.symbol)} • Rank #${escapeHtml(String(c.market_cap_rank ?? "—"))}</p>
          </div>
        </div>

        <div class="price">
          <div class="v">${formatCurrency(c.current_price, "USD")}</div>
          <div class="s">${formatNumber(c.total_volume)} vol</div>
        </div>
      </div>

      <div class="kv">
        <span>Market Cap</span>
        <span>${formatNumber(c.market_cap)}</span>
      </div>

      <div class="kv">
        <span>24h Change</span>
        <span class="pct ${change >= 0 ? "pct--up" : "pct--down"}">
          ${change >= 0 ? "▲" : "▼"} ${formatNumber(change)}%
        </span>
      </div>

      <div class="card-actions">
        <button class="icon-btn icon-btn--save" data-action="toggle-fav" type="button">
          ${isFav ? "★ Saved" : "☆ Save"}
        </button>

        <a class="icon-btn" href="https://www.coingecko.com/en/coins/${encodeURIComponent(c.id)}"
           target="_blank" rel="noreferrer">
          Details ↗
        </a>
      </div>
    `;

    frag.appendChild(card);
  }

  targetEl.appendChild(frag);
}

export function renderWatchlist(targetEl, favoritesCoins) {
  if (!favoritesCoins.length) {
    targetEl.innerHTML = `<div class="pill">No items saved. Click “Save” on any coin.</div>`;
    return;
  }

  targetEl.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const c of favoritesCoins) {
    const row = document.createElement("div");
    row.className = "watch";
    row.dataset.id = c.id;

    row.innerHTML = `
      <div class="watch__left">
        <img src="${c.image}" alt="${escapeHtml(c.name)} logo" loading="lazy" />
        <div class="watch__meta">
          <strong title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</strong>
          <span>${escapeHtml(c.symbol)}</span>
        </div>
      </div>
      <button class="icon-btn icon-btn--danger" data-action="remove-fav" type="button">Remove</button>
    `;

    frag.appendChild(row);
  }

  targetEl.appendChild(frag);
}

export function renderAnalytics({ coins }) {
  const mcapTotalEl = document.getElementById("mcapTotal");
  const avgChangeEl = document.getElementById("avgChange");
  const topGainerEl = document.getElementById("topGainer");

  // reduce() total market cap
  const totalMcap = coins.reduce((acc, c) => acc + Number(c.market_cap ?? 0), 0);

  // map() + filter() + reduce() average change
  const changes = coins
    .map((c) => Number(c.price_change_percentage_24h ?? NaN))
    .filter((x) => Number.isFinite(x));

  const avgChange = changes.length
    ? changes.reduce((a, b) => a + b, 0) / changes.length
    : 0;

  // find top gainer via reduce
  const top = coins.reduce((best, c) => {
    const v = Number(c.price_change_percentage_24h ?? -Infinity);
    if (!best) return c;
    return v > Number(best.price_change_percentage_24h ?? -Infinity) ? c : best;
  }, null);

  if (mcapTotalEl) mcapTotalEl.textContent = formatCurrency(totalMcap, "USD");
  if (avgChangeEl) avgChangeEl.textContent = `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`;
  if (topGainerEl) topGainerEl.textContent = top ? `${top.name} (${Number(top.price_change_percentage_24h ?? 0).toFixed(2)}%)` : "—";

  drawSpark(coins);
}

function drawSpark(coins) {
  const canvas = document.getElementById("sparkCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Top 10 by market cap
  const top10 = coins
    .slice()
    .sort((a, b) => Number(b.market_cap ?? 0) - Number(a.market_cap ?? 0))
    .slice(0, 10)
    .map((c) => Number(c.market_cap ?? 0));

  if (!top10.length) return;

  const max = Math.max(...top10);
  const min = Math.min(...top10);

  const pad = 16;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;

  // background grid
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + (usableH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // line
  ctx.strokeStyle = "rgba(110,168,255,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();

  top10.forEach((v, i) => {
    const x = pad + (usableW / (top10.length - 1)) * i;
    const t = (v - min) / Math.max(1, (max - min));
    const y = pad + (1 - t) * usableH;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = "rgba(49,208,170,0.95)";
  top10.forEach((v, i) => {
    const x = pad + (usableW / (top10.length - 1)) * i;
    const t = (v - min) / Math.max(1, (max - min));
    const y = pad + (1 - t) * usableH;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

export default {
  showToast,
  setTheme,
  setNetworkBadge,
  setLastUpdated,
  updateMeta,
  renderSkeleton,
  renderCoins,
  renderWatchlist,
  renderAnalytics,
};