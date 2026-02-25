/* ==========================================
   ZENITH — Mini Blogging CMS (Vanilla JS)
   Covers:
   Phase 1: Architecture (modules-ish sections)
   Phase 2: DB connectivity (async localStorage DB)
   Phase 3: CRUD API (mock REST service)
   Phase 4: Dynamic UI (render, modal editor, filters)
   Phase 5: Deploy on Vercel (static-ready)
   ========================================== */

(() => {
  "use strict";

  // ------------------------------
  // Utils
  // ------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const escapeHtml = (str) =>
    String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function uid() {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }

  function excerpt(text, n = 120) {
    const t = String(text || "").trim();
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
  }

  // ------------------------------
  // Phase 1: Dual State Architecture
  // uiState: UI controls & modal state
  // serverState: API fetch state
  // dbState: simulated DB connection
  // ------------------------------
  const uiState = {
    q: "",
    statusFilter: "all",
    sort: "newest",
    editorOpen: false,
    editingId: null,
    submitting: false,
  };

  const serverState = {
    status: "idle", // idle | loading | success | error
    posts: [],
    error: null,
  };

  const dbState = {
    connected: false,
    name: "ZenithLocalDB",
  };

  // ------------------------------
  // Phase 2: Database Connectivity (Simulated)
  // localStorage as "DB"
  // ------------------------------
  const DB_KEY = "zenith_posts_v1";
  const DB_SCHEMA = 1;

  const DB = {
    async connect() {
      // simulate handshake
      await sleep(450 + Math.random() * 350);
      dbState.connected = true;
      return { ok: true, db: dbState.name };
    },

    readAll() {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return { schema: DB_SCHEMA, rows: [] };
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.schema !== DB_SCHEMA) return { schema: DB_SCHEMA, rows: [] };
        return parsed;
      } catch {
        return { schema: DB_SCHEMA, rows: [] };
      }
    },

    writeAll(rows) {
      localStorage.setItem(DB_KEY, JSON.stringify({ schema: DB_SCHEMA, rows }));
    },
  };

  // ------------------------------
  // Phase 3: CRUD API (Backend Logic)
  // mock REST endpoints:
  // GET /posts
  // POST /posts
  // PUT /posts/:id
  // DELETE /posts/:id
  // ------------------------------
  const Api = {
    async getPosts({ q, status, sort }) {
      ensureConnected();
      setApiStatus("loading");
      await sleep(220 + Math.random() * 260);

      const { rows } = DB.readAll();
      let list = rows.slice();

      const query = (q || "").trim().toLowerCase();
      if (query) {
        list = list.filter((p) => {
          const hay = `${p.title} ${p.author} ${p.tags.join(" ")} ${p.content}`.toLowerCase();
          return hay.includes(query);
        });
      }

      if (status !== "all") list = list.filter((p) => p.status === status);

      if (sort === "newest") list.sort((a, b) => b.updatedAt - a.updatedAt);
      if (sort === "oldest") list.sort((a, b) => a.updatedAt - b.updatedAt);
      if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));

      setApiStatus("success");
      return list;
    },

    async createPost(input) {
      ensureConnected();
      setApiStatus("loading");
      await sleep(260 + Math.random() * 260);

      const { rows } = DB.readAll();
      const now = Date.now();

      const post = {
        id: uid(),
        title: input.title.trim(),
        author: input.author.trim(),
        tags: normalizeTags(input.tags),
        status: input.status,
        content: input.content.trim(),
        createdAt: now,
        updatedAt: now,
      };

      rows.push(post);
      DB.writeAll(rows);
      setApiStatus("success");
      return post;
    },

    async updatePost(id, input) {
      ensureConnected();
      setApiStatus("loading");
      await sleep(260 + Math.random() * 260);

      const { rows } = DB.readAll();
      const idx = rows.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Post not found.");

      rows[idx] = {
        ...rows[idx],
        title: input.title.trim(),
        author: input.author.trim(),
        tags: normalizeTags(input.tags),
        status: input.status,
        content: input.content.trim(),
        updatedAt: Date.now(),
      };

      DB.writeAll(rows);
      setApiStatus("success");
      return rows[idx];
    },

    async deletePost(id) {
      ensureConnected();
      setApiStatus("loading");
      await sleep(220 + Math.random() * 240);

      const { rows } = DB.readAll();
      const next = rows.filter((p) => p.id !== id);
      DB.writeAll(next);
      setApiStatus("success");
      return { ok: true };
    },
  };

  function ensureConnected() {
    if (!dbState.connected) throw new Error("DB not connected. Click Connect first.");
  }

  function normalizeTags(str) {
    return String(str || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  // ------------------------------
  // DOM
  // ------------------------------
  const els = {
    dbStatus: $("#dbStatus"),
    connectBtn: $("#connectBtn"),
    seedBtn: $("#seedBtn"),

    q: $("#q"),
    statusFilter: $("#statusFilter"),
    sort: $("#sort"),
    countText: $("#countText"),
    apiText: $("#apiText"),
    subText: $("#subText"),

    postGrid: $("#postGrid"),
    emptyState: $("#emptyState"),
    clearFiltersBtn: $("#clearFiltersBtn"),
    newPostBtn: $("#newPostBtn"),

    editorModal: $("#editorModal"),
    editorOverlay: $("#editorOverlay"),
    closeEditorBtn: $("#closeEditorBtn"),
    cancelBtn: $("#cancelBtn"),
    deleteBtn: $("#deleteBtn"),

    editorTitle: $("#editorTitle"),
    editorForm: $("#editorForm"),
    postId: $("#postId"),
    title: $("#title"),
    author: $("#author"),
    tags: $("#tags"),
    status: $("#status"),
    content: $("#content"),
    saveBtn: $("#saveBtn"),

    toast: $("#toast"),
  };

  // ------------------------------
  // Phase 4: Dynamic UI
  // ------------------------------
  function setApiStatus(status) {
    serverState.status = status;
    els.apiText.textContent = `API: ${status[0].toUpperCase()}${status.slice(1)}`;
  }

  function setDbStatus() {
    els.dbStatus.textContent = dbState.connected ? "DB: Connected ✓" : "DB: Disconnected";
  }

  async function refresh() {
    try {
      serverState.error = null;
      const list = await Api.getPosts({
        q: uiState.q,
        status: uiState.statusFilter,
        sort: uiState.sort,
      });
      serverState.posts = list;
      renderPosts();
    } catch (e) {
      serverState.error = e?.message || "Something went wrong.";
      serverState.posts = [];
      renderPosts();
      showToast(serverState.error, "error");
    }
  }

  function renderPosts() {
    const list = serverState.posts || [];
    els.postGrid.innerHTML = "";

    els.countText.textContent = `${list.length} post${list.length === 1 ? "" : "s"}`;
    els.subText.textContent = dbState.connected
      ? "Create, edit, publish and delete posts."
      : "Connect DB to start.";

    if (!list.length) {
      els.emptyState.hidden = false;
      return;
    }
    els.emptyState.hidden = true;

    for (const p of list) {
      const card = document.createElement("article");
      card.className = "card";

      const statusPill =
        p.status === "published"
          ? `<span class="pill pill--pub">Published</span>`
          : `<span class="pill pill--draft">Draft</span>`;

      card.innerHTML = `
        <div class="card__top">
          <div>
            <div class="card__title">${escapeHtml(p.title)}</div>
            <div class="card__sub">By ${escapeHtml(p.author)} • ${new Date(p.updatedAt).toLocaleString()}</div>
          </div>
          ${statusPill}
        </div>
        <div class="card__body">
          <div class="card__excerpt">${escapeHtml(excerpt(p.content))}</div>
          <div class="card__tags">
            ${(p.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
        <div class="card__actions">
          <button class="btn btn--ghost" data-act="view" data-id="${p.id}" type="button">View</button>
          <button class="btn btn--primary" data-act="edit" data-id="${p.id}" type="button">Edit</button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        if (act === "edit") openEditor(id);
        if (act === "view") viewPost(id);
      });

      els.postGrid.appendChild(card);
    }
  }

  function viewPost(id) {
    const p = serverState.posts.find((x) => x.id === id);
    if (!p) return;

    alert(
      `${p.title}\n\n` +
      `Author: ${p.author}\n` +
      `Status: ${p.status}\n` +
      `Tags: ${(p.tags || []).join(", ")}\n\n` +
      `${p.content}`
    );
  }

  // Editor
  function openEditor(id = null) {
    if (!dbState.connected) {
      showToast("Connect DB first.", "error");
      return;
    }

    uiState.editorOpen = true;
    uiState.editingId = id;

    clearErrors();
    hideToast();

    if (!id) {
      els.editorTitle.textContent = "New Post";
      els.postId.value = "";
      els.title.value = "";
      els.author.value = "";
      els.tags.value = "";
      els.status.value = "draft";
      els.content.value = "";
      els.deleteBtn.hidden = true;
    } else {
      const p = serverState.posts.find((x) => x.id === id);
      if (!p) return;

      els.editorTitle.textContent = "Edit Post";
      els.postId.value = p.id;
      els.title.value = p.title;
      els.author.value = p.author;
      els.tags.value = (p.tags || []).join(", ");
      els.status.value = p.status;
      els.content.value = p.content;
      els.deleteBtn.hidden = false;
    }

    els.editorModal.hidden = false;
    document.body.style.overflow = "hidden";
    els.title.focus();
  }

  function closeEditor() {
    uiState.editorOpen = false;
    uiState.editingId = null;
    els.editorModal.hidden = true;
    document.body.style.overflow = "";
    els.newPostBtn.focus();
  }

  // Validation
  function validateForm() {
    const errs = {};
    if (els.title.value.trim().length < 3) errs.title = "Title must be at least 3 characters.";
    if (els.author.value.trim().length < 2) errs.author = "Author must be at least 2 characters.";
    if (!["draft", "published"].includes(els.status.value)) errs.status = "Invalid status.";
    if (els.content.value.trim().length < 20) errs.content = "Content must be at least 20 characters.";
    return errs;
  }

  function showErrors(errs) {
    for (const [k, msg] of Object.entries(errs)) {
      const el = $(`[data-err="${k}"]`);
      if (el) el.textContent = msg;
    }
  }

  function clearErrors() {
    $$("[data-err]").forEach((el) => (el.textContent = ""));
  }

  // Toast
  function showToast(msg, kind = "ok") {
    els.toast.hidden = false;
    els.toast.textContent = msg;
    els.toast.style.background =
      kind === "error"
        ? "color-mix(in oklab, var(--danger) 16%, var(--panel2))"
        : "color-mix(in oklab, var(--ok) 12%, var(--panel2))";
  }
  function hideToast() {
    els.toast.hidden = true;
    els.toast.textContent = "";
  }

  // ------------------------------
  // Events
  // ------------------------------
  function wireEvents() {
    els.connectBtn.addEventListener("click", async () => {
      try {
        setApiStatus("loading");
        els.connectBtn.disabled = true;
        await DB.connect();
        setDbStatus();
        setApiStatus("idle");
        showToast("DB connected successfully.", "ok");
        await refresh();
      } catch (e) {
        showToast(e?.message || "Failed to connect DB.", "error");
      } finally {
        els.connectBtn.disabled = false;
      }
    });

    els.seedBtn.addEventListener("click", () => {
      seedDemo();
      showToast("Seeded demo posts.", "ok");
      if (dbState.connected) refresh();
    });

    els.newPostBtn.addEventListener("click", () => openEditor(null));

    els.q.addEventListener("input", debounce(() => {
      uiState.q = els.q.value;
      if (dbState.connected) refresh();
    }, 250));

    els.statusFilter.addEventListener("change", () => {
      uiState.statusFilter = els.statusFilter.value;
      if (dbState.connected) refresh();
    });

    els.sort.addEventListener("change", () => {
      uiState.sort = els.sort.value;
      if (dbState.connected) refresh();
    });

    els.clearFiltersBtn.addEventListener("click", () => {
      els.q.value = "";
      uiState.q = "";
      els.statusFilter.value = "all";
      uiState.statusFilter = "all";
      els.sort.value = "newest";
      uiState.sort = "newest";
      if (dbState.connected) refresh();
    });

    // Modal close
    els.editorOverlay.addEventListener("click", closeEditor);
    els.closeEditorBtn.addEventListener("click", closeEditor);
    els.cancelBtn.addEventListener("click", closeEditor);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && uiState.editorOpen) closeEditor();
    });

    // Save (Create/Update)
    els.editorForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (uiState.submitting) return;

      clearErrors();
      hideToast();

      const errs = validateForm();
      if (Object.keys(errs).length) {
        showErrors(errs);
        showToast("Fix the highlighted fields.", "error");
        return;
      }

      const payload = {
        title: els.title.value,
        author: els.author.value,
        tags: els.tags.value,
        status: els.status.value,
        content: els.content.value,
      };

      uiState.submitting = true;
      els.saveBtn.disabled = true;
      els.saveBtn.textContent = "Saving…";

      try {
        const id = els.postId.value;
        if (!id) {
          await Api.createPost(payload);
          showToast("Post created.", "ok");
        } else {
          await Api.updatePost(id, payload);
          showToast("Post updated.", "ok");
        }
        await refresh();
        await sleep(300);
        closeEditor();
      } catch (e2) {
        showToast(e2?.message || "Failed to save post.", "error");
      } finally {
        uiState.submitting = false;
        els.saveBtn.disabled = false;
        els.saveBtn.textContent = "Save";
      }
    });

    // Delete
    els.deleteBtn.addEventListener("click", async () => {
      const id = els.postId.value;
      if (!id) return;
      const ok = confirm("Delete this post permanently?");
      if (!ok) return;

      try {
        await Api.deletePost(id);
        showToast("Post deleted.", "ok");
        await refresh();
        closeEditor();
      } catch (e) {
        showToast(e?.message || "Failed to delete post.", "error");
      }
    });
  }

  function debounce(fn, ms) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ------------------------------
  // Seed Data
  // ------------------------------
  function seedDemo() {
    const now = Date.now();
    const demo = [
      {
        id: uid(),
        title: "How I built ZENITH CMS in Vanilla JS",
        author: "Akhil Steven",
        tags: ["javascript", "crud", "ui"],
        status: "published",
        content:
          "Today I built a mini blogging CMS that supports CRUD operations, search, filters, and a clean editor UI. I simulated the backend using a localStorage database layer and created an API service that behaves like REST endpoints. The UI is fully dynamic and deployable on Vercel.",
        createdAt: now - 1000 * 60 * 60 * 18,
        updatedAt: now - 1000 * 60 * 12,
      },
      {
        id: uid(),
        title: "Draft: Notes on API design patterns",
        author: "Akhil",
        tags: ["api", "design", "notes"],
        status: "draft",
        content:
          "A good CRUD API uses consistent routes, clear status codes, safe validation, and predictable error handling. Even in a small project, separating DB, API, and UI logic keeps your codebase easy to maintain.",
        createdAt: now - 1000 * 60 * 60 * 36,
        updatedAt: now - 1000 * 60 * 60 * 2,
      },
    ];

    DB.writeAll(demo);
  }

  // ------------------------------
  // Boot
  // ------------------------------
  function boot() {
    setDbStatus();
    setApiStatus("idle");
    renderPosts(); // initial empty
    wireEvents();
  }

  boot();
})();