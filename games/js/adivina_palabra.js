import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);


const wordDisplay = document.getElementById('wordDisplay');
const attemptsLeftDisplay = document.getElementById('attemptsLeft');
const hintDisplay = document.getElementById('hintDisplay');
const guessInput = document.getElementById('guessInput');
const guessBtn = document.getElementById('guessBtn');
const solveBtn = document.getElementById('solveBtn');
const messageDisplay = document.getElementById('messageDisplay');
const newGameBtn = document.getElementById('newGameBtn');
const backToGamesBtn = document.getElementById('backToGamesBtn');
const gameOverModal = document.getElementById('gameOverModal');
const modalMessage = document.getElementById('modalMessage');
const modalWordIs = document.getElementById('modalWordIs');
const playAgainModalBtn = document.getElementById('playAgainModalBtn');
const backToGamesModalBtn = document.getElementById('backToGamesModalBtn');
const closeModalBtn = document.querySelector('.close-button');


let currentWord = '';
let currentHint = '';
let guessedLetters = [];
let attemptsRemaining = 0;
const maxAttempts = 6; // Número máximo de intentos permitidos

const words = [
    { word: 'AMOR', hint: 'Sentimiento profundo de afecto.' },
    { word: 'CORAZON', hint: 'Símbolo universal del amor.' },
    { word: 'CITA', hint: 'Encuentro romántico.' },
    { word: 'BESO', hint: 'Expresión de afecto con los labios.' },
    { word: 'PAREJA', hint: 'Dos personas unidas sentimentalmente.' },
    { word: 'ABRAZO', hint: 'Gesto de cariño con los brazos.' },
    { word: 'ROMANCE', hint: 'Historia de amor o aventura amorosa.' },
    { word: 'FELICIDAD', hint: 'Estado de ánimo de completa dicha.' },
    { word: 'ALMagemelas', hint: 'Dos personas perfectamente compatibles.' },
    { word: 'COMPROMISO', hint: 'Acuerdo de unión a largo plazo.' },
    { word: 'FLORES', hint: 'Regalo clásico para expresar amor.' },
    { word: 'CANDADO', hint: 'Símbolo de amor eterno en puentes.' },
    { word: 'SANVALENTIN', hint: 'Día de los enamorados.' },
    { word: 'ENAMORADOS', hint: 'Personas que se aman.' },
    { word: 'CONFIANZA', hint: 'Base fundamental de toda relación.' },
    { word: 'COMUNICACION', hint: 'Clave para entenderse mutuamente.' },
    { word: 'AFECTO', hint: 'Demostración de cariño.' },
    { word: 'LEALTAD', hint: 'Fidelidad en la relación.' },
    { word: 'PASION', hint: 'Intenso entusiasmo o deseo.' },
    { word: 'MATRIMONIO', hint: 'Unión legal y formal de dos personas.' }
];

function initializeGame() {
    // Seleccionar una palabra y pista aleatoria
    const randomIndex = Math.floor(Math.random() * words.length);
    currentWord = words[randomIndex].word.toUpperCase();
    currentHint = words[randomIndex].hint;

    guessedLetters = [];
    attemptsRemaining = maxAttempts;
    messageDisplay.textContent = '';
    guessInput.value = '';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    solveBtn.disabled = false;
    newGameBtn.style.display = 'none';
    gameOverModal.style.display = 'none';

    updateDisplay();
}

function updateDisplay() {
    attemptsLeftDisplay.textContent = attemptsRemaining;
    hintDisplay.textContent = currentHint;

    wordDisplay.innerHTML = '';
    let displayWord = '';
    let allLettersGuessed = true;

    for (const letter of currentWord) {
        if (letter === ' ') {
            displayWord += '<span class="space">&nbsp;</span>'; // Manejar espacios
        } else if (guessedLetters.includes(letter)) {
            displayWord += `<span>${letter}</span>`;
        } else {
            displayWord += '<span>_</span>';
            allLettersGuessed = false; // Todavía hay letras por adivinar
        }
    }
    wordDisplay.innerHTML = displayWord;

    if (allLettersGuessed && attemptsRemaining > 0) {
        endGame(true); // Ganó el juego
    } else if (attemptsRemaining <= 0 && allLettersGuessed === false) {
        endGame(false); // Perdió el juego
    }
}

function handleGuess() {
    const guess = guessInput.value.toUpperCase().trim();
    guessInput.value = ''; // Limpiar el input

    if (!guess) {
        messageDisplay.textContent = 'Por favor, ingresa una letra o la palabra completa.';
        return;
    }

    if (guess.length === 1) { // Adivinó una letra
        if (guessedLetters.includes(guess)) {
            messageDisplay.textContent = `Ya adivinaste la letra "${guess}".`;
        } else if (currentWord.includes(guess)) {
            guessedLetters.push(guess);
            messageDisplay.textContent = `¡"${guess}" es correcto!`;
            updateDisplay();
        } else {
            attemptsRemaining--;
            messageDisplay.textContent = `"${guess}" no está en la palabra.`;
            updateDisplay();
        }
    } else if (guess.length > 1) { // Adivinó la palabra completa
        if (guess === currentWord) {
            guessedLetters = currentWord.split(''); // Mostrar todas las letras
            messageDisplay.textContent = `¡Correcto! ¡Adivinaste la palabra!`;
            endGame(true);
        } else {
            attemptsRemaining--;
            messageDisplay.textContent = `La palabra "${guess}" es incorrecta.`;
            updateDisplay();
        }
    }
}

function solveWord() {
    attemptsRemaining = 0; // Se pierden los intentos al revelar
    guessedLetters = currentWord.split(''); // Mostrar todas las letras
    endGame(false, true); // Perdió, pero se reveló la palabra
}

function endGame(win, revealed = false) {
    guessInput.disabled = true;
    guessBtn.disabled = true;
    solveBtn.disabled = true;
    newGameBtn.style.display = 'block';

    gameOverModal.style.display = 'flex';
    if (win) {
        modalMessage.textContent = '¡Felicidades! ¡Adivinaste la palabra!';
        modalWordIs.textContent = `La palabra era: "${currentWord}"`;
    } else if (revealed) {
        modalMessage.textContent = '¡Palabra revelada!';
        modalWordIs.textContent = `La palabra era: "${currentWord}". ¡Mejor suerte la próxima!`;
    }
    else {
        modalMessage.textContent = '¡Se acabaron los intentos!';
        modalWordIs.textContent = `La palabra era: "${currentWord}".`;
    }
}

// Event Listeners
guessBtn.addEventListener('click', handleGuess);
solveBtn.addEventListener('click', solveWord);
newGameBtn.addEventListener('click', initializeGame);
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleGuess();
    }
});

backToGamesBtn.addEventListener('click', () => {
    window.location.href = '../mini_juegos.html';
});

playAgainModalBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    initializeGame();
});

backToGamesModalBtn.addEventListener('click', () => {
    window.location.href = '../mini_juegos.html';
});

closeModalBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
});

// --- Cerrar Sesión (desde el banner) ---
document.getElementById('signOut').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión: ' + error.message);
    } else {
        window.location.href = '../login.html'; // Redirigir a la página de login (ajusta la ruta si es necesario)
    }
});

// Inicializar el juego al cargar la página
initializeGame();