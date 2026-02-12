// ===============================
// JS Fun Toolkit Functions
// ===============================

// Arrow function to count vowels
const countVowels = (str) => {
  const matches = str.match(/[aeiouAEIOU]/g);
  return matches ? matches.length : 0;
};

// Arrow function to reverse string
const reverseString = (str) => str.split('').reverse().join('');

// Arrow function to toggle case
const toggleCase = (str) => {
  return str === str.toUpperCase() ? str.toLowerCase() : str.toUpperCase();
};

// Function to generate a random number up to max (default param)
const randomNumber = (max = 100) => Math.floor(Math.random() * max) + 1;

// Main function: uses scopes, template literals, escape characters
function processText() {
  const input = document.getElementById('userInput').value.trim();
  
  if (!input) {
    alert("Please enter some text!");
    return;
  }

  // Using template literals and escape characters
  document.getElementById('charCount').textContent = `📏 Total Characters: ${input.length}`;
  document.getElementById('vowelCount').textContent = `🔤 Total Vowels: ${countVowels(input)}`;
  document.getElementById('reverseString').textContent = `🔄 Reversed String: "${reverseString(input)}"`;
  document.getElementById('upperLower').textContent = `🔠 Case Toggle: "${toggleCase(input)}"`;
  document.getElementById('randomNumber').textContent = `🎲 Fun Random Number (1-${input.length}): ${randomNumber(input.length)}`;
}

// Reset function
function resetPage() {
  document.getElementById('userInput').value = '';
  document.getElementById('charCount').textContent = '';
  document.getElementById('vowelCount').textContent = '';
  document.getElementById('reverseString').textContent = '';
  document.getElementById('upperLower').textContent = '';
  document.getElementById('randomNumber').textContent = '';
}