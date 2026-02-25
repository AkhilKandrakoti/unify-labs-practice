/* ===========================
   TITAN Storefront — App JS
   Phases:
   1) Dual State: serverState + uiState
   2) Persistent Cart: localStorage (versioned)
   3) Backend Search/Filtering: mock API w/ latency + caching
   4) Secure Checkout: validation + CSRF + idempotency + payload hash
   5) Responsive: drawer + modal + keyboard controls
   =========================== */

(() => {
  "use strict";

  // ---------------------------
  // Utilities
  // ---------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmtINR = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function debounce(fn, ms = 250) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // Basic non-crypto hash (demo). In real apps, use crypto APIs on server.
  function tinyHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  function uuid() {
    // reasonably unique for demo
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }

  // ---------------------------
  // Mock "Database"
  // ---------------------------
  const PRODUCTS = [
    {
      id: "p1",
      title: "Titan Hoodie — Carbon Weave",
      desc: "Heavyweight comfort hoodie with premium stitch lines and durable cuffs.",
      price: 1499,
      rating: 4.6,
      category: "Apparel",
      inStock: true,
      stockLevel: "in",
      freeShip: true,
      createdAt: "2026-02-10",
    },
    {
      id: "p2",
      title: "Aero Bottle — Thermal 750ml",
      desc: "Keeps drinks cold all day. Leak-proof, minimal, travel-ready.",
      price: 899,
      rating: 4.4,
      category: "Lifestyle",
      inStock: true,
      stockLevel: "low",
      freeShip: true,
      createdAt: "2026-01-27",
    },
    {
      id: "p3",
      title: "Nimbus Keyboard — 68 Key",
      desc: "Compact mechanical keyboard with smooth key travel and sturdy frame.",
      price: 3299,
      rating: 4.8,
      category: "Electronics",
      inStock: true,
      stockLevel: "in",
      freeShip: false,
      createdAt: "2026-02-14",
    },
    {
      id: "p4",
      title: "Atlas Backpack — 24L",
      desc: "Daily carry backpack with smart pockets and laptop protection.",
      price: 2599,
      rating: 4.3,
      category: "Lifestyle",
      inStock: true,
      stockLevel: "in",
      freeShip: true,
      createdAt: "2025-12-21",
    },
    {
      id: "p5",
      title: "Pulse Earbuds — ANC Lite",
      desc: "Balanced sound with lightweight noise cancellation for commute.",
      price: 2199,
      rating: 4.1,
      category: "Electronics",
      inStock: false,
      stockLevel: "out",
      freeShip: true,
      createdAt: "2026-01-05",
    },
    {
      id: "p6",
      title: "Forge Tee — Seamless Fit",
      desc: "Soft, breathable tee with premium finish and tailored cut.",
      price: 699,
      rating: 4.2,
      category: "Apparel",
      inStock: true,
      stockLevel: "in",
      freeShip: false,
      createdAt: "2025-11-20",
    },
    {
      id: "p7",
      title: "Coda Desk Mat — Microtexture",
      desc: "Smooth mouse glide with anti-slip backing and clean edges.",
      price: 799,
      rating: 4.5,
      category: "Accessories",
      inStock: true,
      stockLevel: "low",
      freeShip: true,
      createdAt: "2026-02-02",
    },
    {
      id: "p8",
      title: "Ion Charger — 30W GaN",
      desc: "Compact fast charger with stable power delivery and safety guard.",
      price: 1199,
      rating: 4.7,
      category: "Accessories",
      inStock: true,
      stockLevel: "in",
      freeShip: true,
      createdAt: "2026-02-19",
    },
    {
      id: "p9",
      title: "Zen Lamp — Warm Glow",
      desc: "Soft ambient lamp for desk setups with minimal footprint.",
      price: 1799,
      rating: 4.0,
      category: "Home",
      inStock: true,
      stockLevel: "in",
      freeShip: false,
      createdAt: "2025-10-09",
    },
    {
      id: "p10",
      title: "Terra Notebook — Dotted",
      desc: "Premium paper, dotted grid, lay-flat binding for planning.",
      price: 499,
      rating: 4.4,
      category: "Home",
      inStock: true,
      stockLevel: "in",
      freeShip: true,
      createdAt: "2026-02-22",
    }
  ];

  const CATEGORIES = Array.from(new Set(PRODUCTS.map(p => p.category))).sort();

  // ---------------------------
  // Dual-State Architecture
  // uiState: local UI controls (input/filters/drawer/modal)
  // serverState: fetched/cached data from backend (products, stats)
  // ---------------------------
  const uiState = {
    query: "",
    category: "all",
    sort: "relevance",
    minPrice: "",
    maxPrice: "",
    minRating: 0,
    inStockOnly: false,
    freeShipOnly: false,
    cartOpen: false,
    checkoutOpen: false,
    submitting: false,
    theme: "dark",
  };

  const serverState = {
    status: "idle", // idle | loading | error | success
    products: [],
    lastLatencyMs: 0,
    lastQueryKey: "",
    error: null,
  };

  // Cache for mock API results (server-state caching)
  const apiCache = new Map();

  // ---------------------------
  // Persistent Cart (versioned)
  // ---------------------------
  const CART_KEY = "titan_cart_v1";
  const CART_SCHEMA = 1;

  /**
   * Cart structure:
   * {
   *   schema: 1,
   *   items: { [productId]: { qty:number } },
   *   updatedAt: number
   * }
   */
  const cartState = loadCart();

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return { schema: CART_SCHEMA, items: {}, updatedAt: Date.now() };
      const parsed = JSON.parse(raw);
      if (parsed?.schema !== CART_SCHEMA || typeof parsed !== "object") {
        return { schema: CART_SCHEMA, items: {}, updatedAt: Date.now() };
      }
      if (!parsed.items || typeof parsed.items !== "object") {
        parsed.items = {};
      }
      return parsed;
    } catch {
      return { schema: CART_SCHEMA, items: {}, updatedAt: Date.now() };
    }
  }

  function saveCart() {
    cartState.updatedAt = Date.now();
    localStorage.setItem(CART_KEY, JSON.stringify(cartState));
  }

  function cartCount() {
    return Object.values(cartState.items).reduce((sum, it) => sum + (it.qty || 0), 0);
  }

  function cartSubtotal() {
    let sum = 0;
    for (const [pid, { qty }] of Object.entries(cartState.items)) {
      const p = PRODUCTS.find(x => x.id === pid);
      if (!p) continue;
      sum += p.price * qty;
    }
    return sum;
  }

  function shippingCost(subtotal) {
    // demo rule: free shipping if all items are freeShip OR subtotal >= 2000
    const hasAny = cartCount() > 0;
    if (!hasAny) return 0;

    const allFree = Object.keys(cartState.items).every(pid => {
      const p = PRODUCTS.find(x => x.id === pid);
      return p?.freeShip === true;
    });
    if (allFree || subtotal >= 2000) return 0;
    return 79;
  }

  // ---------------------------
  // Mock Backend API
  // ---------------------------
  function normalizeQueryKey(params) {
    // stable key for caching
    return JSON.stringify({
      q: (params.q || "").trim().toLowerCase(),
      category: params.category || "all",
      sort: params.sort || "relevance",
      minPrice: params.minPrice ?? "",
      maxPrice: params.maxPrice ?? "",
      minRating: params.minRating ?? 0,
      inStockOnly: !!params.inStockOnly,
      freeShipOnly: !!params.freeShipOnly,
    });
  }

  async function mockFetchProducts(params) {
    const key = normalizeQueryKey(params);
    const cached = apiCache.get(key);
    if (cached) return { ...cached, fromCache: true };

    const t0 = performance.now();
    // simulate network + server work
    const latency = 220 + Math.random() * 420;
    await sleep(latency);

    const q = (params.q || "").trim().toLowerCase();
    const category = params.category || "all";
    const sort = params.sort || "relevance";
    const minPrice = params.minPrice === "" ? null : Number(params.minPrice);
    const maxPrice = params.maxPrice === "" ? null : Number(params.maxPrice);
    const minRating = Number(params.minRating || 0);
    const inStockOnly = !!params.inStockOnly;
    const freeShipOnly = !!params.freeShipOnly;

    let results = PRODUCTS.slice();

    if (q) {
      results = results.filter(p => {
        const hay = `${p.title} ${p.desc} ${p.category}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (category !== "all") results = results.filter(p => p.category === category);
    if (minPrice != null && !Number.isNaN(minPrice)) results = results.filter(p => p.price >= minPrice);
    if (maxPrice != null && !Number.isNaN(maxPrice)) results = results.filter(p => p.price <= maxPrice);
    if (minRating > 0) results = results.filter(p => p.rating >= minRating);
    if (inStockOnly) results = results.filter(p => p.inStock);
    if (freeShipOnly) results = results.filter(p => p.freeShip);

    // sorting
    if (sort === "price_asc") results.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") results.sort((a, b) => b.price - a.price);
    if (sort === "rating_desc") results.sort((a, b) => b.rating - a.rating);
    if (sort === "newest") results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "relevance" && q) {
      // basic "relevance": prefer title hits + higher rating
      results.sort((a, b) => {
        const at = a.title.toLowerCase().includes(q) ? 1 : 0;
        const bt = b.title.toLowerCase().includes(q) ? 1 : 0;
        if (bt !== at) return bt - at;
        return b.rating - a.rating;
      });
    }

    const t1 = performance.now();
    const payload = {
      key,
      products: results,
      latencyMs: Math.round(t1 - t0),
      total: results.length,
      at: Date.now(),
    };

    apiCache.set(key, payload);
    return { ...payload, fromCache: false };
  }

  // ---------------------------
  // DOM Refs
  // ---------------------------
  const els = {
    q: $("#q"),
    clearSearchBtn: $("#clearSearchBtn"),
    category: $("#category"),
    sort: $("#sort"),
    minPrice: $("#minPrice"),
    maxPrice: $("#maxPrice"),
    inStockOnly: $("#inStockOnly"),
    freeShipOnly: $("#freeShipOnly"),
    resetFiltersBtn: $("#resetFiltersBtn"),
    refreshBtn: $("#refreshBtn"),
    resultsHint: $("#resultsHint"),

    productGrid: $("#productGrid"),
    emptyState: $("#emptyState"),
    emptyResetBtn: $("#emptyResetBtn"),

    countText: $("#countText"),
    latencyText: $("#latencyText"),
    serverBadge: $("#serverBadge"),
    uiBadge: $("#uiBadge"),

    cartCount: $("#cartCount"),
    openCartBtn: $("#openCartBtn"),
    closeCartBtn: $("#closeCartBtn"),
    cartDrawer: $("#cartDrawer"),
    cartOverlay: $("#cartOverlay"),
    cartList: $("#cartList"),
    cartEmpty: $("#cartEmpty"),
    subtotalText: $("#subtotalText"),
    shippingText: $("#shippingText"),
    totalText: $("#totalText"),
    checkoutBtn: $("#checkoutBtn"),

    checkoutModal: $("#checkoutModal"),
    checkoutOverlay: $("#checkoutOverlay"),
    closeCheckoutBtn: $("#closeCheckoutBtn"),
    cancelCheckoutBtn: $("#cancelCheckoutBtn"),
    checkoutForm: $("#checkoutForm"),
    placeOrderBtn: $("#placeOrderBtn"),
    csrfText: $("#csrfText"),
    idemText: $("#idemText"),
    toast: $("#toast"),

    themeBtn: $("#themeBtn"),
  };

  // ---------------------------
  // Init
  // ---------------------------
  function init() {
    // categories
    for (const c of CATEGORIES) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      els.category.appendChild(opt);
    }

    // restore theme
    const savedTheme = localStorage.getItem("titan_theme");
    if (savedTheme === "light" || savedTheme === "dark") uiState.theme = savedTheme;
    applyTheme();

    // initial UI defaults
    els.q.value = uiState.query;
    els.category.value = uiState.category;
    els.sort.value = uiState.sort;
    els.minPrice.value = uiState.minPrice;
    els.maxPrice.value = uiState.maxPrice;
    els.inStockOnly.checked = uiState.inStockOnly;
    els.freeShipOnly.checked = uiState.freeShipOnly;
    setRatingSegmentActive(uiState.minRating);

    // render cart indicators
    syncCartUI();

    // fetch products
    fetchAndRender();

    wireEvents();
  }

  // ---------------------------
  // Events
  // ---------------------------
  function wireEvents() {
    const triggerSearch = debounce(() => {
      uiState.query = els.q.value;
      setUIBadge("UI: Searching…");
      fetchAndRender();
    }, 250);

    els.q.addEventListener("input", triggerSearch);

    els.clearSearchBtn.addEventListener("click", () => {
      els.q.value = "";
      uiState.query = "";
      fetchAndRender();
      els.q.focus();
    });

    els.category.addEventListener("change", () => {
      uiState.category = els.category.value;
      fetchAndRender();
    });

    els.sort.addEventListener("change", () => {
      uiState.sort = els.sort.value;
      fetchAndRender();
    });

    els.minPrice.addEventListener("input", debounce(() => {
      uiState.minPrice = els.minPrice.value;
      fetchAndRender();
    }, 250));

    els.maxPrice.addEventListener("input", debounce(() => {
      uiState.maxPrice = els.maxPrice.value;
      fetchAndRender();
    }, 250));

    els.inStockOnly.addEventListener("change", () => {
      uiState.inStockOnly = els.inStockOnly.checked;
      fetchAndRender();
    });

    els.freeShipOnly.addEventListener("change", () => {
      uiState.freeShipOnly = els.freeShipOnly.checked;
      fetchAndRender();
    });

    $$(".seg__btn").forEach(btn => {
      btn.addEventListener("click", () => {
        uiState.minRating = Number(btn.dataset.rating || 0);
        setRatingSegmentActive(uiState.minRating);
        fetchAndRender();
      });
    });

    els.resetFiltersBtn.addEventListener("click", resetFilters);
    els.emptyResetBtn.addEventListener("click", resetFilters);
    els.refreshBtn.addEventListener("click", () => fetchAndRender({ force: true }));

    // Cart drawer
    els.openCartBtn.addEventListener("click", openCart);
    els.closeCartBtn.addEventListener("click", closeCart);
    els.cartOverlay.addEventListener("click", closeCart);

    // Checkout modal
    els.checkoutBtn.addEventListener("click", () => {
      if (cartCount() === 0) return;
      openCheckout();
    });
    els.closeCheckoutBtn.addEventListener("click", closeCheckout);
    els.cancelCheckoutBtn.addEventListener("click", closeCheckout);
    els.checkoutOverlay.addEventListener("click", closeCheckout);

    els.checkoutForm.addEventListener("submit", onCheckoutSubmit);

    // Theme
    els.themeBtn.addEventListener("click", () => {
      uiState.theme = uiState.theme === "dark" ? "light" : "dark";
      localStorage.setItem("titan_theme", uiState.theme);
      applyTheme();
    });

    // Keyboard ESC close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (uiState.checkoutOpen) closeCheckout();
        else if (uiState.cartOpen) closeCart();
      }
    });
  }

  function resetFilters() {
    uiState.query = "";
    uiState.category = "all";
    uiState.sort = "relevance";
    uiState.minPrice = "";
    uiState.maxPrice = "";
    uiState.minRating = 0;
    uiState.inStockOnly = false;
    uiState.freeShipOnly = false;

    els.q.value = "";
    els.category.value = "all";
    els.sort.value = "relevance";
    els.minPrice.value = "";
    els.maxPrice.value = "";
    els.inStockOnly.checked = false;
    els.freeShipOnly.checked = false;
    setRatingSegmentActive(0);

    fetchAndRender();
  }

  function setRatingSegmentActive(val) {
    $$(".seg__btn").forEach(b => b.classList.toggle("is-active", Number(b.dataset.rating) === Number(val)));
  }

  // ---------------------------
  // Theme
  // ---------------------------
  function applyTheme() {
    document.documentElement.dataset.theme = uiState.theme;
    els.themeBtn.innerHTML = uiState.theme === "dark"
      ? '<span aria-hidden="true">☾</span>'
      : '<span aria-hidden="true">☀</span>';
  }

  // ---------------------------
  // Server fetch + render
  // ---------------------------
  async function fetchAndRender({ force = false } = {}) {
    try {
      setServerState("loading");
      setServerBadge("Server: Loading…");
      setUIBadge("UI: Rendering…");

      const params = {
        q: uiState.query,
        category: uiState.category,
        sort: uiState.sort,
        minPrice: uiState.minPrice,
        maxPrice: uiState.maxPrice,
        minRating: uiState.minRating,
        inStockOnly: uiState.inStockOnly,
        freeShipOnly: uiState.freeShipOnly,
      };

      const key = normalizeQueryKey(params);
      if (force) apiCache.delete(key);

      serverState.lastQueryKey = key;

      const res = await mockFetchProducts(params);

      serverState.products = res.products;
      serverState.lastLatencyMs = res.latencyMs;
      serverState.status = "success";
      serverState.error = null;

      setServerBadge(`Server: ${res.fromCache ? "Cached" : "Fresh"} ✓`);
      setUIBadge("UI: Ready");

      renderProducts();
      renderMeta(res.total, res.latencyMs);
    } catch (err) {
      serverState.status = "error";
      serverState.error = err?.message || "Unknown error";
      setServerBadge("Server: Error");
      setUIBadge("UI: Retry");
      renderProducts([]); // clear
      renderMeta(0, 0);
    }
  }

  function setServerState(s) {
    serverState.status = s;
  }

  function setServerBadge(text) {
    els.serverBadge.textContent = text;
  }
  function setUIBadge(text) {
    els.uiBadge.textContent = text;
  }

  function renderMeta(count, latencyMs) {
    els.countText.textContent = `${count} item${count === 1 ? "" : "s"}`;
    els.latencyText.textContent = `Latency ~${latencyMs}ms`;
    els.resultsHint.textContent = uiState.query
      ? `Searching for “${uiState.query}”`
      : "Browse products or use filters.";
  }

  function renderProducts() {
    const list = serverState.products || [];
    els.productGrid.innerHTML = "";

    if (!list.length) {
      els.emptyState.hidden = false;
      return;
    }
    els.emptyState.hidden = true;

    for (const p of list) {
      const card = document.createElement("article");
      card.className = "card";

      const tags = [];
      if (!p.inStock) tags.push(`<span class="tag tag--out">Out of stock</span>`);
      else if (p.stockLevel === "low") tags.push(`<span class="tag tag--low">Low stock</span>`);
      else tags.push(`<span class="tag tag--stock">In stock</span>`);
      if (p.freeShip) tags.push(`<span class="tag">Free ship</span>`);

      card.innerHTML = `
        <div class="card__media" aria-hidden="true">
          <div class="tagrow">${tags.join("")}</div>
        </div>
        <div class="card__body">
          <div class="card__title">${escapeHtml(p.title)}</div>
          <div class="card__desc">${escapeHtml(p.desc)}</div>
          <div class="card__meta">
            <span>${escapeHtml(p.category)} • ${p.rating.toFixed(1)}★</span>
            <span class="price">${fmtINR(p.price)}</span>
          </div>
          <div class="card__actions">
            <button class="btn btn--mini" data-act="details" data-id="${p.id}" type="button">Quick view</button>
            <button class="btn btn--mini btn--primary" data-act="add" data-id="${p.id}" type="button" ${p.inStock ? "" : "disabled"}>
              ${p.inStock ? "Add to cart" : "Unavailable"}
            </button>
          </div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        if (act === "add") addToCart(id, 1);
        if (act === "details") quickView(id);
      });

      els.productGrid.appendChild(card);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function quickView(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;

    const status = p.inStock ? (p.stockLevel === "low" ? "Low stock" : "In stock") : "Out of stock";
    const msg =
      `${p.title}\n\n` +
      `Category: ${p.category}\n` +
      `Price: ${fmtINR(p.price)}\n` +
      `Rating: ${p.rating.toFixed(1)}★\n` +
      `Shipping: ${p.freeShip ? "Free" : "Standard"}\n` +
      `Status: ${status}\n\n` +
      `${p.desc}`;

    alert(msg);
  }

  // ---------------------------
  // Cart actions
  // ---------------------------
  function addToCart(productId, qty = 1) {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p || !p.inStock) return;

    const current = cartState.items[productId]?.qty || 0;
    cartState.items[productId] = { qty: clamp(current + qty, 1, 99) };
    saveCart();
    syncCartUI();
    if (!uiState.cartOpen) openCart();
  }

  function removeFromCart(productId) {
    delete cartState.items[productId];
    saveCart();
    syncCartUI();
  }

  function setQty(productId, nextQty) {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;

    if (nextQty <= 0) {
      removeFromCart(productId);
      return;
    }
    cartState.items[productId] = { qty: clamp(nextQty, 1, 99) };
    saveCart();
    syncCartUI();
  }

  function syncCartUI() {
    els.cartCount.textContent = String(cartCount());
    renderCartList();
    renderTotals();
  }

  function renderCartList() {
    const entries = Object.entries(cartState.items);
    els.cartList.innerHTML = "";

    if (!entries.length) {
      els.cartEmpty.hidden = false;
      els.checkoutBtn.disabled = true;
      return;
    }

    els.cartEmpty.hidden = true;
    els.checkoutBtn.disabled = false;

    for (const [pid, { qty }] of entries) {
      const p = PRODUCTS.find(x => x.id === pid);
      if (!p) continue;

      const row = document.createElement("div");
      row.className = "cartitem";

      row.innerHTML = `
        <div>
          <div class="cartitem__title">${escapeHtml(p.title)}</div>
          <div class="cartitem__sub">${escapeHtml(p.category)} • ${fmtINR(p.price)} each</div>
        </div>
        <div class="cartitem__right">
          <div class="qty" aria-label="Quantity">
            <button type="button" data-act="dec" aria-label="Decrease quantity">−</button>
            <span>${qty}</span>
            <button type="button" data-act="inc" aria-label="Increase quantity">+</button>
          </div>
          <button class="linkbtn" type="button" data-act="remove">Remove</button>
        </div>
      `;

      row.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === "inc") setQty(pid, qty + 1);
        if (act === "dec") setQty(pid, qty - 1);
        if (act === "remove") removeFromCart(pid);
      });

      els.cartList.appendChild(row);
    }
  }

  function renderTotals() {
    const subtotal = cartSubtotal();
    const ship = shippingCost(subtotal);
    const total = subtotal + ship;

    els.subtotalText.textContent = fmtINR(subtotal);
    els.shippingText.textContent = fmtINR(ship);
    els.totalText.textContent = fmtINR(total);
  }

  // ---------------------------
  // Drawer open/close
  // ---------------------------
  function openCart() {
    uiState.cartOpen = true;
    els.cartDrawer.hidden = false;
    document.body.style.overflow = "hidden";
    els.closeCartBtn.focus();
  }

  function closeCart() {
    uiState.cartOpen = false;
    els.cartDrawer.hidden = true;
    document.body.style.overflow = "";
    els.openCartBtn.focus();
  }

  // ---------------------------
  // Checkout open/close + security tokens
  // ---------------------------
  function openCheckout() {
    uiState.checkoutOpen = true;
    els.checkoutModal.hidden = false;
    document.body.style.overflow = "hidden";

    // generate demo security tokens
    const csrf = `csrf_${tinyHash(uuid())}_${tinyHash(String(Date.now()))}`;
    const idem = `idem_${uuid()}`;

    els.csrfText.textContent = csrf;
    els.idemText.textContent = idem;

    // reset errors/toast
    clearErrors();
    hideToast();

    // focus
    $("#fullName").focus();
  }

  function closeCheckout() {
    uiState.checkoutOpen = false;
    els.checkoutModal.hidden = true;
    document.body.style.overflow = "";
    if (!els.cartDrawer.hidden) els.closeCartBtn.focus();
    else els.openCartBtn.focus();
  }

  // ---------------------------
  // Secure checkout submission (demo)
  // - Validate inputs
  // - Idempotency key ensures repeated submit doesn't duplicate
  // - CSRF token required
  // - payload hashing (demo)
  // ---------------------------
  const orderIdemMemory = new Set();

  async function onCheckoutSubmit(e) {
    e.preventDefault();
    if (uiState.submitting) return;

    clearErrors();

    const form = new FormData(els.checkoutForm);
    const payload = {
      fullName: String(form.get("fullName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      address: String(form.get("address") || "").trim(),
      pincode: String(form.get("pincode") || "").trim(),
      payment: String(form.get("payment") || "").trim(),
      cart: cartSnapshot(),
      totals: {
        subtotal: cartSubtotal(),
        shipping: shippingCost(cartSubtotal()),
        total: cartSubtotal() + shippingCost(cartSubtotal()),
      },
      csrf: els.csrfText.textContent,
      idempotencyKey: els.idemText.textContent,
      clientHash: "", // filled below
    };

    const errs = validateCheckout(payload);
    if (Object.keys(errs).length) {
      showErrors(errs);
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    // idempotency guard (client-side demo)
    if (orderIdemMemory.has(payload.idempotencyKey)) {
      showToast("Order already submitted (idempotent).", "ok");
      return;
    }

    // payload hash (demo integrity marker)
    payload.clientHash = tinyHash(JSON.stringify({
      ...payload,
      csrf: "hidden",
      idempotencyKey: "hidden",
      cart: payload.cart
    }));

    uiState.submitting = true;
    els.placeOrderBtn.disabled = true;
    els.placeOrderBtn.textContent = "Placing order…";

    try {
      // mock POST /checkout
      const res = await mockCheckoutPOST(payload);
      orderIdemMemory.add(payload.idempotencyKey);

      // success: clear cart
      cartState.items = {};
      saveCart();
      syncCartUI();

      showToast(`Order placed! Receipt: ${res.receiptId}`, "ok");

      // close after short delay
      await sleep(700);
      closeCheckout();
      closeCart();
    } catch (err) {
      showToast(err?.message || "Checkout failed. Try again.", "error");
    } finally {
      uiState.submitting = false;
      els.placeOrderBtn.disabled = false;
      els.placeOrderBtn.textContent = "Place Order";
    }
  }

  function cartSnapshot() {
    return Object.entries(cartState.items).map(([pid, { qty }]) => {
      const p = PRODUCTS.find(x => x.id === pid);
      return {
        id: pid,
        title: p?.title || "Unknown",
        price: p?.price || 0,
        qty
      };
    });
  }

  function validateCheckout(p) {
    const errs = {};

    if (p.fullName.length < 3) errs.fullName = "Enter your full name (min 3 chars).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errs.email = "Enter a valid email address.";

    const digits = p.phone.replace(/\D/g, "");
    if (digits.length !== 10) errs.phone = "Phone must be 10 digits.";

    if (p.address.length < 8) errs.address = "Address looks too short.";
    if (!/^\d{6}$/.test(p.pincode)) errs.pincode = "Pincode must be 6 digits.";

    if (!["card", "upi", "cod"].includes(p.payment)) errs.payment = "Select a payment method.";

    if (!p.csrf || !p.csrf.startsWith("csrf_")) errs.payment = "Missing CSRF token (demo).";
    if (!p.idempotencyKey || !p.idempotencyKey.startsWith("idem_")) errs.payment = "Missing idempotency key (demo).";

    if (!p.cart.length) errs.fullName = "Cart is empty.";
    return errs;
  }

  async function mockCheckoutPOST(payload) {
    // simulate server validation
    await sleep(450 + Math.random() * 350);

    // server-side style checks
    if (!payload.csrf?.startsWith("csrf_")) throw new Error("Security token invalid.");
    if (payload.cart.length === 0) throw new Error("Cart is empty.");
    if (payload.totals.total <= 0) throw new Error("Total must be > 0.");

    // simulate occasional failure
    if (Math.random() < 0.06) throw new Error("Payment gateway timeout (demo).");

    // return receipt
    return { ok: true, receiptId: `TITAN-${tinyHash(uuid()).toUpperCase()}` };
  }

  function clearErrors() {
    $$("[data-err]").forEach(el => (el.textContent = ""));
  }

  function showErrors(errs) {
    for (const [k, msg] of Object.entries(errs)) {
      const el = $(`[data-err="${k}"]`);
      if (el) el.textContent = msg;
    }
  }

  function showToast(msg, kind = "ok") {
    els.toast.hidden = false;
    els.toast.textContent = msg;
    // tweak bg using inline mix (no hardcoded colors)
    if (kind === "error") {
      els.toast.style.background = "color-mix(in oklab, var(--danger) 14%, var(--panel2))";
    } else {
      els.toast.style.background = "color-mix(in oklab, var(--ok) 12%, var(--panel2))";
    }
  }
  function hideToast() {
    els.toast.hidden = true;
    els.toast.textContent = "";
  }

  // ---------------------------
  // Boot
  // ---------------------------
  init();
})();