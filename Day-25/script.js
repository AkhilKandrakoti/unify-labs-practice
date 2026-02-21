/* Intern Skill Log — Mongo-style Queries + CRUD (in-memory)
   Supported filter operators:
   $and, $or, $gt, $gte, $lt, $lte, $eq, $ne, $in, $nin, $regex,
   Array helpers: $all, $size, $elemMatch

   Supported updates:
   $set, $inc, $push, $pull
*/

"use strict";

const $ = (sel) => document.querySelector(sel);

const state = {
  docs: [],
  nextId: 1
};

// ---------- Utilities ----------
function nowISO() {
  return new Date().toISOString();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function safeJsonParse(text, fallback = null) {
  const t = (text || "").trim();
  if (!t) return fallback;
  try {
    return JSON.parse(t);
  } catch (e) {
    throw new Error("Invalid JSON: " + e.message);
  }
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

function normalizeTags(str) {
  return (str || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 15);
}

function setOutput(payload) {
  $("#output").textContent = typeof payload === "string" ? payload : pretty(payload);
}

function updateCount() {
  $("#countBadge").textContent = `${state.docs.length} docs`;
}

function priorityRank(p) {
  const map = { low: 1, medium: 2, high: 3, urgent: 4 };
  return map[p] ?? 0;
}

// ---------- Core filter evaluation ----------
function getValueByPath(obj, path) {
  if (!path.includes(".")) return obj[path];
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function matchCondition(fieldValue, condition) {
  // If condition is not an operator object, do equality.
  if (!isPlainObject(condition)) {
    return deepEqual(fieldValue, condition);
  }

  for (const [op, val] of Object.entries(condition)) {
    switch (op) {
      case "$eq":
        if (!deepEqual(fieldValue, val)) return false;
        break;
      case "$ne":
        if (deepEqual(fieldValue, val)) return false;
        break;
      case "$gt":
        if (!(fieldValue > val)) return false;
        break;
      case "$gte":
        if (!(fieldValue >= val)) return false;
        break;
      case "$lt":
        if (!(fieldValue < val)) return false;
        break;
      case "$lte":
        if (!(fieldValue <= val)) return false;
        break;
      case "$in":
        if (!Array.isArray(val)) return false;
        if (Array.isArray(fieldValue)) {
          // array field: match if ANY element in field is in val
          if (!fieldValue.some(x => val.some(v => deepEqual(v, x)))) return false;
        } else {
          if (!val.some(v => deepEqual(v, fieldValue))) return false;
        }
        break;
      case "$nin":
        if (!Array.isArray(val)) return false;
        if (Array.isArray(fieldValue)) {
          // array field: true if NO element in field is in val
          if (fieldValue.some(x => val.some(v => deepEqual(v, x)))) return false;
        } else {
          if (val.some(v => deepEqual(v, fieldValue))) return false;
        }
        break;
      case "$regex": {
        const pattern = String(val);
        const re = new RegExp(pattern, "i");
        if (typeof fieldValue !== "string") return false;
        if (!re.test(fieldValue)) return false;
        break;
      }
      case "$all":
        if (!Array.isArray(val) || !Array.isArray(fieldValue)) return false;
        if (!val.every(v => fieldValue.some(x => deepEqual(x, v)))) return false;
        break;
      case "$size":
        if (!Array.isArray(fieldValue)) return false;
        if (fieldValue.length !== val) return false;
        break;
      case "$elemMatch":
        if (!Array.isArray(fieldValue)) return false;
        if (!fieldValue.some(el => matchFilter(el, val))) return false;
        break;
      default:
        // Unknown op => fail-safe
        return false;
    }
  }
  return true;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }

  return false;
}

function matchFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, value] of Object.entries(filter)) {
    if (key === "$and") {
      if (!Array.isArray(value)) return false;
      if (!value.every(sub => matchFilter(doc, sub))) return false;
      continue;
    }

    if (key === "$or") {
      if (!Array.isArray(value)) return false;
      if (!value.some(sub => matchFilter(doc, sub))) return false;
      continue;
    }

    // Normal field
    const fieldValue = getValueByPath(doc, key);

    // If doc field is array and condition is primitive => membership match like Mongo
    if (!isPlainObject(value) && Array.isArray(fieldValue)) {
      if (!fieldValue.some(x => deepEqual(x, value))) return false;
      continue;
    }

    if (!matchCondition(fieldValue, value)) return false;
  }

  return true;
}

