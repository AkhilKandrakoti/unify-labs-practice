/* Cloud Asset Explorer — Pagination + Index Advisor simulation (frontend-only)
   Teaches:
   - Pagination (page, pageSize, pageCount)
   - "Index thinking" (compound indexes, text index, sort coverage)
   - MongoDB Atlas ready query shapes (filter + sort + limit/skip)
*/

(() => {
  "use strict";

  // ---------- Utilities ----------
  const $ = (sel, root = document) => root.querySelector(sel);

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function debounce(fn, wait = 250) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function fmtMoney(n) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function makeId() {
    return Math.random().toString(16).slice(2, 10).toUpperCase();
  }

  // ---------- Demo Dataset Generator ----------
  const REGIONS = ["ap-south-1", "ap-southeast-1", "us-east-1", "eu-west-1"];
  const TYPES = ["EC2", "RDS", "S3", "Lambda", "Redis", "OpenSearch"];
  const STATUSES = ["running", "stopped", "degraded"];
  const TEAMS = ["Payments", "Growth", "Core", "Analytics", "Security", "Platform"];
  const TAGS = ["pci", "prod", "staging", "ml", "edge", "backup", "priority", "latency", "costwatch", "gdpr"];

  function seedAssets(count = 137) {
    const assets = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const region = pick(REGIONS);
      const type = pick(TYPES);
      const status = pick(STATUSES);
      const team = pick(TEAMS);

      const name = `${type.toLowerCase()}-${region}-${team.toLowerCase()}-${String(i + 1).padStart(3, "0")}`;
      const cost = Math.round(30 + Math.random() * 2400);
      const updated = new Date(now - Math.random() * 1000 * 60 * 60 * 24 * 160).toISOString();

      const tags = Array.from(new Set([
        pick(TAGS),
        pick(TAGS),
        pick(["critical", "standard", "low"]),
        pick(["api", "worker", "db", "storage", "search"])
      ]));

      assets.push({
        _id: makeId(),
        name,
        type,
        region,
        status,
        team,
        tags,
        monthlyCost: cost,
        lastUpdated: updated
      });
    }
    return assets;
  }

  // ---------- State ----------
  const state = {
    assets: seedAssets(),
    q: "",
    region: "all",
    status: "all",
    sort: "updated_desc",
    page: 1,
    pageSize: 9
  };

  // ---------- Elements ----------
  const els = {
    list: $("#list"),
    resultPill: $("#resultPill"),
    shownCount: $("#shownCount"),
    totalCount: $("#totalCount"),
    pageCount: $("#pageCount"),

    q: $("#q"),
    region: $("#region"),
    status: $("#status"),
    sort: $("#sort"),
    pageSize: $("#pageSize"),

    prev: $("#prev"),
    next: $("#next"),
    pager: $("#pager"),

    btnReset: $("#btnReset"),
    btnSeed: $("#btnSeed"),

    queryShape: $("#queryShape"),
    indexChips: $("#indexChips"),
    scanCount: $("#scanCount"),
    meterFill: $("#meterFill"),
    coverageText: $("#coverageText"),
    perfPill: $("#perfPill")
  };

  // ---------- Filtering / Sorting ----------
  function applyQuery(raw) {
    const q = raw.trim().toLowerCase();

    let out = state.assets.slice();

    // Filter region/status
    if (state.region !== "all") out = out.filter(a => a.region === state.region);
    if (state.status !== "all") out = out.filter(a => a.status === state.status);

    // Search simulation:
    // - In real MongoDB: text index on name/team/tags, or Atlas Search
    // - Here: simple contains check
    if (q) {
      out = out.filter(a => {
        const hay = `${a.name} ${a.team} ${a.type} ${a.region} ${a.status} ${a.tags.join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Sort
    out.sort((a, b) => {
      switch (state.sort) {
        case "updated_desc": return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        case "updated_asc": return new Date(a.lastUpdated) - new Date(b.lastUpdated);
        case "cost_desc": return b.monthlyCost - a.monthlyCost;
        case "cost_asc": return a.monthlyCost - b.monthlyCost;
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        default: return 0;
      }
    });

    return out;
  }

  // ---------- Pagination ----------
  function paginate(items, page, pageSize) {
    const total = items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = clamp(page, 1, pageCount);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return {
      total,
      pageCount,
      page: safePage,
      pageSize,
      slice: items.slice(start, end)
    };
  }

  function buildPager(page, pageCount) {
    // Pro pager: show first, last, neighbors with ellipsis
    const btns = [];
    const push = (p, label = String(p), disabled = false, current = false) => {
      btns.push({ p, label, disabled, current });
    };

    const addEllipsis = () => btns.push({ p: null, label: "…", disabled: true, current: false });

    if (pageCount <= 8) {
      for (let p = 1; p <= pageCount; p++) push(p, String(p), false, p === page);
      return btns;
    }

    push(1, "1", false, page === 1);

    const left = Math.max(2, page - 1);
    const right = Math.min(pageCount - 1, page + 1);

    if (left > 2) addEllipsis();

    for (let p = left; p <= right; p++) push(p, String(p), false, p === page);

    if (right < pageCount - 1) addEllipsis();

    push(pageCount, String(pageCount), false, page === pageCount);

    return btns;
  }

  // ---------- Rendering ----------
  function renderList(items) {
    if (!items.length) {
      els.list.innerHTML = `
        <div class="panel" style="grid-column:1/-1">
          <h3>No results</h3>
          <p class="muted">Try changing region/status or clearing the search.</p>
        </div>
      `;
      return;
    }

    els.list.innerHTML = items.map(a => {
      const badgeClass =
        a.status === "running" ? "badge--running" :
        a.status === "degraded" ? "badge--degraded" : "badge--stopped";

      return `
        <article class="item" role="listitem" tabindex="0" aria-label="${a.name}">
          <div class="item__top">
            <h3 class="item__name">${escapeHtml(a.name)}</h3>
            <span class="badge ${badgeClass}">${a.status}</span>
          </div>

          <div class="meta">
            <div><strong>Type:</strong> ${a.type}</div>
            <div><strong>Region:</strong> ${a.region}</div>
            <div><strong>Team:</strong> ${a.team}</div>
            <div><strong>Cost:</strong> ${fmtMoney(a.monthlyCost)} <span class="muted">/mo</span></div>
            <div><strong>Updated:</strong> ${fmtDate(a.lastUpdated)}</div>
          </div>

          <div class="tags">
            ${a.tags.slice(0, 5).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderPager(page, pageCount) {
    els.pager.innerHTML = "";
    const btns = buildPager(page, pageCount);

    for (const b of btns) {
      const btn = document.createElement("button");
      btn.className = "pagebtn";
      btn.type = "button";
      btn.textContent = b.label;
      btn.disabled = b.disabled;

      if (b.current) btn.setAttribute("aria-current", "page");
      if (b.p == null) {
        btn.setAttribute("aria-hidden", "true");
      } else {
        btn.addEventListener("click", () => {
          state.page = b.p;
          render();
        });
      }

      els.pager.appendChild(btn);
    }

    els.prev.disabled = page <= 1;
    els.next.disabled = page >= pageCount;
  }

  // ---------- Index Advisor (simulated logic) ----------
  function getQueryShape() {
    const filter = {};
    if (state.region !== "all") filter.region = state.region;
    if (state.status !== "all") filter.status = state.status;
    if (state.q.trim()) filter.$text = { $search: state.q.trim() };

    // Sort mapping
    let sort = { lastUpdated: -1 };
    if (state.sort === "updated_asc") sort = { lastUpdated: 1 };
    if (state.sort === "cost_desc") sort = { monthlyCost: -1 };
    if (state.sort === "cost_asc") sort = { monthlyCost: 1 };
    if (state.sort === "name_asc") sort = { name: 1 };
    if (state.sort === "name_desc") sort = { name: -1 };

    // Atlas-ready pagination pattern (skip/limit OR range-based):
    const options = {
      sort,
      limit: state.pageSize,
      skip: (state.page - 1) * state.pageSize
    };

    return { filter, options };
  }

  function recommendIndexes() {
    // Recommend based on filter + sort combination (compound indexes)
    const rec = [];
    const q = state.q.trim();
    const hasText = !!q;
    const hasRegion = state.region !== "all";
    const hasStatus = state.status !== "all";

    // text search
    if (hasText) rec.push(`TEXT(name, team, tags)`);

    // sort field
    let sortField = "lastUpdated";
    if (state.sort.startsWith("cost")) sortField = "monthlyCost";
    if (state.sort.startsWith("name")) sortField = "name";

    // common compound patterns
    if (hasRegion && hasStatus) rec.push(`{ region: 1, status: 1, ${sortField}: ${sortField === "monthlyCost" ? -1 : -1} }`);
    else if (hasRegion) rec.push(`{ region: 1, ${sortField}: -1 }`);
    else if (hasStatus) rec.push(`{ status: 1, ${sortField}: -1 }`);
    else rec.push(`{ ${sortField}: -1 }`);

    // always useful
    rec.push(`{ lastUpdated: -1 }`);

    // optional: multi-key index for tags if filtering by tags in future
    if (!hasText) rec.push(`{ tags: 1 }`);

    return Array.from(new Set(rec));
  }

  function estimateScan(totalResults) {
    // VERY simplified heuristic:
    // - If search text present and we have TEXT index => scan low
    // - If filter+sort align with compound index => scan moderate
    // - If only sorting without index => higher scan
    const hasText = !!state.q.trim();
    const hasRegion = state.region !== "all";
    const hasStatus = state.status !== "all";
    const sort = state.sort;

    let score = 0.85; // baseline (worse)
    if (hasText) score -= 0.45; // text index helps a lot
    if (hasRegion) score -= 0.12;
    if (hasStatus) score -= 0.12;

    if (sort.startsWith("updated")) score -= 0.10;
    if (sort.startsWith("cost")) score -= 0.07;
    if (sort.startsWith("name")) score -= 0.06;

    score = clamp(score, 0.12, 0.95);

    const estimated = Math.max(1, Math.round(totalResults * score));
    const coverage = Math.round((1 - score) * 100);

    return { estimated, coverage, score };
  }

  function renderAdvisor(totalResults) {
    const qs = getQueryShape();
    els.queryShape.textContent = JSON.stringify(qs, null, 2);

    const rec = recommendIndexes();
    els.indexChips.innerHTML = rec.map(r => `<span class="chip">${escapeHtml(r)}</span>`).join("");

    const { estimated, coverage } = estimateScan(totalResults);

    els.scanCount.textContent = estimated.toLocaleString();
    els.coverageText.textContent = `${coverage}% index coverage (simulated)`;

    // meter: higher scan => more "risk"
    const risk = clamp(Math.round((estimated / Math.max(1, totalResults)) * 100), 0, 100);
    els.meterFill.style.width = `${risk}%`;
    $(".meter__bar")?.setAttribute("aria-valuenow", String(risk));

    // pill tone
    if (coverage >= 70) {
      els.perfPill.textContent = "Fast-ish";
      els.perfPill.classList.add("pill--soft");
    } else {
      els.perfPill.textContent = "Needs Index";
      els.perfPill.classList.remove("pill--soft");
    }
  }

  // ---------- Escape ----------
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Main render ----------
  function render() {
    const filtered = applyQuery(state.q);
    const pg = paginate(filtered, state.page, state.pageSize);

    // Keep state page safe
    state.page = pg.page;

    // Header counts
    els.resultPill.textContent = `${pg.total} results`;
    els.shownCount.textContent = pg.slice.length;
    els.totalCount.textContent = pg.total;
    els.pageCount.textContent = `${pg.page}/${pg.pageCount}`;

    renderList(pg.slice);
    renderPager(pg.page, pg.pageCount);
    renderAdvisor(pg.total);
  }

  // ---------- Events ----------
  const onSearch = debounce(() => {
    state.q = els.q.value;
    state.page = 1;
    render();
  }, 260);

  els.q.addEventListener("input", onSearch);

  els.region.addEventListener("change", () => {
    state.region = els.region.value;
    state.page = 1;
    render();
  });

  els.status.addEventListener("change", () => {
    state.status = els.status.value;
    state.page = 1;
    render();
  });

  els.sort.addEventListener("change", () => {
    state.sort = els.sort.value;
    state.page = 1;
    render();
  });

  els.pageSize.addEventListener("change", () => {
    state.pageSize = Number(els.pageSize.value);
    state.page = 1;
    render();
  });

  els.prev.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });

  els.next.addEventListener("click", () => {
    state.page = state.page + 1;
    render();
  });

  els.btnReset.addEventListener("click", () => {
    state.q = "";
    state.region = "all";
    state.status = "all";
    state.sort = "updated_desc";
    state.page = 1;
    state.pageSize = 9;

    els.q.value = "";
    els.region.value = "all";
    els.status.value = "all";
    els.sort.value = "updated_desc";
    els.pageSize.value = "9";

    render();
  });

  els.btnSeed.addEventListener("click", () => {
    state.assets = seedAssets(140 + Math.floor(Math.random() * 60));
    state.page = 1;
    render();
  });

  // Keyboard shortcuts:
  // Ctrl/⌘ + K focus search, arrows for pagination
  window.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      els.q.focus();
      els.q.select();
      return;
    }

    if (e.key === "ArrowLeft") {
      if (!els.prev.disabled) els.prev.click();
    }
    if (e.key === "ArrowRight") {
      if (!els.next.disabled) els.next.click();
    }
  });

  // ---------- Boot ----------
  render();
})();