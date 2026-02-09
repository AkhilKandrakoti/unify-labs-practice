// =======================================
// FOUNDATION DEMO (REQUIREMENT SECTION)
// =======================================

let a = 10;
let b = 3;

const sum = a + b;
const product = a * b;
const remainder = a % b;

console.log("Sum:", sum, "Type:", typeof sum);
console.log("Product:", product, "Type:", typeof product);
console.log("Remainder:", remainder, "Type:", typeof remainder);

const userName = "Akhil";
const welcomeText =
  "Welcome to the Logic Foundation Project, " + userName + "!";

console.log(welcomeText, "Type:", typeof welcomeText);

document.getElementById("welcomeMessage").textContent = welcomeText;

// =======================================
// CALCULATOR UTILITY
// =======================================

document.getElementById("calcBtn").onclick = function () {
  let number1 = Number(document.getElementById("num1").value);
  let number2 = Number(document.getElementById("num2").value);

  let uiSum = number1 + number2;
  let uiProduct = number1 * number2;
  let uiRemainder = number2 !== 0 ? number1 % number2 : "Undefined";

  console.log("UI Sum:", uiSum, "Type:", typeof uiSum);
  console.log("UI Product:", uiProduct, "Type:", typeof uiProduct);
  console.log("UI Remainder:", uiRemainder, "Type:", typeof uiRemainder);

  const resultBox = document.getElementById("calcResult");
  resultBox.innerHTML =
    "Sum: " + uiSum + "<br>" +
    "Product: " + uiProduct + "<br>" +
    "Remainder: " + uiRemainder;

  resultBox.style.animation = "none";
  resultBox.offsetHeight;
  resultBox.style.animation = "pop 0.4s ease";
};

// =======================================
// MAGIC 8-BALL UTILITY (SHAKE EFFECT)
// =======================================

document.getElementById("magicBtn").onclick = function () {
  let randomNumber = Math.floor(Math.random() * 3);
  let message;

  if (randomNumber === 0) {
    message = "Yes, definitely!";
  } else if (randomNumber === 1) {
    message = "Try again later.";
  } else {
    message = "Not likely right now.";
  }

  console.log("Magic 8-Ball Message:", message, "Type:", typeof message);

  const prediction = document.getElementById("predictionText");
  prediction.textContent = message;
};