// ---------- Projection ----------
function applyProjection(doc, proj) {
  if (!proj || Object.keys(proj).length === 0) return deepClone(doc);

  const includeKeys = Object.entries(proj).filter(([, v]) => v === 1).map(([k]) => k);
  const excludeKeys = Object.entries(proj).filter(([, v]) => v === 0).map(([k]) => k);

  // Mongo rules are more complex; we implement a simple version:
  // if any include => include only those; else exclude specified keys.
  if (includeKeys.length > 0) {
    const out = {};
    for (const k of includeKeys) out[k] = getValueByPath(doc, k);
    return out;
  }

  const out = deepClone(doc);
  for (const k of excludeKeys) delete out[k];
  return out;
}

// ---------- Sorting ----------
function sortDocs(docs, key, dir) {
  const d = Number(dir) === 1 ? 1 : -1;

  return docs.sort((a, b) => {
    let av = getValueByPath(a, key);
    let bv = getValueByPath(b, key);

    if (key === "priority") {
      av = priorityRank(av);
      bv = priorityRank(bv);
    }

    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * d;
    if (av > bv) return 1 * d;
    if (av < bv) return -1 * d;
    return 0;
  });
}

// ---------- Updates ----------
function applyUpdate(doc, update) {
  if (!isPlainObject(update) || Object.keys(update).length === 0) return;

  for (const [op, payload] of Object.entries(update)) {
    if (!isPlainObject(payload)) continue;

    if (op === "$set") {
      for (const [k, v] of Object.entries(payload)) {
        setByPath(doc, k, v);
      }
      continue;
    }

    if (op === "$inc") {
      for (const [k, v] of Object.entries(payload)) {
        const curr = Number(getValueByPath(doc, k) ?? 0);
        setByPath(doc, k, curr + Number(v));
      }
      continue;
    }

    if (op === "$push") {
      for (const [k, v] of Object.entries(payload)) {
        const curr = getValueByPath(doc, k);
        if (!Array.isArray(curr)) setByPath(doc, k, []);
        getValueByPath(doc, k).push(v);
      }
      continue;
    }

    if (op === "$pull") {
      for (const [k, v] of Object.entries(payload)) {
        const curr = getValueByPath(doc, k);
        if (!Array.isArray(curr)) continue;
        const next = curr.filter(item => !deepEqual(item, v));
        setByPath(doc, k, next);
      }
      continue;
    }
  }

  doc.updatedAt = nowISO();
}

function setByPath(obj, path, value) {
  if (!path.includes(".")) {
    obj[path] = value;
    return;
  }
  const parts = path.split(".");
  const last = parts.pop();
  let ref = obj;
  for (const p of parts) {
    if (!isPlainObject(ref[p])) ref[p] = {};
    ref = ref[p];
  }
  ref[last] = value;
}

// ---------- Rendering ----------
function renderTable() {
  const tbody = $("#collectionRows");
  tbody.innerHTML = "";

  for (const d of state.docs) {
    const tr = document.createElement("tr");

    const tagsText = Array.isArray(d.tags) ? d.tags.join(", ") : "";
    tr.innerHTML = `
      <td>${escapeHtml(d._id)}</td>
      <td>${escapeHtml(d.title)}</td>
      <td>${escapeHtml(d.assignee)}</td>
      <td>${escapeHtml(d.status)}</td>
      <td>${escapeHtml(d.priority)}</td>
      <td>${escapeHtml(tagsText)}</td>
      <td>${escapeHtml(String(d.difficulty))}</td>
      <td>${escapeHtml(String(d.hours))}</td>
    `;
    tbody.appendChild(tr);
  }

  updateCount();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- CRUD actions ----------
function insertDoc(input) {
  const doc = {
    _id: String(state.nextId++).padStart(4, "0"),
    title: input.title,
    assignee: input.assignee,
    status: input.status,
    priority: input.priority,
    difficulty: Number(input.difficulty),
    hours: Number(input.hours),
    tags: input.tags,
    notes: input.notes ? [{ text: input.notes, at: nowISO() }] : [],
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.docs.unshift(doc);
  renderTable();
  return doc;
}

function findDocs(filter, projection, opts) {
  const limit = Math.max(1, Number(opts?.limit ?? 50));
  const sortKey = opts?.sortKey ?? "createdAt";
  const sortDir = opts?.sortDir ?? -1;

  const matched = state.docs.filter(d => matchFilter(d, filter));
  sortDocs(matched, sortKey, sortDir);

  const sliced = matched.slice(0, limit);
  const projected = sliced.map(d => applyProjection(d, projection));

  return { matchedCount: matched.length, returnedCount: projected.length, docs: projected };
}

function updateMany(filter, update) {
  let modified = 0;
  for (const d of state.docs) {
    if (matchFilter(d, filter)) {
      applyUpdate(d, update);
      modified++;
    }
  }
  renderTable();
  return { matchedCount: modified, modifiedCount: modified };
}

function deleteMany(filter) {
  const before = state.docs.length;
  state.docs = state.docs.filter(d => !matchFilter(d, filter));
  const deleted = before - state.docs.length;
  renderTable();
  return { deletedCount: deleted };
}

// ---------- UI wiring ----------
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = {
    find: $("#tab-find"),
    update: $("#tab-update"),
    delete: $("#tab-delete"),
    examples: $("#tab-examples")
  };

  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");

      Object.values(panels).forEach(p => p.classList.remove("active"));
      panels[t.dataset.tab].classList.add("active");
    });
  });
}

