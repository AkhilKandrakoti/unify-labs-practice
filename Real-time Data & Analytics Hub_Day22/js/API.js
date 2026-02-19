const BASE = "https://api.coingecko.com/api/v3";

export async function fetchMarketCoins({ perPage = 30, page = 1, currency = "usd", signal } = {}) {
  const url = new URL(`${BASE}/coins/markets`);
  url.searchParams.set("vs_currency", currency);
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");

  const res = await fetch(url.toString(), { method: "GET", signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API Error (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected response format.");
  return data;
}

export default { fetchMarketCoins };