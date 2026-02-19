export const nowISO = () => new Date().toISOString();

export function debounce(fn, wait = 120) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatCurrency(num, currency = "USD") {
  const n = Number(num);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: n >= 1 ? 2 : 8,
  }).format(n);
}

export function formatNumber(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export function compareCoins(a, b, mode) {
  const changeA = Number(a.price_change_percentage_24h ?? 0);
  const changeB = Number(b.price_change_percentage_24h ?? 0);

  switch (mode) {
    case "marketCap_desc": return Number(b.market_cap ?? 0) - Number(a.market_cap ?? 0);
    case "marketCap_asc":  return Number(a.market_cap ?? 0) - Number(b.market_cap ?? 0);
    case "price_desc":     return Number(b.current_price ?? 0) - Number(a.current_price ?? 0);
    case "price_asc":      return Number(a.current_price ?? 0) - Number(b.current_price ?? 0);
    case "change_desc":    return changeB - changeA;
    case "change_asc":     return changeA - changeB;
    case "name_asc":       return String(a.name).localeCompare(String(b.name));
    case "name_desc":      return String(b.name).localeCompare(String(a.name));
    default:               return 0;
  }
}