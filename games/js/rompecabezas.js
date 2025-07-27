import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

const puzzleBoard = document.getElementById('puzzleBoard');
const startGameBtn = document.getElementById('startGameBtn');
const resetGameBtn = document.getElementById('resetGameBtn');
const backToGamesBtn = document.getElementById('backToGamesBtn');
const gameOverModal = document.getElementById('gameOverModal');
const modalMessage = document.getElementById('modalMessage');
const modalDescription = document.getElementById('modalDescription');
const playAgainModalBtn = document.getElementById('playAgainModalBtn');
const backToGamesModalBtn = document.getElementById('backToGamesModalBtn');
const closeModalBtn = document.querySelector('.close-button');

// ¡IMPORTANTE! Reemplaza con la ruta correcta a tu imagen PNG
const PUZZLE_IMAGE_URL = '../../assets/images/romantic_puzzle.png'; 
const NUM_COLS = 10; // Número de columnas para el rompecabezas (¡Más piezas!)
const NUM_ROWS = 5; // Número de filas (¡Más piezas!)
const NUM_PIECES = NUM_COLS * NUM_ROWS; // Esto dará 50 piezas

let pieces = []; // Array para almacenar las piezas del rompecabezas
let puzzleSolved = false;
let boardWidth = 0;
let boardHeight = 0;

// Variables para arrastrar y soltar
let currentDraggedPiece = null;
let offsetX, offsetY; // Offset para la posición del ratón dentro de la pieza

function initializeGame() {
    puzzleBoard.innerHTML = '';
    pieces = [];
    puzzleSolved = false;
    startGameBtn.style.display = 'block';
    resetGameBtn.style.display = 'none';
    gameOverModal.style.display = 'none';

    // Ocultar el tablero hasta que se inicie el juego
    puzzleBoard.style.opacity = '0'; 
    puzzleBoard.style.pointerEvents = 'none'; // Deshabilitar interacciones

    // Cargar la imagen para obtener sus dimensiones y luego crear las piezas
    const img = new Image();
    img.onload = () => {
        // Establecer el tamaño del tablero basado en la imagen y el max-width del CSS
        // Esto es un poco tricky porque el CSS tiene un max-width.
        // Vamos a establecer un tamaño fijo para el tablero para simplificar.
        // Idealmente, el tamaño debería ser dinámico o el CSS debería manejarlo mejor.
        
        // Obtener el ancho real del contenedor en el DOM después del renderizado CSS
        const puzzleArea = puzzleBoard.parentElement; // El .puzzle-area es el padre
        boardWidth = puzzleArea.offsetWidth - (parseInt(getComputedStyle(puzzleArea).borderLeftWidth) || 0) - (parseInt(getComputedStyle(puzzleArea).borderRightWidth) || 0);

        // Ajustar la altura del tablero para mantener la relación de aspecto de la imagen
        boardHeight = (img.naturalHeight / img.naturalWidth) * boardWidth; 
        puzzleBoard.style.width = `${boardWidth}px`;
        puzzleBoard.style.height = `${boardHeight}px`;

        createPieces(img);
        // Las piezas se crearán pero no se mostrarán ni se mezclarán hasta startGame
    };
    img.onerror = () => {
        console.error("Error al cargar la imagen del rompecabezas:", PUZZLE_IMAGE_URL);
        alert("No se pudo cargar la imagen del rompecabezas. Por favor, verifica la ruta.");
    };
    img.src = PUZZLE_IMAGE_URL;
}

function createPieces(img) {
    const pieceWidth = boardWidth / NUM_COLS;
    const pieceHeight = boardHeight / NUM_ROWS;

    for (let i = 0; i < NUM_PIECES; i++) {
        const row = Math.floor(i / NUM_COLS);
        const col = i % NUM_COLS;

        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.dataset.id = i; // ID original de la pieza (0 a NUM_PIECES-1)
        piece.dataset.row = row;
        piece.dataset.col = col;

        // Calcular la posición del fondo de la imagen para esta pieza
        const bgX = -col * pieceWidth;
        const bgY = -row * pieceHeight;

        piece.style.backgroundImage = `url(${PUZZLE_IMAGE_URL})`;
        piece.style.backgroundSize = `${boardWidth}px ${boardHeight}px`; // Tamaño total de la imagen
        piece.style.backgroundPosition = `${bgX}px ${bgY}px`;
        
        piece.style.width = `${pieceWidth}px`;
        piece.style.height = `${pieceHeight}px`;

        pieces.push(piece);
        puzzleBoard.appendChild(piece);

        // Añadir eventos de arrastrar y soltar
        piece.addEventListener('mousedown', startDrag);
        piece.addEventListener('touchstart', startDrag, { passive: false }); // Para móviles
    }
}