function setupExamples() {
  const examples = {
    ex1: {
      filter: { priority: { $in: ["high", "urgent"] }, hours: { $gt: 2 } },
      projection: { title: 1, priority: 1, hours: 1, assignee: 1, tags: 1, _id: 0 }
    },
    ex2: {
      filter: {
        $and: [
          { tags: "mongodb" },
          { status: { $in: ["open", "in_progress"] } }
        ]
      },
      projection: { title: 1, status: 1, tags: 1, _id: 0 }
    },
    ex3: {
      filter: {
        $or: [
          { assignee: { $regex: "^A" } },
          { difficulty: { $gte: 8 } }
        ]
      },
      projection: {}
    },
    ex4: {
      filter: {
        $and: [
          { tags: { $all: ["crud", "arrays"] } },
          { notes: { $elemMatch: { text: { $regex: "learn" } } } }
        ]
      },
      projection: { title: 1, tags: 1, notes: 1, _id: 0 }
    },

    up1: {
      filter: { $and: [{ hours: { $lt: 1 } }, { priority: { $ne: "urgent" } }] },
      update: { $set: { status: "done" } }
    },
    up2: {
      filter: { assignee: "Akhi" },
      update: { $push: { tags: "day25" } }
    },
    up3: {
      filter: {},
      update: { $pull: { tags: "old" } }
    },

    del1: {
      filter: { $and: [{ status: { $in: ["done"] } }, { hours: { $lt: 0.5 } }] }
    },
    del2: {
      filter: { $and: [{ priority: { $nin: ["high", "urgent"] } }, { difficulty: { $lt: 3 } }] }
    }
  };

  document.querySelectorAll(".ex").forEach(btn => {
    btn.addEventListener("click", () => {
      const payloadKey = btn.dataset.payload;
      const target = btn.dataset.target;
      const data = examples[payloadKey];

      if (target === "find") {
        $("#findFilter").value = pretty(data.filter ?? {});
        $("#findProjection").value = pretty(data.projection ?? {});
        setActiveTab("find");
      } else if (target === "update") {
        $("#updateFilter").value = pretty(data.filter ?? {});
        $("#updateDoc").value = pretty(data.update ?? {});
        setActiveTab("update");
      } else if (target === "delete") {
        $("#deleteFilter").value = pretty(data.filter ?? {});
        setActiveTab("delete");
      }

      setOutput({ message: "Example loaded. Run the operation." });
    });
  });

  function setActiveTab(tabName) {
    document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === tabName));
    ["find", "update", "delete", "examples"].forEach(k => {
      $("#tab-" + k).classList.toggle("active", k === tabName);
    });
  }
}

