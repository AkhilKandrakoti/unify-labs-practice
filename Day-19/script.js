const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const clearCompleted = document.getElementById("clearCompleted");
const themeToggle = document.getElementById("themeToggle");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateProgress() {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  progressBar.style.width = percent + "%";
  progressText.textContent = percent + "% Completed";
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    if (
      (currentFilter === "completed" && !task.completed) ||
      (currentFilter === "pending" && task.completed)
    ) return;

    const li = document.createElement("li");
    li.classList.add(`priority-${task.priority}`);
    if (task.completed) li.classList.add("completed");

    const today = new Date().toISOString().split("T")[0];
    if (task.dueDate && task.dueDate < today) {
      li.classList.add("overdue");
    }

    li.innerHTML = `
      <div>
        <strong>${task.text}</strong><br>
        <small>${task.category} | ${task.priority} | ${task.dueDate || "No Date"}</small>
      </div>
      <button class="delete-btn">Delete</button>
    `;

    li.addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });

    li.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    taskList.appendChild(li);
  });

  updateProgress();
}

addBtn.addEventListener("click", () => {
  if (!taskInput.value.trim()) return;

  const newTask = {
    text: taskInput.value,
    category: document.getElementById("category").value,
    priority: document.getElementById("priority").value,
    dueDate: document.getElementById("dueDate").value,
    completed: false
  };

  tasks.push(newTask);
  taskInput.value = "";
  saveTasks();
  renderTasks();
});

clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".filter-btn.active").classList.remove("active");
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

renderTasks();