function shufflePieces() {
    // Generar posiciones aleatorias para cada pieza
    const positions = [];
    for (let i = 0; i < NUM_PIECES; i++) {
        positions.push(i); // [0, 1, 2, ..., NUM_PIECES-1]
    }
    shuffleArray(positions); // Mezclar los índices de posición

    const pieceWidth = boardWidth / NUM_COLS;
    const pieceHeight = boardHeight / NUM_ROWS;

    pieces.forEach((piece, index) => {
        const randomPosIndex = positions[index]; // Obtener una posición aleatoria del array mezclado
        const targetRow = Math.floor(randomPosIndex / NUM_COLS);
        const targetCol = randomPosIndex % NUM_COLS;

        // Calcular la posición en píxeles
        const x = targetCol * pieceWidth;
        const y = targetRow * pieceHeight;

        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
        piece.dataset.currentPos = randomPosIndex; // Guardar la posición actual de la pieza
        piece.classList.remove('correct'); // Asegurarse de que no tenga la clase correct al inicio
    });
    checkWin(); // Para asegurar que no gane al inicio si por casualidad se mezcló bien
}

function startDrag(e) {
    if (puzzleSolved) return;

    currentDraggedPiece = e.target.closest('.puzzle-piece');
    if (!currentDraggedPiece) return;

    currentDraggedPiece.classList.add('dragging');

    // Obtener la posición del ratón/toque
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    // Calcular el offset dentro de la pieza
    const rect = currentDraggedPiece.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    // Añadir eventos al document para arrastrar y soltar
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', drop);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', drop);

    e.preventDefault(); // Prevenir el comportamiento por defecto (ej. scroll en móviles)
}

function drag(e) {
    if (!currentDraggedPiece) return;

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    // Calcular la nueva posición de la pieza
    let newX = clientX - offsetX - puzzleBoard.getBoundingClientRect().left;
    let newY = clientY - offsetY - puzzleBoard.getBoundingClientRect().top;

    // Limitar el arrastre dentro del tablero
    const pieceWidth = currentDraggedPiece.offsetWidth;
    const pieceHeight = currentDraggedPiece.offsetHeight;

    newX = Math.max(0, Math.min(newX, boardWidth - pieceWidth));
    newY = Math.max(0, Math.min(newY, boardHeight - pieceHeight));

    currentDraggedPiece.style.left = `${newX}px`;
    currentDraggedPiece.style.top = `${newY}px`;

    e.preventDefault();
}

function drop(e) {
    if (!currentDraggedPiece) return;

    currentDraggedPiece.classList.remove('dragging');

    // Calcular la posición final de la pieza para "encajarla" en la cuadrícula
    const pieceWidth = boardWidth / NUM_COLS;
    const pieceHeight = boardHeight / NUM_ROWS;

    const currentX = parseFloat(currentDraggedPiece.style.left);
    const currentY = parseFloat(currentDraggedPiece.style.top);

    // Calcular la celda más cercana
    const targetCol = Math.round(currentX / pieceWidth);
    const targetRow = Math.round(currentY / pieceHeight);

    // Calcular la posición de la celda
    const snapX = targetCol * pieceWidth;
    const snapY = targetRow * pieceHeight;

    currentDraggedPiece.style.left = `${snapX}px`;
    currentDraggedPiece.style.top = `${snapY}px`;

    // Actualizar la posición lógica de la pieza
    currentDraggedPiece.dataset.currentPos = targetRow * NUM_COLS + targetCol;

    currentDraggedPiece = null;

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', drop);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', drop);

    checkWin();
}

function checkWin() {
    puzzleSolved = true;
    pieces.forEach(piece => {
        const correctPos = parseInt(piece.dataset.id);
        const currentPos = parseInt(piece.dataset.currentPos);
        
        if (correctPos === currentPos) {
            piece.classList.add('correct');
        } else {
            piece.classList.remove('correct');
            puzzleSolved = false; // Si hay una pieza incorrecta, el rompecabezas no está resuelto
        }
    });

    if (puzzleSolved) {
        endGame(true);
    }
}

function endGame(win) {
    puzzleSolved = true; // Asegurarse de que no se pueda interactuar más
    // guessInput, guessBtn, solveBtn no existen en este juego, solo eran del anterior
    startGameBtn.style.display = 'none';
    resetGameBtn.style.display = 'block';
    
    // Ocultar el tablero y mostrar el modal
    puzzleBoard.style.opacity = '0'; 
    puzzleBoard.style.pointerEvents = 'none'; 

    gameOverModal.style.display = 'flex';
    if (win) {
        modalMessage.textContent = '¡Felicidades! ¡Rompecabezas Completado!';
        modalDescription.textContent = 'Has reconstruido la imagen romántica. ¡Excelente trabajo!';
    } else {
        modalMessage.textContent = '¡Juego Terminado!';
        modalDescription.textContent = 'Inténtalo de nuevo para completar el rompecabezas.';
    }
}

// Función para barajar un array (útil para las posiciones)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Event Listeners
startGameBtn.addEventListener('click', () => {
    puzzleBoard.style.opacity = '1'; // Mostrar el tablero
    puzzleBoard.style.pointerEvents = 'auto'; // Habilitar interacciones
    shufflePieces();
    startGameBtn.style.display = 'none';
    resetGameBtn.style.display = 'block';
});

resetGameBtn.addEventListener('click', initializeGame);

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
        window.location.href = '../login.html';
    }
});

// Inicializar el juego al cargar la página
initializeGame();