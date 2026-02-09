// VARIABLES (let, const, var)
const companyName = "Unify Labs";
let innovationScore = 95;
var isEnterpriseReady = true;

// DATA TYPES
let clients = 120;            // number
let projects = 340;           // number
let years = 8;                // number
let slogan = "Innovate. Build. Scale."; // string

// typeof operator
console.log(typeof companyName);
console.log(typeof innovationScore);
console.log(typeof isEnterpriseReady);

// PLUS OPERATOR (string + number)
document.getElementById("aboutText").textContent =
  companyName + " has delivered " + projects + " successful solutions worldwide.";

// ARITHMETIC OPERATORS
let growthRate = (projects / years).toFixed(0);

// COMPARISON OPERATORS
let trustMessage =
  innovationScore > 90 && isEnterpriseReady === true
    ? "Trusted by global enterprises."
    : "Growing startup with strong foundations.";

document.getElementById("contactMsg").textContent = trustMessage;

// STATS COUNTER LOGIC
function animateValue(id, value) {
  let count = 0;

  const interval = setInterval(() => {
    count++;

    document.getElementById(id).textContent = count;

    if (count == value) {
      clearInterval(interval);
    }
  }, 20);
}

// BUTTON INTERACTION
document.getElementById("ctaBtn").onclick = function () {
  alert(
    companyName + " averages " + growthRate + "+ projects per year."
  );
};

// RUN COUNTERS
animateValue("clients", clients);
animateValue("projects", projects);
animateValue("years", years);