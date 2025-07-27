import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

// Elementos del DOM
const lettersGrid = document.getElementById('lettersGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const noLettersMessage = document.getElementById('noLettersMessage');
const openComposeModalBtn = document.getElementById('openComposeModal');

// Modal de Composición
const composeLetterModal = document.getElementById('composeLetterModal');
const composeLetterForm = document.getElementById('composeLetterForm');
const recipientSelect = document.getElementById('recipientSelect');
const letterTitleInput = document.getElementById('letterTitle');
const letterContentTextarea = document.getElementById('letterContent');
const sendLetterBtn = document.getElementById('sendLetterBtn');

// Modal de Visualización
const viewLetterModal = document.getElementById('viewLetterModal');
const viewLetterTitle = document.getElementById('viewLetterTitle');
const viewLetterSender = document.getElementById('viewLetterSender');
const viewLetterDate = document.getElementById('viewLetterDate');
const viewLetterContent = document.getElementById('viewLetterContent');

// Botones de cerrar modal
const closeButtons = document.querySelectorAll('.modal .close-button');

let currentUserId = null; // Para almacenar el ID del usuario autenticado

// --- Funciones de Utilidad ---
function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
    lettersGrid.innerHTML = ''; // Limpia el contenido mientras carga
    noLettersMessage.style.display = 'none';
}

function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}

function showModal(modalElement) {
    modalElement.style.display = 'block';
}

function hideModal(modalElement) {
    modalElement.style.display = 'none';
}

// --- Autenticación y Carga Inicial ---
async function checkAuthAndLoadLetters() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
            currentUserId = user.id;
            console.log('Usuario autenticado en Cartas de Amor:', user.email, 'ID:', user.id);
            await loadUsersForRecipientSelect(); // Cargar usuarios para el selector
            await loadUserLetters(); // Cargar cartas del usuario
        } else {
            console.log('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'login.html'; // Redirige si no está autenticado
        }
    } catch (error) {
        console.error('Error en autenticación o carga inicial:', error.message);
        alert('Error al verificar sesión: ' + error.message);
        window.location.href = 'login.html';
    }
}

// --- Cargar Usuarios para el selector de Destinatarios ---
async function loadUsersForRecipientSelect() {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username')
            .neq('id', currentUserId); // No mostrar al usuario actual como destinatario

        if (error) throw error;

        recipientSelect.innerHTML = '<option value="">Selecciona un usuario</option>'; // Reset
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = profile.username || `Usuario ${profile.id.substring(0, 8)}`; // Mostrar username o ID parcial
            recipientSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar usuarios para el select de destinatarios:', error.message);
        alert('Error al cargar la lista de usuarios. Intenta de nuevo más tarde.');
    }
}

// --- Cargar y Mostrar Cartas del Usuario ---
async function loadUserLetters() {
    showLoadingSpinner();
    try {
        // Obtenemos cartas enviadas Y recibidas por el usuario actual
        const { data: sentLetters, error: sentError } = await supabase
            .from('love_letters')
            .select('*, sender:profiles!love_letters_sender_id_fkey(username), recipient:profiles!love_letters_recipient_id_fkey(username)')
            .eq('sender_id', currentUserId)
            .order('created_at', { ascending: false });

        if (sentError) throw sentError;

        const { data: receivedLetters, error: receivedError } = await supabase
            .from('love_letters')
            .select('*, sender:profiles!love_letters_sender_id_fkey(username), recipient:profiles!love_letters_recipient_id_fkey(username)')
            .eq('recipient_id', currentUserId)
            .order('created_at', { ascending: false });

        if (receivedError) throw receivedError;

        const allLetters = [...sentLetters, ...receivedLetters].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (allLetters && allLetters.length > 0) {
            displayLetters(allLetters);
            noLettersMessage.style.display = 'none';
        } else {
            lettersGrid.innerHTML = '';
            noLettersMessage.style.display = 'block';
        }

    } catch (error) {
        console.error('Error al cargar cartas:', error.message);
        lettersGrid.innerHTML = '';
        noLettersMessage.textContent = 'Error al cargar tus cartas. Intenta de nuevo más tarde.';
        noLettersMessage.style.display = 'block';
    } finally {
        hideLoadingSpinner();
    }
}

