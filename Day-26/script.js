/**
 * Neighborhood Help Hub — SINGLE JS FILE (server + API)
 * Topics covered:
 * 1) MongoDB Drivers & App Connection: MongoClient + reuse connection
 * 2) Connecting to MongoDB: connect() with URI (env)
 * 3) Cursors & Fetching Data: find() cursor + sort + limit + cursor pagination
 * 4) Finding Single Documents: findOne({_id})
 *
 * Files required in same folder:
 *  - index.html
 *  - styles.css
 *  - app.js   (this file)
 */

import http from "http";
import fs from "fs/promises";
import path from "path";
import url from "url";
import { MongoClient, ObjectId } from "mongodb";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5173);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "neighborhood_hub";
const COLLECTION = "services";

const client = new MongoClient(MONGODB_URI, { maxPoolSize: 10 });

async function col() {
  // MongoDB Drivers & App Connection (reuse one client across requests)
  if (!client.topology?.isConnected?.()) await client.connect();
  return client.db(DB_NAME).collection(COLLECTION);
}

const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsed.pathname;

    // --- API ROUTES ---
    if (pathname === "/api/health" && req.method === "GET") {
      try {
        const c = await col();
        await c.findOne({}, { projection: { _id: 1 } });
        return json(res, 200, { ok: true });
      } catch {
        return json(res, 500, { ok: false });
      }
    }

    if (pathname === "/api/services" && req.method === "GET") {
      const q = String(parsed.searchParams.get("q") || "").trim();
      const category = String(parsed.searchParams.get("category") || "").trim();
      const minRatingRaw = parsed.searchParams.get("minRating");
      const minRating = minRatingRaw ? Number(minRatingRaw) : null;
      const sort = String(parsed.searchParams.get("sort") || "relevance");
      const limit = clamp(Number(parsed.searchParams.get("limit") || 12), 1, 30);
      const cursor = String(parsed.searchParams.get("cursor") || "").trim(); // _id string

      // Filters
      const filter = {};
      if (category) filter.category = category;
      if (Number.isFinite(minRating)) filter.rating = { $gte: minRating };

      // Cursor-based pagination (descending by _id)
      if (cursor) filter._id = { $lt: new ObjectId(cursor) };

      // Sorting
      // If you create a text index, we can do $text search; otherwise regex fallback.
      const hasTextSearch = q.length > 0;

      const sortSpec =
        sort === "rating_desc" ? { rating: -1, _id: -1 } :
        sort === "price_asc" ? { startingPrice: 1, _id: -1 } :
        sort === "recent" ? { _id: -1 } :
        { _id: -1 };

      const c = await col();

      // Cursor & Fetching Data
      // We'll attempt $text (needs index), else regex fallback.
      let finalFilter = { ...filter };
      let project = { name: 1, category: 1, rating: 1, startingPrice: 1, city: 1, createdAt: 1 };

      try {
        if (hasTextSearch) {
          finalFilter.$text = { $search: q };
          project = { ...project, score: { $meta: "textScore" } };
        }

        const countFilter = hasTextSearch ? finalFilter : finalFilter;
        const total = await c.countDocuments(countFilter);

        let cursorQ = c.find(finalFilter).project(project);

        // When text search is used, sorting by textScore is helpful
        if (hasTextSearch && sort === "relevance") {
          cursorQ = cursorQ.sort({ score: { $meta: "textScore" }, _id: -1 });
        } else {
          cursorQ = cursorQ.sort(sortSpec);
        }

        const docs = await cursorQ.limit(limit + 1).toArray(); // cursor -> array
        const hasMore = docs.length > limit;
        const items = hasMore ? docs.slice(0, limit) : docs;
        const nextCursor = hasMore ? String(items[items.length - 1]._id) : null;

        return json(res, 200, {
          items: items.map(d => ({ ...d, _id: String(d._id) })),
          nextCursor,
          hasMore,
          total,
        });
      } catch {
        // Regex fallback if $text index doesn't exist
        if (hasTextSearch) {
          finalFilter = {
            ...filter,
            $or: [
              { name: { $regex: q, $options: "i" } },
              { city: { $regex: q, $options: "i" } },
              { tags: { $regex: q, $options: "i" } },
              { about: { $regex: q, $options: "i" } },
            ],
          };
          if (cursor) finalFilter._id = { $lt: new ObjectId(cursor) };

          const total = await c.countDocuments(finalFilter);
          const docs = await c.find(finalFilter)
            .project(project)
            .sort(sortSpec._id ? { _id: -1 } : sortSpec)
            .limit(limit + 1)
            .toArray();

          const hasMore = docs.length > limit;
          const items = hasMore ? docs.slice(0, limit) : docs;
          const nextCursor = hasMore ? String(items[items.length - 1]._id) : null;

          return json(res, 200, {
            items: items.map(d => ({ ...d, _id: String(d._id) })),
            nextCursor,
            hasMore,
            total,
          });
        }
        return json(res, 500, { error: "Failed to fetch services" });
      }
    }

    // Finding single document (findOne)
    if (pathname.startsWith("/api/services/") && req.method === "GET") {
      const id = pathname.split("/").pop();
      try {
        const c = await col();
        const doc = await c.findOne({ _id: new ObjectId(id) });
        if (!doc) return json(res, 404, { error: "Not found" });
        doc._id = String(doc._id);
        return json(res, 200, doc);
      } catch {
        return json(res, 400, { error: "Invalid id" });
      }
    }

    // --- STATIC FILES ---
    if (pathname === "/" || pathname === "/index.html") {
      return file(res, 200, path.join(__dirname, "index.html"), "text/html; charset=utf-8");
    }
    if (pathname === "/styles.css") {
      return file(res, 200, path.join(__dirname, "styles.css"), "text/css; charset=utf-8");
    }
    if (pathname === "/app.js") {
      // IMPORTANT: app.js is server code, but browser also requests /app.js.
      // We'll serve a small client bundle from inside this same file:
      return jsClient(res);
    }

    return json(res, 404, { error: "Not found" });
  } catch (e) {
    return json(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Running: http://localhost:${PORT}`);
  console.log(`✅ MongoDB: ${MONGODB_URI}  DB: ${DB_NAME}`);
});

