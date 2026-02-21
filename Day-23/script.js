// app.js (type="module")

/**
 * Campus Lost & Found — MongoDB Simulator
 * - Mimics: DB -> collections -> documents
 * - Compass-like UI explorer
 * - mongosh-like terminal (subset commands)
 * - Persists to localStorage
 */

const STORAGE_KEY = "lf_mongo_sim_v1";

/** ---------------------------
 * Utilities
 * -------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function nowISO() {
  return new Date().toISOString();
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

function makeId(prefix = "") {
  // simple, readable id (not ObjectId, but close enough for learning)
  const rand = Math.random().toString(16).slice(2);
  const time = Date.now().toString(16);
  return `${prefix}${time}${rand}`.slice(0, 24);
}

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

function containsText(obj, q) {
  const hay = JSON.stringify(obj).toLowerCase();
  return hay.includes(q.toLowerCase());
}

/** ---------------------------
 * In-memory DB
 * -------------------------- */
const DEFAULT_DB = {
  name: "campus_lost_found",
  activeCollection: "items",
  collections: {
    items: [],
    people: [],
    claims: []
  }
};

function loadDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return deepClone(DEFAULT_DB);

  const parsed = safeJsonParse(raw);
  if (!parsed.ok) return deepClone(DEFAULT_DB);

  // basic shape validation
  const db = parsed.value;
  if (!db?.collections || typeof db.collections !== "object") return deepClone(DEFAULT_DB);

  // Ensure required collections exist
  for (const k of Object.keys(DEFAULT_DB.collections)) {
    if (!Array.isArray(db.collections[k])) db.collections[k] = [];
  }
  if (!db.activeCollection || !db.collections[db.activeCollection]) {
    db.activeCollection = "items";
  }
  if (!db.name) db.name = DEFAULT_DB.name;

  return db;
}

function saveDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
}

function resetDB() {
  state.db = deepClone(DEFAULT_DB);
  state.selectedId = null;
  state.searchQuery = "";
  saveDB();
  renderAll();
  status("DB reset.", "ok");
}

