const TAX = 0.18;

let projects = JSON.parse(localStorage.getItem("projects")) || [
  {id:1,name:"AI Web App",status:"Completed",price:1200},
  {id:2,name:"Ecommerce Site",status:"Pending",price:800}
];

function saveData(){
  localStorage.setItem("projects",JSON.stringify(projects));
}

function processData(data){

  // 1️⃣ MAP → Add tax to each project
  const withTax = data.map(project => ({
    ...project,
    priceWithTax: project.price + project.price * TAX
  }));

  // 2️⃣ FILTER → Separate Completed and Pending
  const completed = withTax.filter(p => p.status === "Completed");
  const pending = withTax.filter(p => p.status === "Pending");

  // 3️⃣ REDUCE → Calculate totals
  const totalRevenue = withTax.reduce((acc, p) => acc + p.priceWithTax, 0);

  const averageRevenue = withTax.length
    ? totalRevenue / withTax.length
    : 0;

  // Update UI
  updateStats(
    withTax.length,
    completed.length,
    pending.length,
    totalRevenue,
    averageRevenue
  );

  renderTable(withTax);

  // 📊 Draw Graph (NEW - does not affect logic)
  drawChart(withTax);
}

function updateStats(total, completed, pending, revenue, average){
  document.getElementById("total").textContent = total;
  document.getElementById("completed").textContent = completed;
  document.getElementById("pending").textContent = pending;
  document.getElementById("revenue").textContent = "$" + revenue.toFixed(2);
  document.getElementById("average").textContent = "$" + average.toFixed(2);
}

function renderTable(data){
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.status}</td>
        <td>$${p.price}</td>
        <td>$${p.priceWithTax.toFixed(2)}</td>
        <td><button onclick="deleteProject(${p.id})">Delete</button></td>
      </tr>
    `;
  });
}

function addProject(){
  const name = document.getElementById("name").value;
  const price = parseFloat(document.getElementById("price").value);
  const status = document.getElementById("status").value;

  if(!name || !price) return;

  projects.push({
    id: Date.now(),
    name,
    price,
    status
  });

  saveData();
  processData(projects);
}

function deleteProject(id){
  projects = projects.filter(p => p.id !== id);
  saveData();
  processData(projects);
}

function filterTasks(type){
  if(type === "All"){
    processData(projects);
  } else {
    const filtered = projects.filter(p => p.status === type);
    processData(filtered);
  }
}

/* ==============================
   📊 GRAPH FUNCTION (NEW ONLY)
   ============================== */

function drawChart(data){
  const canvas = document.getElementById("revenueChart");
  if(!canvas) return; // Safety check

  const ctx = canvas.getContext("2d");

  // Clear previous graph
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = 60;
  const gap = 40;
  const maxHeight = 200;

  const maxValue = Math.max(...data.map(p => p.priceWithTax), 1);

  data.forEach((project, index) => {

    const scaledHeight = (project.priceWithTax / maxValue) * maxHeight;

    const x = index * (barWidth + gap) + 40;
    const y = canvas.height - scaledHeight - 30;

    // Draw Bar
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x, y, barWidth, scaledHeight);

    // Draw Project Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px sans-serif";
    ctx.fillText(project.name, x, canvas.height - 10);
  });
}

/* ============================== */

processData(projects);