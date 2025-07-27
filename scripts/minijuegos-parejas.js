import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

const gamesGrid = document.getElementById('gamesGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const noGamesMessage = document.getElementById('noGamesMessage');

// Array de objetos que representan los juegos
// Aquí puedes definir los juegos que tienes disponibles.
// La 'gameUrl' es la URL a la página donde se aloja el juego.
const gamesData = [
    {
        title: '¿Cuánto nos conoces?',
        description: 'Responde preguntas sobre tu pareja y descubre cuánto saben el uno del otro.',
        imageUrl: 'assets/images/juego1.png',// Asegúrate de que esta imagen exista en tu carpeta 'assets'
        gameUrl: 'games/conocimiento.html', // Ejemplo: ruta a un archivo HTML para este juego
    },
    {
        title: 'Juego de Memoria',
        description: 'Encuentra las parejas de cartas en este clásico juego de memoria con temática de amor.',
        imageUrl: 'assets/images/juego2.png',
        gameUrl: 'games/memoria.html', // Ejemplo: ruta a un archivo HTML para este juego
    },
    {
        title: 'Adivina la palabra',
        description: 'Intenta adivinar la palabra relacionada con el amor antes de que se acabe el tiempo.',
        imageUrl: 'assets/images/juego3.png',
        gameUrl: 'games/adivinar.html', // Ejemplo: ruta a un archivo HTML para este juego
    },
    {
        title: 'Rompecabezas romántico',
        description: 'Arma el rompecabezas de una foto especial juntos.',
        imageUrl: 'assets/images/juego4.png',
        gameUrl: 'games/rompecabezas.html', // Ejemplo: ruta a un archivo HTML para este juego
    },
    // Añade más juegos aquí si lo deseas
    /*
    {
        title: 'Verdad o Reto',
        description: 'Un clásico divertido para conocerse más a fondo.',
        imageUrl: 'assets/juego5.png', 
        gameUrl: 'games/verdad-reto.html',
    },
    */
];

async function loadGames() {
    showLoadingSpinner();
    // En una aplicación real, aquí podrías cargar los juegos desde Supabase.
    // Por ahora, usamos el array 'gamesData' definido localmente.
    if (gamesData && gamesData.length > 0) {
        displayGames(gamesData);
        hideLoadingSpinner();
    } else {
        hideLoadingSpinner();
        noGamesMessage.style.display = 'block';
    }
}

function displayGames(games) {
    gamesGrid.innerHTML = ''; // Limpiar la cuadrícula antes de mostrar
    games.forEach((game, index) => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        // Añade un pequeño retraso para la animación de entrada escalonada
        gameCard.style.animationDelay = `${0.1 * (index + 1)}s`; 
        gameCard.innerHTML = `
            <img src="${game.imageUrl}" alt="${game.title}" loading="lazy">
            <h3>${game.title}</h3>
            <p>${game.description}</p>
            <button data-url="${game.gameUrl}">Jugar</button>
        `;
        gamesGrid.appendChild(gameCard);
    });

    // Añadir event listeners a los botones de "Jugar" después de que se hayan creado
    const playButtons = document.querySelectorAll('.game-card button');
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const gameUrl = this.dataset.url;
            if (gameUrl && gameUrl !== '#') { // Asegurarse de que haya una URL válida
                window.location.href = gameUrl; // Redirigir a la página del juego
            } else {
                alert('Este juego aún no está disponible o no tiene una URL asignada.');
            }
        });
    });
}

function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
    gamesGrid.innerHTML = ''; // Limpia el contenido mientras carga
    noGamesMessage.style.display = 'none';
}

function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}

// --- Cerrar Sesión ---
document.getElementById('signOut').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión: ' + error.message);
    } else {
        window.location.href = 'login.html'; // Redirigir a la página de login
    }
});

// Iniciar la carga de juegos al cargar la página
loadGames();