function seedDB() {
  const db = state.db;

  // People
  const p1 = { _id: makeId("p_"), name: "Akhil", role: "Student", phone: "9XXXXXXXXX", createdAt: nowISO(), updatedAt: nowISO() };
  const p2 = { _id: makeId("p_"), name: "Riya", role: "Student", phone: "8XXXXXXXXX", createdAt: nowISO(), updatedAt: nowISO() };
  const p3 = { _id: makeId("p_"), name: "Security Desk", role: "Admin", phone: "Campus Ext. 101", createdAt: nowISO(), updatedAt: nowISO() };
  db.collections.people = [p1, p2, p3];

  // Items
  const i1 = {
    _id: makeId("i_"),
    type: "Found",
    title: "Black Wallet",
    description: "Found near CSE block entrance.",
    location: "CSE Block Gate",
    status: "Unclaimed",
    tags: ["wallet", "black"],
    linkedPersonId: p3._id,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  const i2 = {
    _id: makeId("i_"),
    type: "Lost",
    title: "USB Drive 32GB",
    description: "Silver USB, might have keychain.",
    location: "Library 2nd floor",
    status: "Open",
    tags: ["usb", "storage"],
    linkedPersonId: p1._id,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  const i3 = {
    _id: makeId("i_"),
    type: "Found",
    title: "Water Bottle",
    description: "Blue bottle with stickers.",
    location: "Cafeteria",
    status: "Unclaimed",
    tags: ["bottle", "blue"],
    linkedPersonId: p2._id,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  db.collections.items = [i1, i2, i3];

  // Claims
  const c1 = {
    _id: makeId("c_"),
    itemId: i1._id,
    claimerPersonId: p1._id,
    message: "I think this wallet is mine. Can verify ID inside.",
    status: "Pending",
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  db.collections.claims = [c1];

  saveDB();
  renderAll();
  status("Sample data seeded.", "ok");
}

/** ---------------------------
 * App State
 * -------------------------- */
const state = {
  db: loadDB(),
  selectedId: null,
  searchQuery: "",
  terminalHistory: [],
  terminalHistoryIndex: -1
};

/** ---------------------------
 * DOM refs
 * -------------------------- */
const els = {
  dbName: $("#dbName"),
  collectionsList: $("#collectionsList"),
  crumbDb: $("#crumbDb"),
  crumbCollection: $("#crumbCollection"),
  searchInput: $("#searchInput"),
  clearSearchBtn: $("#clearSearchBtn"),
  docCountPill: $("#docCountPill"),
  statusPill: $("#statusPill"),
  docsTbody: $("#docsTbody"),
  docsTable: $("#docsTable"),
  selectedId: $("#selectedId"),
  jsonEditor: $("#jsonEditor"),
  jsonLint: $("#jsonLint"),
  saveBtn: $("#saveBtn"),
  duplicateBtn: $("#duplicateBtn"),
  deleteBtn: $("#deleteBtn"),
  refreshBtn: $("#refreshBtn"),
  newDocBtn: $("#newDocBtn"),
  seedBtn: $("#seedBtn"),
  resetBtn: $("#resetBtn"),
  exportBtn: $("#exportBtn"),
  importFile: $("#importFile"),
  terminalBody: $("#terminalBody"),
  terminalForm: $("#terminalForm"),
  terminalCmd: $("#terminalCmd"),
  promptText: $("#promptText"),
};

/** ---------------------------
 * Rendering
 * -------------------------- */
function status(msg, type = "info") {
  els.statusPill.textContent = msg;
  if (type === "ok") {
    els.statusPill.style.borderColor = "rgba(52,211,153,0.45)";
  } else if (type === "err") {
    els.statusPill.style.borderColor = "rgba(251,113,133,0.45)";
  } else {
    els.statusPill.style.borderColor = "rgba(255,255,255,0.12)";
  }
  // reset after a bit
  window.clearTimeout(status._t);
  status._t = window.setTimeout(() => {
    els.statusPill.textContent = "Ready";
    els.statusPill.style.borderColor = "rgba(255,255,255,0.12)";
  }, 1800);
}

function activeCollectionName() {
  return state.db.activeCollection;
}

function activeCollection() {
  return state.db.collections[activeCollectionName()];
}

function renderCollections() {
  const names = Object.keys(state.db.collections);
  els.collectionsList.innerHTML = "";

  names.forEach((name) => {
    const count = state.db.collections[name].length;
    const btn = document.createElement("div");
    btn.className = "collection-item" + (name === activeCollectionName() ? " active" : "");
    btn.setAttribute("role", "option");
    btn.setAttribute("tabindex", "0");

    btn.innerHTML = `
      <div>
        <div class="collection-name mono">${name}</div>
        <div class="collection-meta">${count} document${count === 1 ? "" : "s"}</div>
      </div>
      <div class="collection-meta mono">db.${name}</div>
    `;

    const activate = () => {
      state.db.activeCollection = name;
      state.selectedId = null;
      els.jsonEditor.value = "";
      els.searchInput.value = "";
      state.searchQuery = "";
      saveDB();
      renderAll();
      status(`Switched to ${name}.`, "ok");
    };

    btn.addEventListener("click", activate);
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") activate();
    });

    els.collectionsList.appendChild(btn);
  });
}

function renderHeader() {
  els.dbName.textContent = state.db.name;
  els.crumbDb.textContent = state.db.name;
  els.crumbCollection.textContent = activeCollectionName();
  els.promptText.textContent = `${state.db.name}>`;
}

function getVisibleDocs() {
  const docs = activeCollection();
  const q = state.searchQuery.trim();
  if (!q) return docs;
  return docs.filter((d) => containsText(d, q));
}

function renderDocsTable() {
  const docs = getVisibleDocs();
  els.docCountPill.textContent = `${docs.length} doc${docs.length === 1 ? "" : "s"}`;
  els.docsTbody.innerHTML = "";

  docs.forEach((doc) => {
    const tr = document.createElement("tr");
    tr.className = "tr" + (doc._id === state.selectedId ? " active" : "");
    tr.innerHTML = `
      <td class="mono">${escapeHtml(doc._id)}</td>
      <td>${escapeHtml(docPreview(doc))}</td>
      <td class="mono">${escapeHtml(formatShortDate(doc.updatedAt || doc.createdAt))}</td>
    `;
    tr.addEventListener("click", () => selectDoc(doc._id));
    els.docsTbody.appendChild(tr);
  });

  if (docs.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="3" class="muted">
        No documents found. Try inserting a document or clearing search.
      </td>
    `;
    els.docsTbody.appendChild(tr);
  }
}

function renderEditor() {
  const col = activeCollection();
  const doc = col.find((d) => d._id === state.selectedId);

  els.selectedId.textContent = doc ? doc._id : "—";
  els.saveBtn.disabled = !doc && els.jsonEditor.value.trim() === "";
  els.duplicateBtn.disabled = !doc;
  els.deleteBtn.disabled = !doc;

  if (doc) {
    els.jsonEditor.value = pretty(doc);
    lintEditor();
  } else if (!els.jsonEditor.value.trim()) {
    els.jsonLint.textContent = "—";
  }
}

function renderAll() {
  renderHeader();
  renderCollections();
  renderDocsTable();
  renderEditor();
}

/** ---------------------------
 * Document operations
 * -------------------------- */
function selectDoc(id) {
  state.selectedId = id;
  renderDocsTable();
  renderEditor();
  status(`Selected ${id}.`, "ok");
}

function insertDocument(doc) {
  const col = activeCollection();

  const newDoc = deepClone(doc);
  if (!newDoc._id) newDoc._id = makeId("d_");
  if (!newDoc.createdAt) newDoc.createdAt = nowISO();
  newDoc.updatedAt = nowISO();

  col.unshift(newDoc);
  saveDB();
  state.selectedId = newDoc._id;

  renderAll();
  status("Document inserted.", "ok");
}

function updateDocument(id, doc) {
  const col = activeCollection();
  const idx = col.findIndex((d) => d._id === id);
  if (idx === -1) throw new Error("Document not found");

  const next = deepClone(doc);
  if (!next._id) next._id = id;
  next.updatedAt = nowISO();
  if (!next.createdAt) next.createdAt = col[idx].createdAt || nowISO();

  col[idx] = next;
  saveDB();
  renderAll();
  status("Document updated.", "ok");
}

function deleteDocument(id) {
  const col = activeCollection();
  const idx = col.findIndex((d) => d._id === id);
  if (idx === -1) return;

  col.splice(idx, 1);
  saveDB();
  state.selectedId = null;
  els.jsonEditor.value = "";
  renderAll();
  status("Document deleted.", "ok");
}

function duplicateDocument(id) {
  const col = activeCollection();
  const doc = col.find((d) => d._id === id);
  if (!doc) return;

  const copy = deepClone(doc);
  copy._id = makeId(doc._id.split("_")[0] + "_");
  copy.createdAt = nowISO();
  copy.updatedAt = nowISO();

  col.unshift(copy);
  saveDB();
  state.selectedId = copy._id;
  renderAll();
  status("Document duplicated.", "ok");
}

/** ---------------------------
 * Compass-like helpers
 * -------------------------- */
function docPreview(doc) {
  // Give a friendly preview based on known fields
  const title = doc.title || doc.name || doc.message || doc.type || "document";
  const status = doc.status ? ` • ${doc.status}` : "";
  const loc = doc.location ? ` • ${doc.location}` : "";
  return `${title}${status}${loc}`;
}

function formatShortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ---------------------------
 * Editor linting
 * -------------------------- */
function lintEditor() {
  const text = els.jsonEditor.value.trim();
  if (!text) {
    els.jsonLint.textContent = "—";
    els.saveBtn.disabled = true;
    return;
  }
  const parsed = safeJsonParse(text);
  if (!parsed.ok) {
    els.jsonLint.textContent = `Invalid JSON: ${parsed.error.message}`;
    els.saveBtn.disabled = true;
    return;
  }
  if (typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
    els.jsonLint.textContent = "JSON must be an object (document).";
    els.saveBtn.disabled = true;
    return;
  }
  els.jsonLint.textContent = "Valid JSON document.";
  els.saveBtn.disabled = false;
}

/** ---------------------------
 * mongosh Simulator
 * -------------------------- */
function termPrint(kind, text, cmd = "") {
  const line = document.createElement("div");
  line.className = "term-line";
  const cmdHtml = cmd ? `<div class="cmd mono">$ ${escapeHtml(cmd)}</div>` : "";
  const outClass = kind === "err" ? "err" : "out";
  line.innerHTML = `
    ${cmdHtml}
    <div class="${outClass} mono">${escapeHtml(text)}</div>
  `;
  els.terminalBody.appendChild(line);
  els.terminalBody.scrollTop = els.terminalBody.scrollHeight;
}

function helpText() {
  return [
    "MongoDB Shell (Simulator) — supported commands:",
    "  help",
    "  show dbs",
    "  use <dbName>",
    "  show collections",
    "  db.<collection>.find()",
    "  db.<collection>.find({ key: \"value\" })",
    "  db.<collection>.insertOne({ ... })",
    "  db.<collection>.updateOne({ _id: \"...\" }, { $set: { ... } })",
    "  db.<collection>.deleteOne({ _id: \"...\" })",
    "",
    "Notes:",
    "- This is a learning simulator (no real Mongo server).",
    "- Data persists via localStorage."
  ].join("\n");
}

function parseArgsObject(text) {
  // Accept JSON-like object with double quotes.
  // For simplicity: require valid JSON object.
  const parsed = safeJsonParse(text);
  if (!parsed.ok) throw new Error("Expected a valid JSON object (use double quotes).");
  if (typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
    throw new Error("Expected a JSON object.");
  }
  return parsed.value;
}

function applyFindFilter(docs, filterObj) {
  // simple equality match for top-level keys
  return docs.filter((doc) => {
    return Object.entries(filterObj).every(([k, v]) => doc?.[k] === v);
    });
}

function runCommand(inputRaw) {
  const input = inputRaw.trim();
  if (!input) return;

  // Keep terminal history
  state.terminalHistory.unshift(input);
  state.terminalHistoryIndex = -1;

  try {
    if (input === "help") {
      termPrint("out", helpText(), input);
      return;
    }

    if (input === "show dbs") {
      termPrint("out", `${state.db.name}`, input);
      return;
    }

    if (input.startsWith("use ")) {
      const name = input.slice(4).trim();
      if (!name) throw new Error("Usage: use <dbName>");
      state.db.name = name;
      saveDB();
      renderHeader();
      termPrint("out", `switched to db ${name}`, input);
      return;
    }

    if (input === "show collections") {
      const cols = Object.keys(state.db.collections).join("\n");
      termPrint("out", cols || "(none)", input);
      return;
    }

    // db.<collection>.<operation>(...)
    const dbOp = input.match(/^db\.([a-zA-Z0-9_]+)\.(find|insertOne|updateOne|deleteOne)\((.*)\)\s*$/);
    if (!dbOp) {
      throw new Error("Unknown command. Type: help");
    }

    const [, colName, op, argStrRaw] = dbOp;
    const col = state.db.collections[colName];
    if (!col) throw new Error(`Collection not found: ${colName}`);

    if (op === "find") {
      const argStr = argStrRaw.trim();
      let docs = col;

      if (argStr) {
        const filterObj = parseArgsObject(argStr);
        docs = applyFindFilter(col, filterObj);
      }

      termPrint("out", pretty(docs), input);

      // sync UI to that collection
      state.db.activeCollection = colName;
      state.selectedId = null;
      state.searchQuery = "";
      els.searchInput.value = "";
      saveDB();
      renderAll();
      return;
    }

    if (op === "insertOne") {
      const argStr = argStrRaw.trim();
      if (!argStr) throw new Error("insertOne requires a document object.");
      const doc = parseArgsObject(argStr);

      // insert into that collection
      state.db.activeCollection = colName;
      insertDocument(doc);

      termPrint("out", "inserted 1 document", input);
      return;
    }

    if (op === "updateOne") {
      // updateOne({ _id: "..." }, { $set: { ... } })
      const parts = splitTopLevelArgs(argStrRaw);
      if (parts.length !== 2) throw new Error("updateOne requires 2 arguments.");

      const filter = parseArgsObject(parts[0]);
      const update = parseArgsObject(parts[1]);

      const id = filter._id;
      if (!id) throw new Error('updateOne filter must include "_id".');
      if (!update.$set || typeof update.$set !== "object") {
        throw new Error('updateOne update must include { "$set": { ... } }.');
      }

      const doc = col.find((d) => d._id === id);
      if (!doc) throw new Error("No document matched the filter.");

      const next = { ...doc, ...update.$set, _id: doc._id, updatedAt: nowISO() };

      // apply update
      state.db.activeCollection = colName;
      updateDocument(id, next);

      termPrint("out", "matched 1 document, modified 1 document", input);
      return;
    }

    if (op === "deleteOne") {
      const argStr = argStrRaw.trim();
      if (!argStr) throw new Error("deleteOne requires a filter object.");
      const filter = parseArgsObject(argStr);

      const id = filter._id;
      if (!id) throw new Error('deleteOne filter must include "_id".');

      const exists = col.some((d) => d._id === id);
      if (!exists) throw new Error("No document matched the filter.");

      state.db.activeCollection = colName;
      deleteDocument(id);

      termPrint("out", "deleted 1 document", input);
      return;
    }
  } catch (err) {
    termPrint("err", err.message || String(err), input);
    status(err.message || "Command error", "err");
  }
}

function splitTopLevelArgs(argStr) {
  // Splits "a, b" into ["a","b"] while respecting braces/brackets/quotes.
  const s = argStr.trim();
  if (!s) return [];
  const out = [];
  let cur = "";
  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inStr) {
      cur += ch;
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }

    if (ch === '"') {
      inStr = true;
      cur += ch;
      continue;
    }

    if (ch === "{" || ch === "[" || ch === "(") depth++;
    if (ch === "}" || ch === "]" || ch === ")") depth--;

    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** ---------------------------
 * Export / Import
 * -------------------------- */
function exportJSON() {
  const blob = new Blob([JSON.stringify(state.db, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.db.name}_export.json`;
  a.click();

  URL.revokeObjectURL(url);
  status("Exported JSON.", "ok");
}

async function importJSON(file) {
  const text = await file.text();
  const parsed = safeJsonParse(text);
  if (!parsed.ok) throw new Error("Invalid JSON file.");

  // Minimal validation
  const db = parsed.value;
  if (!db?.collections || typeof db.collections !== "object") {
    throw new Error("Import must include { collections: {...} }");
  }

  // Ensure arrays
  for (const [k, v] of Object.entries(db.collections)) {
    if (!Array.isArray(v)) throw new Error(`Collection "${k}" must be an array.`);
  }

  state.db = db;
  if (!state.db.name) state.db.name = DEFAULT_DB.name;

  // Ensure required collections exist
  for (const k of Object.keys(DEFAULT_DB.collections)) {
    if (!Array.isArray(state.db.collections[k])) state.db.collections[k] = [];
  }

  if (!state.db.activeCollection || !state.db.collections[state.db.activeCollection]) {
    state.db.activeCollection = "items";
  }

  state.selectedId = null;
  state.searchQuery = "";
  els.searchInput.value = "";
  saveDB();
  renderAll();
  status("Imported JSON.", "ok");
}

/** ---------------------------
 * Events
 * -------------------------- */
function wireEvents() {
  els.searchInput.addEventListener("input", () => {
    state.searchQuery = els.searchInput.value;
    renderDocsTable();
  });

  els.clearSearchBtn.addEventListener("click", () => {
    state.searchQuery = "";
    els.searchInput.value = "";
    renderDocsTable();
    status("Search cleared.", "ok");
  });

  els.refreshBtn.addEventListener("click", () => {
    renderAll();
    status("Refreshed.", "ok");
  });

  els.jsonEditor.addEventListener("input", lintEditor);

  els.newDocBtn.addEventListener("click", () => {
    // Start with a sensible template depending on collection
    const col = activeCollectionName();
    const template = templateForCollection(col);
    els.jsonEditor.value = pretty(template);
    state.selectedId = null;
    renderDocsTable();
    lintEditor();
    els.saveBtn.disabled = false;
    status("New document template loaded.", "ok");
  });

  els.saveBtn.addEventListener("click", () => {
    const parsed = safeJsonParse(els.jsonEditor.value.trim());
    if (!parsed.ok) {
      status("Invalid JSON. Fix errors.", "err");
      return;
    }
    const doc = parsed.value;

    if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
      status("JSON must be an object.", "err");
      return;
    }

    if (state.selectedId) {
      updateDocument(state.selectedId, doc);
    } else {
      insertDocument(doc);
    }
  });

  els.deleteBtn.addEventListener("click", () => {
    if (!state.selectedId) return;
    deleteDocument(state.selectedId);
  });

  els.duplicateBtn.addEventListener("click", () => {
    if (!state.selectedId) return;
    duplicateDocument(state.selectedId);
  });

  els.seedBtn.addEventListener("click", seedDB);
  els.resetBtn.addEventListener("click", resetDB);

  els.exportBtn.addEventListener("click", exportJSON);
  els.importFile.addEventListener("change", async () => {
    const f = els.importFile.files?.[0];
    if (!f) return;
    try {
      await importJSON(f);
    } catch (e) {
      status(e.message || "Import failed", "err");
      termPrint("err", e.message || "Import failed");
    } finally {
      els.importFile.value = "";
    }
  });

  // Terminal
  els.terminalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cmd = els.terminalCmd.value;
    els.terminalCmd.value = "";
    runCommand(cmd);
  });

  els.terminalCmd.addEventListener("keydown", (e) => {
    // Up/down for history
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state.terminalHistory.length === 0) return;
      state.terminalHistoryIndex = Math.min(state.terminalHistoryIndex + 1, state.terminalHistory.length - 1);
      els.terminalCmd.value = state.terminalHistory[state.terminalHistoryIndex] ?? "";
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (state.terminalHistory.length === 0) return;
      state.terminalHistoryIndex = Math.max(state.terminalHistoryIndex - 1, -1);
      els.terminalCmd.value = state.terminalHistoryIndex === -1 ? "" : (state.terminalHistory[state.terminalHistoryIndex] ?? "");
    }
  });
}

function templateForCollection(name) {
  if (name === "items") {
    return {
      _id: makeId("i_"),
      type: "Lost",
      title: "Item title",
      description: "Short description",
      location: "Where it was lost/found",
      status: "Open",
      tags: ["tag1", "tag2"],
      linkedPersonId: "",
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
  }
  if (name === "people") {
    return {
      _id: makeId("p_"),
      name: "Person name",
      role: "Student",
      phone: "Contact",
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
  }
  if (name === "claims") {
    return {
      _id: makeId("c_"),
      itemId: "",
      claimerPersonId: "",
      message: "I want to claim this item because...",
      status: "Pending",
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
  }
  return { _id: makeId("d_"), createdAt: nowISO(), updatedAt: nowISO() };
}

/** ---------------------------
 * Bootstrap
 * -------------------------- */
function boot() {
  renderAll();
  wireEvents();

  termPrint("out", "mongosh simulator ready. Type: help");
  termPrint("out", "Try: show collections");
}

boot();