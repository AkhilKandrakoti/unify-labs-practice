/* Day 20 Playground:
   Covers:
   - setTimeout & setInterval
   - Callbacks
   - Promises
   - Async/Await
   - Fetching Data From APIs
   - Error Handling: try/catch
   - Call Stack & Event Loop (microtask vs macrotask)
   - Hoisting & Temporal Dead Zone (TDZ)
   - Scope Chains & Closures
*/

const consoleEl = document.getElementById("console");
const topicsEl = document.getElementById("topics");
const btnClear = document.getElementById("btnClear");
const btnCopy = document.getElementById("btnCopy");
const btnRandom = document.getElementById("btnRandom");

function log(...args) {
  const msg = args.map(a => (typeof a === "string" ? a : JSON.stringify(a, null, 2))).join(" ");
  consoleEl.textContent += msg + "\n";
  // Also to devtools:
  console.log(...args);
}

function divider(title) {
  log("\n" + "═".repeat(60));
  log("▶ " + title);
  log("═".repeat(60));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ---------------------- DEMOS ---------------------- */

async function demoTimers() {
  divider("Timers: setTimeout & setInterval (plus clearInterval)");
  log("Scheduling a setTimeout(800ms) and an interval every 500ms (3 times).");

  setTimeout(() => {
    log("[setTimeout] Fired after ~800ms.");
  }, 800);

  let count = 0;
  const id = setInterval(() => {
    count++;
    log(`[setInterval] Tick ${count}`);
    if (count === 3) {
      clearInterval(id);
      log("[setInterval] Cleared after 3 ticks.");
    }
  }, 500);

  log("Meanwhile, JS continues (timers wait in the background).");
}

function demoCallbacks() {
  divider("Introduction to Callbacks");
  log("A callback is a function passed into another function to be called later.");

  function fakeDownload(fileName, cb) {
    log(`Starting download: ${fileName} ...`);
    setTimeout(() => {
      const result = { fileName, sizeKB: Math.floor(Math.random() * 900 + 100) };
      cb(null, result); // Node-style: (err, data)
    }, 700);
  }

  fakeDownload("notes.pdf", (err, data) => {
    if (err) return log("Download failed:", err);
    log("Download finished! Callback received:", data);
  });

  log("Callback scheduled. Main code continues now.");
}

function demoPromises() {
  divider("Promises Made Simple (then/catch/finally)");
  log("Promise = a value that will be available in the future (or fail).");

  function getUserId() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(101), 500);
    });
  }

  function getUserProfile(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (id === 101) resolve({ id, name: "Akhil", role: "Student" });
        else reject(new Error("User not found"));
      }, 600);
    });
  }

  getUserId()
    .then((id) => {
      log("Got userId:", id);
      return getUserProfile(id);
    })
    .then((profile) => {
      log("Got profile:", profile);
    })
    .catch((err) => {
      log("Promise error:", err.message);
    })
    .finally(() => {
      log("Promise chain finished (finally).");
    });

  log("Promise chain started; it runs asynchronously.");
}

async function demoAsyncAwait() {
  divider("Async & Await Explained");
  log("async/await is just a cleaner way to write Promises.");

  function fetchNumber() {
    return new Promise((resolve) => setTimeout(() => resolve(42), 500));
  }

  try {
    log("Waiting for number...");
    const n = await fetchNumber();
    log("Received:", n);
    log("Now we can use it like normal code:", n * 2);
  } catch (e) {
    log("Error caught in async/await:", e.message);
  }
}

async function demoFetchAPI() {
  divider("Fetching Data From APIs (fetch + async/await + try/catch)");
  log("Using a public test API: jsonplaceholder.typicode.com");

  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/todos/1");

    // Handle HTTP errors (fetch only rejects on network errors by default)
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    log("Fetched TODO:", data);

    log("Now fetch a list (first 3 posts)...");
    const res2 = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
    if (!res2.ok) throw new Error(`HTTP Error: ${res2.status}`);
    const posts = await res2.json();

    posts.forEach((p, i) => log(`Post ${i + 1}: (${p.id}) ${p.title}`));
  } catch (err) {
    log("Fetch failed:", err.message);
    log("Tip: If you're offline, fetch will fail (network error).");
  }
}

function demoTryCatch() {
  divider("Error Handling: try/catch (sync) + throwing errors");
  try {
    log("About to parse invalid JSON...");
    JSON.parse("{ bad json }");
    log("You won't see this line.");
  } catch (err) {
    log("Caught error:", err.name, "-", err.message);
  }

  try {
    log("Manually throwing an error...");
    throw new Error("Custom error example");
  } catch (err) {
    log("Caught custom error:", err.message);
  }
}

