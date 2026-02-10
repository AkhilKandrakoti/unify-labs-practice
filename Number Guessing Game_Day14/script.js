// ===== Strict Number Guessing Logic for Browser =====
const maxAttempts = 10;
let randomNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

// DOM Elements
const submitBtn = document.getElementById('submitGuess');
const userInput = document.getElementById('userGuess');
const feedback = document.getElementById('feedback');
const attemptsDisplay = document.getElementById('attempts');
const restartBtn = document.getElementById('restartBtn');

submitBtn.addEventListener('click', () => {
    const guess = Number(userInput.value);

    if (!guess || guess < 1 || guess > 100) {
        feedback.textContent = '⚠️ Enter a valid number between 1-100!';
        return;
    }

    attempts++;

    if (guess === randomNumber) {
        feedback.textContent = `🎉 Congratulations! You guessed it in ${attempts} attempt(s)!`;
        endGame();
    } else if (attempts >= maxAttempts) {
        feedback.textContent = `💀 Game Over! The number was ${randomNumber}.`;
        endGame();
    } else if (guess > randomNumber) {
        feedback.textContent = '⬆️ Too High! Try again!';
    } else {
        feedback.textContent = '⬇️ Too Low! Try again!';
    }

    attemptsDisplay.textContent = `Attempts: ${attempts} / ${maxAttempts}`;
    userInput.value = '';
    userInput.focus();
});

restartBtn.addEventListener('click', () => {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    feedback.textContent = '';
    attemptsDisplay.textContent = '';
    userInput.value = '';
    restartBtn.classList.add('hidden');
    submitBtn.disabled = false;
});

function endGame() {
    submitBtn.disabled = true;
    restartBtn.classList.remove('hidden');
}