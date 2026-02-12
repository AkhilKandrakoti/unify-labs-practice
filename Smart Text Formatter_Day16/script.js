// ===============================
// Smart Text Formatter Functions
// ===============================

// 1️⃣ Title Case Formatter
const toTitleCase = (input) => {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// 2️⃣ Vowel Counter
const countVowels = (input) => {
  if (typeof input !== "string") return 0;
  const vowels = input.match(/[aeiouAEIOU]/g);
  return vowels ? vowels.length : 0;
};

// 3️⃣ Secret Message Generator
const secretMessage = (input, forbiddenWords = []) => {
  if (typeof input !== "string") return "";
  if (!Array.isArray(forbiddenWords)) forbiddenWords = [];

  let output = input;
  forbiddenWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    output = output.replace(regex, "***");
  });

  return output;
};

// 4️⃣ Text Statistics
const textStats = (input) => {
  if (typeof input !== "string") return {};
  const trimmedInput = input.trim();
  const wordArray = trimmedInput.split(/\s+/).filter(Boolean);
  const wordCount = wordArray.length;
  const charCount = trimmedInput.replace(/\s+/g, '').length;
  const avgWordLength = wordCount === 0 ? 0 : (charCount / wordCount).toFixed(2);

  return { wordCount, charCount, avgWordLength };
};

// ===============================
// User Interaction
// ===============================
function formatText() {
  const input = document.getElementById("userInput").value;
  const forbiddenInput = document.getElementById("forbiddenWords").value;
  const forbiddenWords = forbiddenInput.split(",").map(word => word.trim()).filter(Boolean);

  // Display results
  document.getElementById("titleCase").textContent = toTitleCase(input);
  document.getElementById("vowelCount").textContent = countVowels(input);
  document.getElementById("secretMessage").textContent = secretMessage(input, forbiddenWords);

  const stats = textStats(input);
  document.getElementById("wordCount").textContent = stats.wordCount;
  document.getElementById("charCount").textContent = stats.charCount;
  document.getElementById("avgWordLength").textContent = stats.avgWordLength;
}

function resetText() {
  document.getElementById("userInput").value = "";
  document.getElementById("forbiddenWords").value = "";
  document.getElementById("titleCase").textContent = "";
  document.getElementById("vowelCount").textContent = "";
  document.getElementById("secretMessage").textContent = "";
  document.getElementById("wordCount").textContent = "";
  document.getElementById("charCount").textContent = "";
  document.getElementById("avgWordLength").textContent = "";
}