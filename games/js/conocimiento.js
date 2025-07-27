import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const resultDisplay = document.getElementById('resultDisplay');
const currentScoreDisplay = document.getElementById('currentScore');
const finalMessageDisplay = document.getElementById('finalMessage');
const restartGameBtn = document.getElementById('restartGameBtn');
const backToGamesBtn = document.getElementById('backToGamesBtn');
const noQuestionsMessage = document.getElementById('noQuestionsMessage');
const backToGamesBtnNoQuestions = document.getElementById('backToGamesBtnNoQuestions');

let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null; // Para almacenar la opción seleccionada por el usuario

// Datos de las preguntas (puedes añadir más o cargarlas desde Supabase)
const questions = [
    {
        question: '¿Cuál es su comida favorita para una cita romántica?',
        options: ['Pasta', 'Sushi', 'Pizza', 'Comida casera'],
        correctAnswer: 'Comida casera' 
    },
    {
        question: '¿Qué actividad prefiere para relajarse un fin de semana?',
        options: ['Ver películas', 'Leer un libro', 'Salir a la naturaleza', 'Jugar videojuegos'],
        correctAnswer: 'Salir a la naturaleza'
    },
    {
        question: '¿Qué regalo le gustaría más recibir?',
        options: ['Algo hecho a mano', 'Tecnología', 'Ropa', 'Una experiencia (viaje, concierto)'],
        correctAnswer: 'Una experiencia (viaje, concierto)'
    },
    {
        question: '¿Cuál es su color favorito?',
        options: ['Azul', 'Verde', 'Rojo', 'Morado'],
        correctAnswer: 'Morado'
    },
    {
        question: '¿Qué tipo de música prefiere escuchar?',
        options: ['Pop', 'Rock', 'Clásica', 'Latina'],
        correctAnswer: 'Latina'
    },
    // Añade más preguntas aquí
];

function initializeGame() {
    currentQuestionIndex = 0;
    score = 0;
    resultDisplay.style.display = 'none';
    // Asegurarse de que el botón Siguiente Pregunta esté visible y deshabilitado al inicio de cada pregunta
    nextQuestionBtn.style.display = 'block'; 
    nextQuestionBtn.disabled = true; // Deshabilitado hasta que se seleccione una opción

    if (questions.length > 0) {
        noQuestionsMessage.style.display = 'none';
        loadQuestion();
    } else {
        noQuestionsMessage.style.display = 'block';
        nextQuestionBtn.style.display = 'none'; // Ocultar si no hay preguntas
    }
}

function loadQuestion() {
    selectedOption = null; // Reiniciar la selección
    optionsContainer.innerHTML = ''; // Limpiar opciones anteriores
    nextQuestionBtn.disabled = true; // Deshabilitar hasta que se seleccione una opción

    if (currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        questionText.textContent = currentQuestion.question;

        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = option;
            button.addEventListener('click', () => selectOption(button, option, currentQuestion.correctAnswer));
            optionsContainer.appendChild(button);
        });
    } else {
        // Todas las preguntas respondidas
        showResults();
    }
}

function selectOption(button, option, correctAnswer) {
    // Desactivar todas las opciones para evitar múltiples selecciones y limpiar clases
    const allOptionButtons = optionsContainer.querySelectorAll('.option-btn');
    allOptionButtons.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong'); // Limpiar todas las clases de estado
        btn.disabled = true; // Deshabilitar después de seleccionar
    });

    selectedOption = option;
    button.classList.add('selected'); // Marcar como seleccionada
    nextQuestionBtn.disabled = false; // Habilitar el botón Siguiente Pregunta

    // Mostrar retroalimentación de correcto/incorrecto inmediatamente
    if (selectedOption === correctAnswer) {
        button.classList.add('correct');
    } else {
        button.classList.add('wrong');
        // También puedes marcar la correcta si la respuesta del usuario es incorrecta
        allOptionButtons.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }
}

function nextQuestion() {
    if (selectedOption !== null) { // Solo si hay una opción seleccionada
        // La lógica de puntuación ya se hizo en selectOption si lo deseas, o aquí antes de avanzar
        // Si no quieres que se muestre correcto/incorrecto al instante, el check de score iría aquí
        // Por ahora, como ya está en selectOption, solo avanzamos.

        currentQuestionIndex++;
        loadQuestion();
    } else {
        alert('Por favor, selecciona una opción antes de continuar.'); // Esto en teoría no debería pasar si el botón está deshabilitado
    }
}


function showResults() {
    questionText.textContent = ''; // Limpiar la pregunta
    optionsContainer.innerHTML = ''; // Limpiar opciones
    nextQuestionBtn.style.display = 'none'; // Ocultar botón de siguiente pregunta
    resultDisplay.style.display = 'block'; // Mostrar resultados

    currentScoreDisplay.textContent = `Has acertado ${score} de ${questions.length} preguntas.`;

    let finalMessage = '';
    if (score === questions.length) {
        finalMessage = '¡Felicidades! ¡Conoces muy bien a tu pareja!';
    } else if (score >= questions.length / 2) {
        finalMessage = '¡Nada mal! Sigan conociéndose.';
    } else {
        finalMessage = '¡Hay mucho por aprender! Sigan explorando juntos.';
    }
    finalMessageDisplay.textContent = finalMessage;
}

// Event Listeners
nextQuestionBtn.addEventListener('click', nextQuestion);
restartGameBtn.addEventListener('click', initializeGame);
backToGamesBtn.addEventListener('click', () => {
    window.location.href = '../mini_juegos.html'; // Volver a la página principal de mini juegos
});
backToGamesBtnNoQuestions.addEventListener('click', () => {
    window.location.href = '../mini_juegos.html'; // Volver a la página principal de mini juegos
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

// Inicializar el juego cuando la página cargue
initializeGame();