function demoEventLoop() {
  divider("Call Stack & Event Loop (microtasks vs macrotasks)");
  log("Order to remember:");
  log("1) Synchronous code (call stack)");
  log("2) Microtasks (Promise.then / queueMicrotask)");
  log("3) Macrotasks (setTimeout / setInterval)");

  log("A) Sync: start");

  setTimeout(() => {
    log("D) setTimeout callback (macrotask)");
  }, 0);

  Promise.resolve().then(() => {
    log("C) Promise.then (microtask)");
  });

  log("B) Sync: end");

  log("Expected order: A, B, C, D");
}

function demoHoistingTDZ() {
  divider("Hoisting & Temporal Dead Zone (TDZ)");
  log("Hoisting means declarations are processed before code runs (but behavior differs).");

  // var is hoisted and initialized as undefined:
  log("varHoisted before declaration =", varHoisted);
  var varHoisted = "I am var";
  log("varHoisted after declaration =", varHoisted);

  log("\nNow: let/const have TDZ (they exist but cannot be accessed before init).");
  log("We will demonstrate TDZ safely using eval so the app doesn't crash.");

  try {
    eval(`
      console.log(letValueBefore); // ReferenceError due to TDZ
      let letValueBefore = 10;
      console.log(letValueBefore);
    `);
  } catch (e) {
    log("TDZ error caught:", e.name, "-", e.message);
  }

  log("Key point: let/const are hoisted, but not initialized until their line executes.");
}

function demoScopeClosures() {
  divider("Scope Chain & Closures");
  log("Closure = inner function remembers variables from outer function.");

  function makeCounter(start = 0) {
    let count = start; // private variable
    return function () {
      count++;
      return count;
    };
  }

  const c1 = makeCounter(0);
  const c2 = makeCounter(10);

  log("c1():", c1());
  log("c1():", c1());
  log("c2():", c2());
  log("c2():", c2());

  log("\nWhy it matters: closures help create private state (no global pollution).");

  log("\nAlso showing scope chain:");
  const outer = "outerValue";
  function parent() {
    const parentVal = "parentValue";
    function child() {
      log("child can access:", outer, "and", parentVal);
    }
    child();
  }
  parent();
}

/* ---------------------- TOPIC SETUP ---------------------- */

const TOPICS = [
  { key: "timers", title: "Timers: setInterval & setTimeout", run: demoTimers, tag: "API" },
  { key: "callbacks", title: "Introduction to Callbacks", run: demoCallbacks, tag: "Async" },
  { key: "promises", title: "Promises Made Simple", run: demoPromises, tag: "Async" },
  { key: "asyncawait", title: "Async and Await Explained", run: demoAsyncAwait, tag: "Async" },
  { key: "fetch", title: "Fetching Data From APIs", run: demoFetchAPI, tag: "API" },
  { key: "trycatch", title: "Error Handling: Try Catch", run: demoTryCatch, tag: "Basics" },
  { key: "eventloop", title: "The Call Stack & Event Loop", run: demoEventLoop, tag: "Core" },
  { key: "hoisting", title: "Hoisting & Temporal Dead Zone", run: demoHoistingTDZ, tag: "Core" },
  { key: "closures", title: "Scope Chain & Closures", run: demoScopeClosures, tag: "Core" },
];

function renderTopics() {
  topicsEl.innerHTML = "";
  TOPICS.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "topic";
    btn.type = "button";
    btn.innerHTML = `<b>${t.title}</b><span class="badge">${t.tag}</span>`;
    btn.addEventListener("click", () => runTopic(t));
    topicsEl.appendChild(btn);
  });
}

async function runTopic(topic) {
  // Clear a little spacing, keep old logs if user wants. (They can press Clear)
  divider(`Running: ${topic.title}`);
  await topic.run();
}

function pickRandomTopic() {
  const idx = Math.floor(Math.random() * TOPICS.length);
  return TOPICS[idx];
}

/* ---------------------- UI ACTIONS ---------------------- */

btnClear.addEventListener("click", () => {
  consoleEl.textContent = "";
  log("Console cleared.");
});

btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(consoleEl.textContent);
    log("✅ Copied console text to clipboard.");
  } catch (e) {
    log("❌ Copy failed:", e.message);
  }
});

btnRandom.addEventListener("click", async () => {
  const t = pickRandomTopic();
  await runTopic(t);
});

/* ---------------------- BOOT ---------------------- */

renderTopics();

// Auto-run ONE random topic on page load
(async function boot() {
  log("Welcome Akhi 👋");
  log("Auto-running a random topic demo now...");
  await sleep(200);
  const t = pickRandomTopic();
  await runTopic(t);
  log("\nNow click any topic to run more demos.");
})();