import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

const gameBoard = document.getElementById('gameBoard');
const attemptsDisplay = document.getElementById('attempts');
const timerDisplay = document.getElementById('timer');
const startGameBtn = document.getElementById('startGameBtn');
const resetGameBtn = document.getElementById('resetGameBtn');
const backToGamesBtn = document.getElementById('backToGamesBtn');
const gameOverModal = document.getElementById('gameOverModal');
const modalMessage = document.getElementById('modalMessage');
const modalScore = document.getElementById('modalScore');
const playAgainModalBtn = document.getElementById('playAgainModalBtn');
const backToGamesModalBtn = document.getElementById('backToGamesModalBtn');
const closeModalBtn = document.querySelector('.close-button');


let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let attempts = 0;
let gameStarted = false;
let timerInterval;
let seconds = 0;

// Array de clases de Font Awesome para los iconos de las cartas
// Puedes elegir los iconos que más te gusten de la librería de Font Awesome
const cardIcons = [
    'fa-heart',        // Corazón
    'fa-star',         // Estrella
    'fa-gem',          // Gema
    'fa-moon',         // Luna
    'fa-sun',          // Sol
    'fa-kiss-wink-heart', // Beso con guiño de corazón
    // Puedes añadir más iconos si quieres más pares, asegúrate de que sean un número par de iconos
    // 'fa-smile',
    // 'fa-hand-holding-heart',
];

// Función para barajar un array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createBoard() {
    gameBoard.innerHTML = '';
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    attempts = 0;
    seconds = 0;
    attemptsDisplay.textContent = '0';
    timerDisplay.textContent = '00:00';
    clearInterval(timerInterval);
    gameStarted = false;
    startGameBtn.style.display = 'block';
    resetGameBtn.style.display = 'none';
    gameOverModal.style.display = 'none';

    // Duplicar los iconos para crear pares
    let gameIcons = [...cardIcons, ...cardIcons];
    shuffleArray(gameIcons);

    // Ajustar el número de columnas del grid dinámicamente
    const numCards = gameIcons.length;
    let columns = 4; // Predeterminado para 12 cartas (6 pares) -> 4x3
    if (numCards === 8) columns = 4; // 8 cartas (4 pares) -> 4x2
    if (numCards === 16) columns = 4; // 16 cartas (8 pares) -> 4x4
    if (numCards === 20) columns = 5; // 20 cartas (10 pares) -> 5x4
    
    gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;


    gameIcons.forEach((iconClass, index) => { // Ahora iteramos sobre iconClass
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.iconClass = iconClass; // Almacenar la clase del icono para comparar
        card.dataset.id = index;
        
        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-face', 'card-front');
        // El signo de interrogación va en el frente
        const frontIcon = document.createElement('i');
        frontIcon.classList.add('fas', 'fa-question-circle'); // Icono de pregunta de Font Awesome
        cardFront.appendChild(frontIcon);

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-face', 'card-back');
        const backIcon = document.createElement('i');
        backIcon.classList.add('fas', iconClass); // Aquí usamos la clase del icono real
        cardBack.appendChild(backIcon);

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);

        card.addEventListener('click', () => flipCard(card));
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

function flipCard(card) {
    if (!gameStarted) return;
    if (flippedCards.length < 2 && !card.classList.contains('flipped') && !card.classList.contains('matched')) {
        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            attempts++;
            attemptsDisplay.textContent = attempts;
            checkForMatch();
        }
    }
}

function checkForMatch() {
    const [card1, card2] = flippedCards;

    // Ahora comparamos dataset.iconClass en lugar de dataset.imageUrl
    if (card1.dataset.iconClass === card2.dataset.iconClass) { 
        // Coinciden
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        flippedCards = [];

        if (matchedPairs === cardIcons.length) { // Si todos los pares han sido encontrados
            endGame(true); // Juego ganado
        }
    } else {
        // No coinciden, voltearlas de nuevo después de un breve retraso
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    }
}

function startTimer() {
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        let minutes = Math.floor(seconds / 60);
        let remainingSeconds = seconds % 60;
        timerDisplay.textContent = 
            `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }, 1000);
}

function endGame(win) {
    clearInterval(timerInterval);
    gameStarted = false;
    startGameBtn.style.display = 'none';
    resetGameBtn.style.display = 'block';

    if (win) {
        modalMessage.textContent = '¡Felicidades! ¡Encontraste todas las parejas!';
        modalScore.textContent = `Lo lograste en ${attempts} intentos y ${timerDisplay.textContent} minutos.`;
    } else {
        modalMessage.textContent = '¡Tiempo agotado!';
        modalScore.textContent = `Llegaste a ${attempts} intentos. ¡Inténtalo de nuevo!`;
    }
    gameOverModal.style.display = 'flex';
}

// Event Listeners
startGameBtn.addEventListener('click', () => {
    gameStarted = true;
    startGameBtn.style.display = 'none';
    resetGameBtn.style.display = 'block';
    startTimer();
});

resetGameBtn.addEventListener('click', createBoard);

backToGamesBtn.addEventListener('click', () => {
    window.location.href = '../mini_juegos.html';
});

playAgainModalBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    createBoard();
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
        window.location.href = '../login.html';
    }
});

// Inicializar el tablero al cargar la página
createBoard();