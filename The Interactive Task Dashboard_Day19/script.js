const taskInput = document.getElementById("taskInput");
const addBtn = document.querySelector("#addBtn");
const taskList = document.getElementById("taskList");
const filterButtons = document.querySelectorAll(".filter-btn");
const taskCounter = document.getElementById("taskCounter");
const themeToggle = document.getElementById("themeToggle");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// Save to LocalStorage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Render Tasks
function renderTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks.filter(task => {
        if (currentFilter === "completed") return task.completed;
        if (currentFilter === "pending") return !task.completed;
        return true;
    });

    filteredTasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.textContent = task.text;

        if (task.completed) li.classList.add("completed");

        li.addEventListener("click", () => {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");

        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        });

        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });

    updateCounter();
}

// Update Counter
function updateCounter() {
    taskCounter.textContent = `${tasks.length} Tasks`;
}

// Add Task
addBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    if (!text) return alert("Enter a task!");

    tasks.push({ text, completed: false });
    taskInput.value = "";
    saveTasks();
    renderTasks();
});

// Enter key support
taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addBtn.click();
});

// Filters
filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".active").classList.remove("active");
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// Theme toggle
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

renderTasks();