/* -------------------- Helpers -------------------- */

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function file(res, status, filepath, contentType) {
  const data = await fs.readFile(filepath);
  res.writeHead(status, { "Content-Type": contentType });
  res.end(data);
}

/**
 * Serve CLIENT JS (browser code) from the SAME file.
 * This keeps your project "one js file" while still having a real frontend script.
 */
function jsClient(res) {
  res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
  res.end(CLIENT_JS);
}

const CLIENT_JS = `
const state = { items: [], nextCursor: null, hasMore: false, loading: false, lastKey: "" };

const el = {
  grid: document.getElementById("grid"),
  metaText: document.getElementById("metaText"),
  statTotal: document.getElementById("statTotal"),
  statApi: document.getElementById("statApi"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  filters: document.getElementById("filters"),
  q: document.getElementById("q"),
  category: document.getElementById("category"),
  minRating: document.getElementById("minRating"),
  sort: document.getElementById("sort"),
  limit: document.getElementById("limit"),
  resetBtn: document.getElementById("resetBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  themeBtn: document.getElementById("themeBtn"),

  modal: document.getElementById("detailsModal"),
  dName: document.getElementById("dName"),
  dMeta: document.getElementById("dMeta"),
  dCategory: document.getElementById("dCategory"),
  dRating: document.getElementById("dRating"),
  dPrice: document.getElementById("dPrice"),
  dCity: document.getElementById("dCity"),
  dAbout: document.getElementById("dAbout"),
  dTags: document.getElementById("dTags"),
  dContact: document.getElementById("dContact"),
  dMap: document.getElementById("dMap"),
};

init();

function init(){
  initTheme();
  wire();
  ping();
  search({ reset:true });
}

function initTheme(){
  const saved = localStorage.getItem("nh_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  el.themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("nh_theme", next);
  });
}

function wire(){
  el.filters.addEventListener("submit", (e)=>{ e.preventDefault(); search({reset:true}); });
  el.resetBtn.addEventListener("click", ()=>{
    el.q.value=""; el.category.value=""; el.minRating.value=""; el.sort.value="relevance"; el.limit.value="12";
    search({reset:true});
  });
  el.refreshBtn.addEventListener("click", ()=> search({reset:true}));
  el.loadMoreBtn.addEventListener("click", ()=> search({reset:false}));

  const debounced = debounce(()=>search({reset:true}), 450);
  el.q.addEventListener("input", debounced);
}

async function ping(){
  try{
    const r = await fetch("/api/health", { cache:"no-store" });
    const d = await r.json();
    el.statApi.textContent = d.ok ? "Online" : "Unknown";
  }catch{
    el.statApi.textContent = "Offline";
  }
}

function key(){
  const p = params("");
  p.delete("cursor");
  return p.toString();
}

function params(cursor){
  const p = new URLSearchParams();
  const q = el.q.value.trim();
  const c = el.category.value.trim();
  const m = el.minRating.value.trim();
  const s = el.sort.value;
  const l = el.limit.value;

  if(q) p.set("q", q);
  if(c) p.set("category", c);
  if(m) p.set("minRating", m);
  if(s) p.set("sort", s);
  if(l) p.set("limit", l);
  if(cursor) p.set("cursor", cursor);
  return p;
}

async function search({reset}){
  if(state.loading) return;
  const k = key();

  if(reset){
    state.items = [];
    state.nextCursor = null;
    state.hasMore = false;
    state.lastKey = k;
    el.loadMoreBtn.disabled = true;
    renderSkeleton();
  } else {
    if(state.lastKey !== k) return search({reset:true});
    if(!state.hasMore || !state.nextCursor) return;
    el.loadMoreBtn.disabled = true;
  }

  state.loading = true;
  el.metaText.textContent = reset ? "Fetching results..." : "Fetching next page...";

  try{
    const p = params(reset ? "" : state.nextCursor);
    const r = await fetch("/api/services?" + p.toString(), { cache:"no-store" });
    if(!r.ok) throw new Error("fail");
    const d = await r.json();

    const incoming = Array.isArray(d.items) ? d.items : [];
    state.items = reset ? incoming : state.items.concat(incoming);

    state.nextCursor = d.nextCursor || null;
    state.hasMore = !!d.hasMore;

    render();
    if(typeof d.total === "number") el.statTotal.textContent = String(d.total);
    el.metaText.textContent = "Showing " + state.items.length + (typeof d.total === "number" ? (" of " + d.total) : "") + " results.";
    el.loadMoreBtn.disabled = !state.hasMore;
  }catch{
    el.grid.innerHTML = \`
      <div class="card-item" style="grid-column:1/-1">
        <div class="item-name">Server not reachable</div>
        <p class="muted">Run app.js with Node and ensure MongoDB is running.</p>
        <div class="actions-row">
          <button class="btn btn-primary" id="retryBtn" type="button">Retry</button>
        </div>
      </div>\`;
    document.getElementById("retryBtn").addEventListener("click", ()=>search({reset:true}));
    el.metaText.textContent = "Failed to fetch results.";
  } finally {
    state.loading = false;
  }
}

function renderSkeleton(){
  el.grid.innerHTML = "";
  for(let i=0;i<6;i++){
    const d = document.createElement("div");
    d.className="card-item";
    d.innerHTML = \`
      <div class="badge">Loading</div>
      <div class="item-name">Loading...</div>
      <div class="meta">
        <span class="pill">...</span>
        <span class="pill">...</span>
        <span class="pill">...</span>
      </div>\`;
    el.grid.appendChild(d);
  }
}

function render(){
  el.grid.innerHTML = "";
  if(!state.items.length){
    el.grid.innerHTML = \`
      <div class="card-item" style="grid-column:1/-1">
        <div class="item-name">No results</div>
        <p class="muted">Try different keywords or remove filters.</p>
      </div>\`;
    return;
  }

  for(const it of state.items){
    const card = document.createElement("article");
    card.className="card-item";
    card.innerHTML = \`
      <div class="badge">\${esc(it.category || "Service")}</div>
      <div class="item-name">\${esc(it.name || "Untitled")}</div>
      <div class="meta">
        <span class="pill">⭐ \${fmtRating(it.rating)}</span>
        <span class="pill">From \${fmtINR(it.startingPrice)}</span>
        <span class="pill">\${esc(it.city || "—")}</span>
      </div>
      <div class="actions-row">
        <button class="btn btn-ghost" type="button" data-id="\${esc(it._id)}">View profile</button>
      </div>\`;
    card.querySelector("button").addEventListener("click", ()=>openDetails(it._id));
    el.grid.appendChild(card);
  }
}

async function openDetails(id){
  try{
    el.dName.textContent="Loading...";
    el.dMeta.textContent="Fetching profile...";
    el.modal.showModal();

    const r = await fetch("/api/services/" + encodeURIComponent(id), { cache:"no-store" });
    if(!r.ok) throw new Error("fail");
    const d = await r.json();

    el.dName.textContent = d.name || "Service";
    el.dMeta.textContent = (d.city || "—") + " • " + (d.category || "Service");
    el.dCategory.textContent = d.category || "—";
    el.dRating.textContent = fmtRating(d.rating);
    el.dPrice.textContent = fmtINR(d.startingPrice);
    el.dCity.textContent = d.city || "—";
    el.dAbout.textContent = d.about || "No description provided.";
    el.dContact.textContent = d.contact || "Contact info not available.";

    el.dTags.innerHTML = "";
    const tags = Array.isArray(d.tags) ? d.tags : [];
    (tags.length ? tags : ["No tags"]).slice(0,12).forEach(t=>{
      const s = document.createElement("span");
      s.className="chip";
      s.textContent = String(t);
      el.dTags.appendChild(s);
    });

    const mapQuery = encodeURIComponent(((d.name||"") + " " + (d.city||"")).trim());
    el.dMap.href = mapQuery ? ("https://www.google.com/maps/search/?api=1&query=" + mapQuery) : "#";
    el.dMap.style.pointerEvents = mapQuery ? "auto" : "none";
    el.dMap.style.opacity = mapQuery ? "1" : ".6";
  }catch{
    el.dName.textContent="Could not load profile";
    el.dMeta.textContent="Backend not running or invalid id.";
  }
}

function debounce(fn, ms){
  let t=null;
  return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); };
}
function fmtINR(v){
  const n=Number(v);
  if(!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
}
function fmtRating(v){
  const n=Number(v);
  if(!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}
function esc(x){
  return String(x).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
`;

process.on("SIGINT", async () => {
  try { await client.close(); } catch {}
  process.exit(0);
});