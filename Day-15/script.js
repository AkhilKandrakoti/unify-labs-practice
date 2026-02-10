const input = document.getElementById("input");
const log = document.getElementById("log");

function print(text, cls = "system") {
  const line = document.createElement("div");
  line.className = cls;
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

input.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const command = input.value.trim().toLowerCase();
  input.value = "";

  if (!command) return;

  print("> " + command, "user");

  switch (command) {
    case "help":
      print("Available commands:");
      print("about  | balance | clear | exit");
      break;

    case "about":
      print("Virtual Core Practice Mode");
      print("A simplified terminal-based JS project.");
      break;

    case "balance":
      print("Current Balance: ₹1000");
      break;

    case "clear":
      log.innerHTML = "";
      break;

    case "exit":
      print("System shutting down...");
      input.disabled = true;
      break;

    default:
      print("Unknown command. Type 'help'");
  }
});