function setupButtons() {
  // Insert
  $("#insertForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const doc = insertDoc({
      title: $("#title").value.trim(),
      assignee: $("#assignee").value.trim(),
      status: $("#status").value,
      priority: $("#priority").value,
      difficulty: $("#difficulty").value,
      hours: $("#hours").value,
      tags: normalizeTags($("#tags").value),
      notes: $("#notes").value.trim()
    });

    $("#insertForm").reset();
    $("#difficulty").value = 5;
    $("#hours").value = 1;

    setOutput({ inserted: doc });
  });

  // Seed
  $("#seedBtn").addEventListener("click", () => {
    seedData();
    setOutput({ message: "Sample data loaded.", docs: state.docs.slice(0, 3) });
  });

  // Reset
  $("#resetBtn").addEventListener("click", () => {
    state.docs = [];
    state.nextId = 1;
    renderTable();
    setOutput({ message: "Collection reset." });
  });

  // FIND
  $("#runFindBtn").addEventListener("click", () => {
    try {
      const filter = safeJsonParse($("#findFilter").value, {});
      const proj = safeJsonParse($("#findProjection").value, {});
      const res = findDocs(filter, proj, {
        limit: $("#findLimit").value,
        sortKey: $("#findSortKey").value,
        sortDir: $("#findSortDir").value
      });
      setOutput({ operation: "find", filter, projection: proj, ...res });
    } catch (err) {
      setOutput({ error: String(err.message || err) });
    }
  });

  $("#prettifyFindBtn").addEventListener("click", () => {
    try {
      $("#findFilter").value = pretty(safeJsonParse($("#findFilter").value, {}));
      $("#findProjection").value = pretty(safeJsonParse($("#findProjection").value, {}));
    } catch (err) {
      setOutput({ error: String(err.message || err) });
    }
  });

  $("#clearFindBtn").addEventListener("click", () => {
    $("#findFilter").value = "";
    $("#findProjection").value = "";
    setOutput("Cleared find() inputs.");
  });

  // UPDATE
  $("#runUpdateBtn").addEventListener("click", () => {
    try {
      const filter = safeJsonParse($("#updateFilter").value, {});
      const update = safeJsonParse($("#updateDoc").value, {});
      const res = updateMany(filter, update);
      setOutput({ operation: "updateMany", filter, update, ...res });
    } catch (err) {
      setOutput({ error: String(err.message || err) });
    }
  });

  $("#prettifyUpdateBtn").addEventListener("click", () => {
    try {
      $("#updateFilter").value = pretty(safeJsonParse($("#updateFilter").value, {}));
      $("#updateDoc").value = pretty(safeJsonParse($("#updateDoc").value, {}));
    } catch (err) {
      setOutput({ error: String(err.message || err) });
    }
  });

  $("#clearUpdateBtn").addEventListener("click", () => {
    $("#updateFilter").value = "";
    $("#updateDoc").value = "";
    setOutput("Cleared updateMany() inputs.");
  });

  // DELETE
  $("#runDeleteBtn").addEventListener("click", () => {
    try {
      const filter = safeJsonParse($("#deleteFilter").value, {});
      const res = deleteMany(filter);
      setOutput({ operation: "deleteMany", filter, ...res });
    } catch (err) {
      setOutput({ error: String(err.message || err) });
    }
  });

  $("#prettifyDeleteBtn").addEventListener("click", () => {
    try {
      $("#deleteFilter").value = pretty(safeJsonParse($("#deleteFilter").value, {}));
    } catch (err) {
      setOutput({ error: String(err.message || err) });
    }
  });

  $("#clearDeleteBtn").addEventListener("click", () => {
    $("#deleteFilter").value = "";
    setOutput("Cleared deleteMany() input.");
  });
}

function seedData() {
  const samples = [
    {
      title: "Setup MongoDB Compass and create unify_labs",
      assignee: "Akhi",
      status: "done",
      priority: "high",
      difficulty: 4,
      hours: 0.5,
      tags: ["mongodb", "nosql", "setup", "crud"],
      notes: "learned database + collection basics"
    },
    {
      title: "Build advanced filter UI ($and/$or/$in/$nin)",
      assignee: "Akhil",
      status: "in_progress",
      priority: "urgent",
      difficulty: 9,
      hours: 3,
      tags: ["mongodb", "queries", "operators", "arrays", "crud"],
      notes: "learned $in/$nin and array matching"
    },
    {
      title: "Clean dummy data and validate schema",
      assignee: "Sivaram",
      status: "open",
      priority: "medium",
      difficulty: 6,
      hours: 2,
      tags: ["data", "validation", "quality"],
      notes: "learned regex checks"
    },
    {
      title: "Write README for Day 25",
      assignee: "Akhi",
      status: "open",
      priority: "low",
      difficulty: 2,
      hours: 0.25,
      tags: ["documentation", "old"],
      notes: "learned to keep it concise"
    },
    {
      title: "Practice array operators ($all/$size/$elemMatch)",
      assignee: "Anita",
      status: "done",
      priority: "high",
      difficulty: 7,
      hours: 1.5,
      tags: ["arrays", "mongodb", "notes", "crud"],
      notes: "learned elemMatch patterns"
    }
  ];

  for (const s of samples) {
    insertDoc({
      title: s.title,
      assignee: s.assignee,
      status: s.status,
      priority: s.priority,
      difficulty: s.difficulty,
      hours: s.hours,
      tags: s.tags,
      notes: s.notes
    });
  }
}

// ---------- Init ----------
function initDefaults() {
  $("#findFilter").value = pretty({ status: { $in: ["open", "in_progress"] } });
  $("#findProjection").value = pretty({ title: 1, assignee: 1, status: 1, tags: 1, priority: 1, _id: 0 });

  $("#updateFilter").value = pretty({ assignee: "Akhi", status: "open" });
  $("#updateDoc").value = pretty({ $set: { status: "in_progress" }, $inc: { hours: 0.5 } });

  $("#deleteFilter").value = pretty({ priority: { $nin: ["high", "urgent"] }, difficulty: { $lt: 3 } });

  setOutput({
    message: "Ready. Load sample data or insert documents, then run find/update/delete.",
    quickStart: [
      "Click: Load Sample Data",
      "Run find() with $in",
      "Try array queries: tags: { $all: [...] }",
      "Update with $push/$pull",
      "Delete with $and/$or"
    ]
  });
}

setupTabs();
setupExamples();
setupButtons();
renderTable();
initDefaults();