function displayLetters(letters) {
    lettersGrid.innerHTML = ''; // Limpiar galería antes de mostrar
    letters.forEach((letter, index) => {
        const letterCard = document.createElement('section');
        letterCard.className = 'letter-card';
        letterCard.style.animationDelay = `${index * 0.1}s`; // Animación de entrada con delay
        letterCard.style.animationName = 'fadeInUp'; // Aplica la animación

        const isSender = letter.sender_id === currentUserId;
        const recipientOrSenderName = isSender ? (letter.recipient ? letter.recipient.username : 'Usuario Desconocido') : (letter.sender ? letter.sender.username : 'Usuario Desconocido');
        const cardTitle = isSender ? `Para: ${recipientOrSenderName}` : `De: ${recipientOrSenderName}`;
        
        letterCard.innerHTML = `
            <h2>${cardTitle}</h2>
            <p>${letter.title}</p>
            <footer>
                ${isSender ? 'Enviada' : 'Recibida'} el ${new Date(letter.created_at).toLocaleDateString()}
            </footer>
        `;
        letterCard.addEventListener('click', () => openViewLetterModal(letter));
        lettersGrid.appendChild(letterCard);
    });
}

// --- Enviar Nueva Carta ---
composeLetterForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evitar recarga de página

    const recipientId = recipientSelect.value;
    const title = letterTitleInput.value.trim();
    const content = letterContentTextarea.value.trim();

    if (!recipientId || !title || !content) {
        alert('Por favor, completa todos los campos para enviar la carta.');
        return;
    }

    if (!currentUserId) {
        alert('Debes iniciar sesión para enviar cartas.');
        return;
    }

    sendLetterBtn.disabled = true; // Deshabilitar botón para evitar envíos duplicados
    sendLetterBtn.textContent = 'Enviando...';

    try {
        const { data, error } = await supabase
            .from('love_letters')
            .insert([
                { sender_id: currentUserId, recipient_id: recipientId, title: title, content: content }
            ]);

        if (error) throw error;

        alert('¡Carta enviada con éxito!');
        composeLetterForm.reset(); // Limpiar formulario
        hideModal(composeLetterModal); // Cerrar modal
        await loadUserLetters(); // Recargar cartas para ver la nueva

    } catch (error) {
        console.error('Error al enviar la carta:', error.message);
        alert('Error al enviar la carta: ' + error.message);
    } finally {
        sendLetterBtn.disabled = false;
        sendLetterBtn.textContent = 'Enviar Carta';
    }
});

// --- Abrir Modal de Composición ---
openComposeModalBtn.addEventListener('click', () => {
    composeLetterForm.reset(); // Limpiar el formulario cada vez que se abre
    recipientSelect.value = ''; // Asegurar que el select esté en la opción por defecto
    showModal(composeLetterModal);
});

// --- Abrir Modal de Visualización ---
function openViewLetterModal(letter) {
    viewLetterTitle.textContent = letter.title;
    viewLetterSender.textContent = letter.sender ? letter.sender.username : 'Usuario Desconocido';
    viewLetterDate.textContent = new Date(letter.created_at).toLocaleDateString();
    viewLetterContent.innerHTML = letter.content.replace(/\n/g, '<br>'); // Reemplazar saltos de línea por <br>
    showModal(viewLetterModal);
}

// --- Cerrar Modales ---
closeButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        // Encuentra el modal padre más cercano y ocúltalo
        const modal = event.target.closest('.modal');
        if (modal) {
            hideModal(modal);
        }
    });
});

window.addEventListener('click', (event) => {
    if (event.target == composeLetterModal) {
        hideModal(composeLetterModal);
    }
    if (event.target == viewLetterModal) {
        hideModal(viewLetterModal);
    }
});


// --- Cerrar Sesión ---
document.getElementById('signOut').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión: ' + error.message);
    } else {
        window.location.href = 'login.html';
    }
});

// Iniciar la aplicación al cargar la página
checkAuthAndLoadLetters();