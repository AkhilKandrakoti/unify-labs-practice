const log = document.getElementById("log");
const input = document.getElementById("input");
const terminal = document.getElementById("terminal");
const bootScreen = document.getElementById("boot-screen");
const progress = document.querySelector(".boot-progress");

/* ================= STATE ================= */
let state = "BOOT";
let attempts = 0;
let balance = 1000;

const MASTER_PIN = "1221";
const UNIT_PRICE = 50;
const SECRET_WORD = "echo";

/* ================= TYPE ENGINE ================= */
function type(text, cls = "system") {
  let i = 0;
  const line = document.createElement("div");
  line.className = cls;
  log.appendChild(line);

  const timer = setInterval(() => {
    line.textContent += text[i];
    i++;
    log.scrollTop = log.scrollHeight;
    if (i >= text.length) clearInterval(timer);
  }, 22);
}

/* ================= BOOT ================= */
let load = 0;
const bootSeq = setInterval(() => {
  load += Math.floor(Math.random() * 10) + 6;
  if (load >= 100) {
    load = 100;
    clearInterval(bootSeq);
    bootScreen.style.display = "none";
    terminal.style.display = "flex";
    boot();
  }
  progress.style.width = load + "%";
}, 280);

function boot() {
  type("Initializing Virtual Core...");
  type("Loading Security Protocol...");
  type("Enter MASTER PIN:");
  state = "AUTH";
}

/* ================= AUTH ================= */
function authenticate(pin) {
  if (pin === MASTER_PIN) {
    type("ACCESS GRANTED");
    type("==============================");
    type(" WELCOME TO VIRTUAL CORE v1.0 ");
    type("==============================");
    type("Commands: bank | shop | vault | exit");
    state = "KERNEL";
  } else {
    attempts++;
    type("INVALID PIN", "red-alert");
    if (attempts >= 3) {
      type("💥 SYSTEM SELF-DESTRUCT INITIATED 💥", "red-alert");
      input.disabled = true;
    }
  }
}

/* ================= KERNEL ================= */
function kernel(cmd) {
  switch (cmd) {
    case "bank":
      state = "BANK";
      type("Bank Commands: deposit | withdraw | balance | back");
      break;
    case "shop":
      state = "SHOP";
      type("Enter quantity to purchase:");
      break;
    case "vault":
      state = "VAULT";
      type("Vault Hint: It repeats what you say.");
      type("Enter secret word:");
      break;
    case "exit":
      type("System shutting down...");
      input.disabled = true;
      break;
    default:
      type("UNKNOWN COMMAND");
  }
}

/* ================= BANK ================= */
function bank(cmd) {
  if (cmd === "deposit") {
    state = "DEPOSIT";
    type("Enter deposit amount:");
  } else if (cmd === "withdraw") {
    state = "WITHDRAW";
    type("Enter withdrawal amount:");
  } else if (cmd === "balance") {
    type(`💰 Balance: ₹${balance}`);
  } else if (cmd === "back") {
    state = "KERNEL";
    type("Commands: bank | shop | vault | exit");
  } else {
    type("INVALID BANK COMMAND");
  }
}

/* ================= SHOP ================= */
function shop(q) {
  const qty = parseInt(q);
  if (isNaN(qty) || qty <= 0) {
    type("INVALID QUANTITY");
    state = "KERNEL";
    return;
  }

  let discount = qty >= 11 ? 0.2 : qty >= 6 ? 0.1 : 0;
  const total = qty * UNIT_PRICE * (1 - discount);

  if (total > balance) {
    type("INSUFFICIENT FUNDS", "red-alert");
    state = "KERNEL";
    return;
  }

  balance -= total;
  type(`Purchased ${qty} items`);
  type(`Final Cost: ₹${total}`);
  type(`Remaining Balance: ₹${balance}`);
  state = "KERNEL";
}

/* ================= VAULT ================= */
function vault(word) {
  if (word === SECRET_WORD) {
    type("🔓 VAULT UNLOCKED");
    type("🎁 SECRET MESSAGE: YOU FOUND THE CORE");
  } else {
    type("ACCESS DENIED — RETURNING TO MAIN MENU");
  }
  state = "KERNEL";
}

/* ================= INPUT ================= */
input.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const cmd = input.value.trim().toLowerCase();
  input.value = "";
  if (!cmd) return;

  if (state === "AUTH") authenticate(cmd);
  else if (state === "KERNEL") kernel(cmd);
  else if (state === "BANK") bank(cmd);
  else if (state === "DEPOSIT") {
    const amt = parseFloat(cmd);
    if (!isNaN(amt) && amt > 0) {
      balance += amt;
      type(`Deposited ₹${amt}. Balance: ₹${balance}`);
    } else type("INVALID AMOUNT");
    state = "BANK";
  }
  else if (state === "WITHDRAW") {
    const amt = parseFloat(cmd);
    if (amt > balance) type("INSUFFICIENT FUNDS", "red-alert");
    else if (amt > 0) {
      balance -= amt;
      type(`Withdrawn ₹${amt}. Balance: ₹${balance}`);
    } else type("INVALID AMOUNT");
    state = "BANK";
  }
  else if (state === "SHOP") shop(cmd);
  else if (state === "VAULT") vault(cmd);
});