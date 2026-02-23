/**
 * Neighborhood Help Hub — REST API Integration
 * Covers:
 *  - POST  /posts
 *  - PATCH /posts/:id
 *  - DELETE /posts/:id
 *  - GET   /posts (for listing)
 *
 * Mock API used: JSONPlaceholder (public)
 */

const API_BASE = "https://jsonplaceholder.typicode.com";
const $ = (sel) => document.querySelector(sel);

const els = {
  apiBase: $("#apiBase"),
  createForm: $("#createForm"),
  title: $("#title"),
  body: $("#body"),
  userId: $("#userId"),
  manageId: $("#manageId"),
  patchTitle: $("#patchTitle"),
  patchBody: $("#patchBody"),
  btnPatch: $("#btnPatch"),
  btnDelete: $("#btnDelete"),
  btnLoad: $("#btnLoad"),
  list: $("#list"),
  search: $("#search"),
  limit: $("#limit"),
  log: $("#log"),
  btnClearLog: $("#btnClearLog"),
  netState: $("#netState"),
};

let cachedPosts = [];

function now() {
  return new Date().toLocaleTimeString();
}

function setNetState(state) {
  els.netState.textContent = state;
}

function logLine(message, obj) {
  const header = `[${now()}] ${message}`;
  if (obj !== undefined) {
    els.log.textContent = `${header}\n${JSON.stringify(obj, null, 2)}\n\n${els.log.textContent}`;
  } else {
    els.log.textContent = `${header}\n\n${els.log.textContent}`;
  }
}

function safeTrim(s) {
  return String(s ?? "").trim();
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const cfg = {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  setNetState(`${cfg.method}…`);
  logLine(`→ ${cfg.method} ${url}`, cfg.body ? cfg.body : undefined);

  const res = await fetch(url, cfg);

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data = null;
  if (isJson) data = await res.json();
  else data = await res.text();

  logLine(`← ${res.status} ${res.statusText} (${cfg.method} ${path})`, data);

  setNetState("idle");

  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ---------- UI Rendering ----------
function renderList(posts) {
  els.list.innerHTML = "";

  if (!posts.length) {
    els.list.innerHTML = `<div class="item"><h4>No results</h4><p>Try another keyword or refresh.</p></div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  posts.forEach((p) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div class="item__top">
        <div>
          <h4>${escapeHtml(p.title || "(no title)")}</h4>
          <div class="meta">
            <span class="tag tag--id">id: ${p.id}</span>
            <span class="tag tag--user">userId: ${p.userId}</span>
          </div>
        </div>
        <button class="btn btn--ghost" data-pick="${p.id}" type="button">
          <span class="dot"></span> Use ID
        </button>
      </div>
      <p>${escapeHtml(p.body || "")}</p>
    `;

    frag.appendChild(div);
  });

  els.list.appendChild(frag);

  // attach pick handlers
  els.list.querySelectorAll("[data-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-pick"));
      els.manageId.value = String(id);
      logLine(`Picked request ID ${id} for PATCH/DELETE.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applySearchAndRender() {
  const q = safeTrim(els.search.value).toLowerCase();
  const limit = Number(els.limit.value);

  const filtered = cachedPosts
    .filter((p) => {
      if (!q) return true;
      const t = String(p.title ?? "").toLowerCase();
      const b = String(p.body ?? "").toLowerCase();
      return t.includes(q) || b.includes(q);
    })
    .slice(0, limit);

  renderList(filtered);
}

// ---------- API Actions ----------
async function loadPosts() {
  try {
    const posts = await request("/posts", { method: "GET" });
    // Keep only a manageable slice (top 50) for UI speed
    cachedPosts = Array.isArray(posts) ? posts.slice(0, 50) : [];
    logLine(`Loaded ${cachedPosts.length} posts into board cache.`);
    applySearchAndRender();
  } catch (e) {
    logLine("ERROR loading posts", { message: e.message, status: e.status, data: e.data });
    alert("Failed to load posts. Check console log.");
  }
}

async function createPost(payload) {
  return request("/posts", { method: "POST", body: payload });
}

async function patchPost(id, patch) {
  return request(`/posts/${id}`, { method: "PATCH", body: patch });
}

async function deletePost(id) {
  return request(`/posts/${id}`, { method: "DELETE" });
}

// ---------- Event Wiring ----------
function init() {
  els.apiBase.textContent = API_BASE;
  setNetState("idle");

  els.createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = safeTrim(els.title.value);
    const body = safeTrim(els.body.value);
    const userId = Number(els.userId.value);

    if (title.length < 3 || body.length < 8 || !Number.isFinite(userId) || userId < 1) {
      alert("Please fill valid title, description, and userId.");
      return;
    }

    try {
      const created = await createPost({ title, body, userId });
      alert(`Created (mock) request! Returned id: ${created.id}`);

      // Add to local cache so UI shows it instantly
      cachedPosts.unshift({
        id: created.id ?? Math.floor(Math.random() * 10000),
        title: created.title ?? title,
        body: created.body ?? body,
        userId: created.userId ?? userId,
      });

      applySearchAndRender();
      els.createForm.reset();
      els.userId.value = "1";
    } catch (e2) {
      logLine("ERROR creating post", { message: e2.message, status: e2.status, data: e2.data });
      alert("Create failed. Check log.");
    }
  });

  els.btnPatch.addEventListener("click", async () => {
    const id = Number(els.manageId.value);
    const newTitle = safeTrim(els.patchTitle.value);
    const newBody = safeTrim(els.patchBody.value);

    if (!Number.isFinite(id) || id < 1) {
      alert("Enter a valid Request ID.");
      return;
    }

    const patch = {};
    if (newTitle) patch.title = newTitle;
    if (newBody) patch.body = newBody;

    if (Object.keys(patch).length === 0) {
      alert("Enter at least one field to PATCH (title or description).");
      return;
    }

    try {
      const updated = await patchPost(id, patch);
      alert(`Patched (mock) request ${id}.`);

      // Update local cache if present
      cachedPosts = cachedPosts.map((p) => (p.id === id ? { ...p, ...patch } : p));
      applySearchAndRender();

      els.patchTitle.value = "";
      els.patchBody.value = "";
      logLine("PATCH applied to UI cache (if ID existed).", updated);
    } catch (e3) {
      logLine("ERROR patching post", { message: e3.message, status: e3.status, data: e3.data });
      alert("PATCH failed. Check log.");
    }
  });

  els.btnDelete.addEventListener("click", async () => {
    const id = Number(els.manageId.value);
    if (!Number.isFinite(id) || id < 1) {
      alert("Enter a valid Request ID.");
      return;
    }

    const ok = confirm(`Delete request ${id}? (Mock API: will respond OK)`);
    if (!ok) return;

    try {
      await deletePost(id);
      alert(`Deleted (mock) request ${id}.`);

      // Remove from local cache
      cachedPosts = cachedPosts.filter((p) => p.id !== id);
      applySearchAndRender();
    } catch (e4) {
      logLine("ERROR deleting post", { message: e4.message, status: e4.status, data: e4.data });
      alert("DELETE failed. Check log.");
    }
  });

  els.btnLoad.addEventListener("click", loadPosts);

  els.search.addEventListener("input", applySearchAndRender);
  els.limit.addEventListener("change", applySearchAndRender);

  els.btnClearLog.addEventListener("click", () => {
    els.log.textContent = "";
    logLine("Console cleared.");
  });

  // initial load
  loadPosts();
}

init();