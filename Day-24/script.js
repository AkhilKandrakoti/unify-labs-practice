/* Personal Library Tracker
   Topics covered:
   1) Adding New Documents: create book doc and store
   2) Finding Documents: search + status filter
   3) Sorting & Limiting: sort options + limit dropdown
   4) Nested Documents: each book has notes[] (nested objects)
*/

const STORAGE_KEY = "library_books_v1";

/** ---------- Utilities ---------- */
function uid(prefix = "b") {
  // Simple unique id for demo (timestamp + random)
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function safeText(s) {
  return String(s ?? "").trim();
}

function parseTags(input) {
  return safeText(input)
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

/** ---------- Data Layer (LocalStorage) ---------- */
function loadBooks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBooks(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

/** Create (Add New Document) */
function addBookDoc({ title, author, tags, status, rating, firstNoteText }) {
  const book = {
    id: uid("book"),
    title: safeText(title),
    author: safeText(author),
    tags: parseTags(tags),
    status,
    rating: Number(rating) || 0,
    createdAt: nowISO(),

    // Nested documents:
    notes: []
  };

  if (safeText(firstNoteText)) {
    book.notes.push({
      id: uid("note"),
      text: safeText(firstNoteText),
      createdAt: nowISO()
    });
  }

  const books = loadBooks();
  books.push(book);
  saveBooks(books);
  return book;
}

/** Read (Get All Documents) */
function getAllBooks() {
  return loadBooks();
}

/** Nested doc: add a note inside a book */
function addNoteToBook(bookId, noteText) {
  const text = safeText(noteText);
  if (!text) return false;

  const books = loadBooks();
  const idx = books.findIndex(b => b.id === bookId);
  if (idx === -1) return false;

  books[idx].notes = Array.isArray(books[idx].notes) ? books[idx].notes : [];
  books[idx].notes.unshift({
    id: uid("note"),
    text,
    createdAt: nowISO()
  });

  saveBooks(books);
  return true;
}

function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
}

/** ---------- Query Layer (Find + Sort + Limit) ---------- */
function matchesQuery(book, query) {
  if (!query) return true;
  const q = query.toLowerCase();

  const haystack = [
    book.title,
    book.author,
    ...(book.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function matchesStatus(book, status) {
  if (!status || status === "all") return true;
  return book.status === status;
}

function sortBooks(books, sortKey) {
  const arr = [...books];

  const [field, dir] = (sortKey || "createdAt_desc").split("_");
  const sign = dir === "asc" ? 1 : -1;

  const getVal = (b) => {
    if (field === "title") return (b.title || "").toLowerCase();
    if (field === "rating") return Number(b.rating) || 0;
    if (field === "createdAt") return new Date(b.createdAt).getTime() || 0;
    return 0;
  };

  arr.sort((a, b) => {
    const va = getVal(a);
    const vb = getVal(b);
    if (va < vb) return -1 * sign;
    if (va > vb) return 1 * sign;
    return 0;
  });

  return arr;
}

function limitBooks(books, limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return books;
  if (n >= 999) return books;
  return books.slice(0, n);
}

/** ---------- UI ---------- */
const el = {
  bookForm: document.getElementById("bookForm"),
  formMsg: document.getElementById("formMsg"),

  query: document.getElementById("query"),
  filterStatus: document.getElementById("filterStatus"),
  sortBy: document.getElementById("sortBy"),
  limit: document.getElementById("limit"),

  list: document.getElementById("list"),
  countText: document.getElementById("countText"),
  filteredText: document.getElementById("filteredText"),

  seedBtn: document.getElementById("seedBtn"),
  clearBtn: document.getElementById("clearBtn")
};

function statusBadgeClass(status) {
  if (status === "to-read") return "badge badge--to-read";
  if (status === "reading") return "badge badge--reading";
  if (status === "finished") return "badge badge--finished";
  return "badge";
}

function statusLabel(status) {
  if (status === "to-read") return "To Read";
  if (status === "reading") return "Reading";
  if (status === "finished") return "Finished";
  return status;
}

function render() {
  const all = getAllBooks();

  const q = safeText(el.query.value);
  const status = el.filterStatus.value;
  const sortKey = el.sortBy.value;
  const limit = el.limit.value;

  // Finding documents
  const filtered = all.filter(b => matchesQuery(b, q) && matchesStatus(b, status));

  // Sorting & Limiting
  const sorted = sortBooks(filtered, sortKey);
  const finalList = limitBooks(sorted, limit);

  el.countText.textContent = `${all.length} book${all.length === 1 ? "" : "s"} total`;
  el.filteredText.textContent = `${finalList.length} shown`;

  if (finalList.length === 0) {
    el.list.innerHTML = `
      <div class="item">
        <p class="muted" style="margin:0;">
          No books match your current search/filter. Try clearing the search or seeding demo data.
        </p>
      </div>
    `;
    return;
  }

  el.list.innerHTML = finalList.map(book => {
    const tags = (book.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("");
    const notes = Array.isArray(book.notes) ? book.notes : [];

    const notesHtml = notes.length
      ? `<ol class="noteList">
          ${notes.slice(0, 4).map(n => `<li>${escapeHtml(n.text)} <span class="muted">(${formatDate(n.createdAt)})</span></li>`).join("")}
         </ol>`
      : `<p class="muted" style="margin:0;">No notes yet.</p>`;

    return `
      <article class="item" role="listitem" data-id="${book.id}">
        <div class="item__top">
          <div>
            <h3 class="item__title">${escapeHtml(book.title)}</h3>
            <div class="item__meta">
              <span>by ${escapeHtml(book.author)}</span>
              <span class="muted"> • </span>
              <span class="muted">Added ${formatDate(book.createdAt)}</span>
              <span class="muted"> • </span>
              <span class="muted">Rating: ${Number(book.rating || 0).toFixed(1)}</span>
            </div>
          </div>
          <span class="${statusBadgeClass(book.status)}">${statusLabel(book.status)}</span>
        </div>

        ${tags ? `<div class="tags" aria-label="Tags">${tags}</div>` : ""}

        <div class="nested">
          <p class="nested__title">Nested Notes (notes[])</p>

          <div class="noteRow">
            <input type="text" class="noteInput" placeholder="Add a note to this book..." maxlength="160" />
            <button type="button" class="btn btn--secondary addNoteBtn">Add Note</button>
          </div>

          ${notesHtml}
        </div>
      </article>
    `;
  }).join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ---------- Event Handlers ---------- */
el.bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const fd = new FormData(el.bookForm);
  const title = fd.get("title");
  const author = fd.get("author");
  const tags = fd.get("tags");
  const status = fd.get("status");
  const rating = fd.get("rating");
  const note = fd.get("note");

  if (!safeText(title) || !safeText(author)) {
    el.formMsg.textContent = "Title and Author are required.";
    return;
  }

  addBookDoc({ title, author, tags, status, rating, firstNoteText: note });

  el.bookForm.reset();
  el.formMsg.textContent = "Book added successfully.";
  setTimeout(() => (el.formMsg.textContent = ""), 1600);

  render();
});

["input", "change"].forEach(evt => {
  el.query.addEventListener(evt, render);
  el.filterStatus.addEventListener(evt, render);
  el.sortBy.addEventListener(evt, render);
  el.limit.addEventListener(evt, render);
});

// Nested note buttons (event delegation)
el.list.addEventListener("click", (e) => {
  const btn = e.target.closest(".addNoteBtn");
  if (!btn) return;

  const card = e.target.closest(".item");
  if (!card) return;

  const bookId = card.getAttribute("data-id");
  const input = card.querySelector(".noteInput");
  const ok = addNoteToBook(bookId, input?.value || "");

  if (ok && input) input.value = "";
  render();
});

el.clearBtn.addEventListener("click", () => {
  const yes = confirm("Clear all saved books from LocalStorage?");
  if (!yes) return;
  clearAll();
  render();
});

el.seedBtn.addEventListener("click", () => {
  const existing = getAllBooks();
  if (existing.length > 0) {
    const yes = confirm("Demo data will be added to existing books. Continue?");
    if (!yes) return;
  }

  const demo = [
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      tags: "programming, best-practices, craftsmanship",
      status: "reading",
      rating: 4.5,
      firstNoteText: "Focus on meaningful names and small functions."
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      tags: "self-improvement, habits",
      status: "finished",
      rating: 4.0,
      firstNoteText: "Make habits obvious, attractive, easy, and satisfying."
    },
    {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      tags: "systems, databases, distributed",
      status: "to-read",
      rating: 0,
      firstNoteText: ""
    }
  ];

  demo.forEach(d => addBookDoc(d));
  render();
});

/** ---------- Init ---------- */
render();