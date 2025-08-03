// scripts/chat.js

import { supabase } from './supabase.js';

// --- Referencias a elementos del DOM ---
const logoutButton = document.getElementById('logout');
const dropbtn = document.querySelector('.dropbtn');
const dropdownContent = document.querySelector('.dropdown-content');

const friendList = document.getElementById('friendList');
// Referencia a la cabecera del chat completa para hacerla clicable
const chatHeader = document.querySelector('.chat-header');
const chatRecipientAvatar = document.getElementById('chatRecipientAvatar');
const chatRecipientName = document.getElementById('chatRecipientName');
const messagesDisplay = document.getElementById('messagesDisplay');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');

let currentUserId = null;
let currentRecipientId = null; // ID del amigo con el que estamos chateando actualmente

// --- Funciones de Utilidad ---

function formatMessageTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(date.getHours() - now.getHours());

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48 && date.getDate() === now.getDate() - 1) {
        return `Ayer ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function redirectToProfile(userId) {
    if (userId) {
        window.location.href = `perfil.html?user_id=${userId}`;
    }
}

// --- Lógica de Autenticación y Carga Inicial ---

async function checkAuthAndLoadData() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.warn('Usuario no autenticado, redirigiendo a la página de inicio.');
        window.location.href = 'index.html';
        return;
    }

    currentUserId = user.id;
    console.log('Usuario autenticado en Chat:', user.email, 'ID:', currentUserId);

    loadFriends();
    setupRealtimeSubscriptions();
}

// --- Funcionalidad del Menú Desplegable ---

dropbtn.addEventListener('click', () => {
    dropdownContent.classList.toggle('show');
});

window.addEventListener('click', (event) => {
    if (!event.target.matches('.dropbtn') && !event.target.closest('.dropdown-content')) {
        if (dropdownContent.classList.contains('show')) {
            dropdownContent.classList.remove('show');
        }
    }
});

// --- Carga de Amigos / Conversaciones ---

async function loadFriends() {
    friendList.innerHTML = '<p class="loading-message">Cargando amigos...</p>';

    const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

    if (friendError) {
        console.error('Error al cargar amistades:', friendError.message);
        friendList.innerHTML = '<p class="loading-message error">Error al cargar amigos.</p>';
        return;
    }

    const friendIds = friendships.map(f => {
        return f.user1_id === currentUserId ? f.user2_id : f.user1_id;
    });

    if (friendIds.length === 0) {
        friendList.innerHTML = '<p class="no-friends-message">Aún no tienes amigos. ¡Empieza a conectar!</p>';
        return;
    }

    const { data: friends, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', friendIds);

    if (profileError) {
        console.error('Error al cargar perfiles de amigos:', profileError.message);
        friendList.innerHTML = '<p class="loading-message error">Error al cargar perfiles de amigos.</p>';
        return;
    }

    friendList.innerHTML = '';
    friends.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.classList.add('friend-item');
        friendItem.dataset.friendId = friend.id;
        friendItem.dataset.friendName = friend.username;
        friendItem.dataset.friendAvatar = friend.avatar_url || 'https://via.placeholder.com/50';

        friendItem.innerHTML = `
            <img src="${friendItem.dataset.friendAvatar}" alt="${friend.username}" class="friend-avatar">
            <span class="friend-name">${friend.username}</span>
        `;
        friendList.appendChild(friendItem);

        // Añadimos un event listener que llama a selectFriend con todos los datos
        friendItem.addEventListener('click', () => {
            selectFriend(friend.id, friend.username, friendItem.dataset.friendAvatar);
        });
    });
}

// --- Selección de Amigo y Carga de Mensajes ---

async function selectFriend(friendId, friendName, friendAvatar) {
    // Optimización: Si ya tenemos el chat con este amigo abierto, no hacemos nada.
    if (currentRecipientId === friendId) {
        return;
    }

    currentRecipientId = friendId;

    // Actualizar el estado visual de la lista de amigos
    document.querySelectorAll('.friend-item').forEach(item => {
        item.classList.remove('active');
    });
    const selectedFriendItem = document.querySelector(`.friend-item[data-friend-id="${friendId}"]`);
    if (selectedFriendItem) {
        selectedFriendItem.classList.add('active');
    }

    // Actualizar el encabezado del chat
    chatRecipientAvatar.src = friendAvatar;
    chatRecipientAvatar.alt = friendName;
    chatRecipientName.textContent = friendName;
    
    // Asignar el evento para ver el perfil
    chatHeader.dataset.friendId = friendId;
    chatHeader.style.cursor = 'pointer'; // Indicador visual de que es clicable
    // Eliminamos el listener anterior antes de añadir el nuevo para evitar duplicados
    chatHeader.removeEventListener('click', redirectToProfile);
    chatHeader.addEventListener('click', () => redirectToProfile(friendId));

    messagesDisplay.innerHTML = '<p class="loading-message">Cargando mensajes...</p>';
    
    messageInput.disabled = true;
    sendMessageButton.disabled = true;

    // Cargar mensajes
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${currentRecipientId}),and(sender_id.eq.${currentRecipientId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error al cargar mensajes:', error.message);
        messagesDisplay.innerHTML = '<p class="no-messages-message error">Error al cargar mensajes.</p>';
        return;
    }

    messagesDisplay.innerHTML = '';
    if (messages.length === 0) {
        messagesDisplay.innerHTML = '<p class="no-messages-message">¡Es el inicio de una nueva conversación!</p>';
    } else {
        messages.forEach(msg => displayMessage(msg));
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    }

    messageInput.disabled = false;
    sendMessageButton.disabled = false;
    messageInput.focus();
}

// --- Envío de Mensajes ---

async function sendMessage() {
    const content = messageInput.value.trim();

    if (!content || !currentRecipientId) {
        return;
    }

    sendMessageButton.disabled = true;
    messageInput.disabled = true;

    const { data, error } = await supabase
        .from('messages')
        .insert([
            {
                sender_id: currentUserId,
                receiver_id: currentRecipientId,
                content: content
            }
        ]);

    if (error) {
        console.error('Error al enviar mensaje:', error.message);
        alert('Error al enviar mensaje: ' + error.message);
    } else {
        messageInput.value = '';
    }

    sendMessageButton.disabled = false;
    messageInput.disabled = false;
    messageInput.focus();
}

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-item');

    if (message.sender_id === currentUserId) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }

    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-timestamp">${formatMessageTime(message.created_at)}</div>
    `;

    // Optimización: Eliminar mensaje de placeholder si existe antes de añadir el primer mensaje
    const placeholder = messagesDisplay.querySelector('.no-messages-message');
    if (placeholder) {
        messagesDisplay.removeChild(placeholder);
    }

    messagesDisplay.appendChild(messageElement);
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
}

sendMessageButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// --- Realtime Subscriptions ---

function setupRealtimeSubscriptions() {
    supabase
        .channel('private_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const newMessage = payload.new;

            if (
                (newMessage.sender_id === currentUserId && newMessage.receiver_id === currentRecipientId) ||
                (newMessage.sender_id === currentRecipientId && newMessage.receiver_id === currentUserId)
            ) {
                displayMessage(newMessage);
            }
        })
        .subscribe();
}

// --- Event Listeners Globales ---

logoutButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Hubo un error al cerrar sesión. Inténtalo de nuevo.');
    } else {
        window.location.href = 'index.html';
    }
});

document.addEventListener('DOMContentLoaded', checkAuthAndLoadData);