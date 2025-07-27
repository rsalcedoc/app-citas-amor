// scripts/home.js

import { supabase } from './supabase.js';

// Referencias a elementos del DOM
const logoutButton = document.getElementById('logout');
const dropbtn = document.querySelector('.dropbtn');
const dropdownContent = document.querySelector('.dropdown-content');

const postContentInput = document.getElementById('postContent');
const publishPostButton = document.getElementById('publishPost');
const postsFeed = document.getElementById('postsFeed');
const friendRequestsList = document.getElementById('friendRequestsList');
const peopleSuggestionsList = document.getElementById('peopleSuggestionsList');

let currentUserId = null; // Para almacenar el ID del usuario actual

// --- Funciones de Utilidad ---

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds} segundos`;
    if (minutes < 60) return `${minutes} minutos`;
    if (hours < 24) return `${hours} horas`;
    if (days < 30) return `${days} días`;
    return date.toLocaleDateString();
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
    console.log('Usuario autenticado:', user.email, 'ID:', currentUserId);

    loadPosts();
    loadFriendRequests();
    loadPeopleSuggestions();
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

// --- Publicaciones (Feed) ---

publishPostButton.addEventListener('click', async () => {
    const content = postContentInput.value.trim();

    if (!content) {
        alert('Por favor, escribe algo para publicar.');
        return;
    }

    const { data, error } = await supabase
        .from('posts')
        .insert([
            { user_id: currentUserId, content: content }
        ]);

    if (error) {
        console.error('Error al publicar:', error.message);
        alert('Error al publicar: ' + error.message);
    } else {
        postContentInput.value = '';
        console.log('Publicación exitosa.');
    }
});

async function loadPosts() {
    postsFeed.innerHTML = '<p class="loading-message">Cargando publicaciones...</p>';

    const { data: posts, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error al cargar publicaciones:', error.message);
        postsFeed.innerHTML = '<p class="loading-message error">Error al cargar publicaciones.</p>';
        return;
    }

    postsFeed.innerHTML = '';
    if (posts.length === 0) {
        postsFeed.innerHTML = '<p class="loading-message">No hay publicaciones para mostrar. ¡Sé el primero en publicar!</p>';
        return;
    }

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post-item');

        const avatarUrl = post.profiles?.avatar_url || 'https://via.placeholder.com/40';
        const username = post.profiles?.username || 'Usuario Desconocido';

        postElement.innerHTML = `
            <div class="post-header">
                <img src="${avatarUrl}" alt="${username}" class="post-avatar">
                <div class="post-user-info">
                    <a href="mi-perfil.html?id=${post.user_id}" class="post-username">${username}</a>
                    <span class="post-timestamp">${formatTimeAgo(post.created_at)}</span>
                </div>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
        `;
        postsFeed.appendChild(postElement);
    });
}

// --- Solicitudes de Amistad y Gestión de Amistades ---

async function loadFriendRequests() {
    friendRequestsList.innerHTML = '<p class="no-requests-message">Cargando solicitudes...</p>';

    const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('*, sender:sender_id(username, avatar_url)')
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending');

    if (error) {
        console.error('Error al cargar solicitudes de amistad:', error.message);
        friendRequestsList.innerHTML = '<p class="no-requests-message error">Error al cargar solicitudes.</p>';
        return;
    }

    friendRequestsList.innerHTML = '';
    if (requests.length === 0) {
        friendRequestsList.innerHTML = '<p class="no-requests-message">No hay solicitudes pendientes.</p>';
        return;
    }

    requests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.classList.add('friend-request-item');

        const senderAvatar = request.sender?.avatar_url || 'https://via.placeholder.com/50';
        const senderUsername = request.sender?.username || 'Usuario Desconocido';

        requestElement.innerHTML = `
            <img src="${senderAvatar}" alt="${senderUsername}" class="request-avatar">
            <div class="request-info">
                <span class="request-username">${senderUsername}</span> te envió una solicitud.
            </div>
            <div class="request-actions">
                <button class="accept-btn" data-request-id="${request.id}" data-sender-id="${request.sender_id}">Aceptar</button>
                <button class="reject-btn" data-request-id="${request.id}">Rechazar</button>
            </div>
        `;
        friendRequestsList.appendChild(requestElement);
    });

    friendRequestsList.querySelectorAll('.accept-btn').forEach(button => {
        button.addEventListener('click', (e) => handleFriendRequestAction(e.target.dataset.requestId, 'accepted', e.target.dataset.senderId));
    });
    friendRequestsList.querySelectorAll('.reject-btn').forEach(button => {
        button.addEventListener('click', (e) => handleFriendRequestAction(e.target.dataset.requestId, 'rejected'));
    });
}

async function handleFriendRequestAction(requestId, status, senderId = null) {
    const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: status })
        .eq('id', requestId);

    if (updateError) {
        console.error(`Error al ${status} solicitud:`, updateError.message);
        alert(`Error al ${status} solicitud: ` + updateError.message);
        return;
    }

    console.log(`Solicitud ${status} exitosamente.`);

    if (status === 'accepted' && senderId) {
        // Al aceptar, insertamos la amistad en la tabla 'friendships'
        const { error: friendshipError } = await supabase
            .from('friendships')
            .insert([
                { user1_id: currentUserId, user2_id: senderId }
            ]);

        if (friendshipError) {
            console.error('Error al establecer amistad:', friendshipError.message);
            alert('Error al establecer amistad: ' + friendshipError.message);
        } else {
            console.log(`Amistad entre ${currentUserId} y ${senderId} establecida.`);
            alert('¡Amistad establecida!');
        }
    }

    loadFriendRequests();
    loadPeopleSuggestions(); // Recargar sugerencias, ya que un usuario puede haber pasado a ser amigo
}

// --- Sugerencias de Personas ---

async function loadPeopleSuggestions() {
    peopleSuggestionsList.innerHTML = '<p class="no-suggestions-message">Cargando sugerencias...</p>';

    // Obtener IDs de usuarios con los que ya hay una relación (amigos o solicitudes pendientes)
    // 1. Amigos actuales del usuario
    const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

    if (friendError) {
        console.error('Error al obtener amistades:', friendError.message);
        return;
    }
    const friendIds = friendships.flatMap(f => [f.user1_id, f.user2_id]).filter(id => id !== currentUserId);


    // 2. Usuarios con solicitudes pendientes (enviadas o recibidas)
    const { data: requests, error: requestError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq('status', 'pending');

    if (requestError) {
        console.error('Error al obtener solicitudes pendientes:', requestError.message);
        return;
    }
    const requestedIds = requests.flatMap(r => [r.sender_id, r.receiver_id]).filter(id => id !== currentUserId);

    // Combinar IDs para exclusión
    const excludedIds = [...new Set([...friendIds, ...requestedIds, currentUserId])];

    // Consultar perfiles, excluyendo al usuario actual y a los que ya tienen relación
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .not('id', 'in', `(${excludedIds.join(',')})`) // Excluir IDs combinados
        .limit(5);

    if (error) {
        console.error('Error al cargar sugerencias de personas:', error.message);
        peopleSuggestionsList.innerHTML = '<p class="no-suggestions-message error">Error al cargar sugerencias.</p>';
        return;
    }

    peopleSuggestionsList.innerHTML = '';
    if (profiles.length === 0) {
        peopleSuggestionsList.innerHTML = '<p class="no-suggestions-message">No hay sugerencias por ahora.</p>';
        return;
    }

    profiles.forEach(profile => {
        const suggestionElement = document.createElement('div');
        suggestionElement.classList.add('person-suggestion-item');

        const avatarUrl = profile.avatar_url || 'https://via.placeholder.com/50';

        suggestionElement.innerHTML = `
            <img src="${avatarUrl}" alt="${profile.username}" class="suggestion-avatar">
            <div class="suggestion-info">
                <span class="suggestion-username">${profile.username}</span>
            </div>
            <div class="suggestion-actions">
                <button class="add-friend-btn" data-receiver-id="${profile.id}">Agregar</button>
            </div>
        `;
        peopleSuggestionsList.appendChild(suggestionElement);
    });

    peopleSuggestionsList.querySelectorAll('.add-friend-btn').forEach(button => {
        button.addEventListener('click', (e) => sendFriendRequest(e.target.dataset.receiverId));
    });
}

async function sendFriendRequest(receiverId) {
    // Es buena práctica deshabilitar el botón temporalmente
    const targetButton = event.target; // Captura el botón que fue clickeado
    if (targetButton) {
        targetButton.disabled = true;
        targetButton.textContent = 'Enviando...';
    }

    // Verificar si ya existe una solicitud pendiente o amistad antes de enviar
    const { data: existingRelations, error: checkError } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${currentUserId})`);
    
    if (checkError) {
        console.error('Error al verificar amistad existente:', checkError.message);
        alert('Error al enviar solicitud: ' + checkError.message);
        if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Agregar'; }
        return;
    }
    if (existingRelations && existingRelations.length > 0) {
        alert('Ya eres amigo/a de este usuario.');
        if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Amigos'; targetButton.style.backgroundColor = '#28a745'; } // Opcional: Cambiar estilo
        return;
    }

    const { data: existingRequests, error: reqCheckError } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`);
    
    if (reqCheckError) {
        console.error('Error al verificar solicitud pendiente:', reqCheckError.message);
        alert('Error al enviar solicitud: ' + reqCheckError.message);
        if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Agregar'; }
        return;
    }
    if (existingRequests && existingRequests.length > 0) {
        const req = existingRequests[0];
        if (req.status === 'pending') {
            alert('Ya existe una solicitud de amistad pendiente con este usuario.');
            if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Pendiente'; targetButton.style.backgroundColor = '#ffc107'; }
        } else if (req.status === 'accepted') { // Por si acaso, si no se filtró bien antes
            alert('Ya eres amigo/a de este usuario.');
            if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Amigos'; targetButton.style.backgroundColor = '#28a745'; }
        } else { // Si es rejected, podemos re-enviar
             const { error: insertError } = await supabase
                .from('friend_requests')
                .insert([{ sender_id: currentUserId, receiver_id: receiverId, status: 'pending' }]);
            
            if (insertError) {
                console.error('Error al reenviar solicitud de amistad:', insertError.message);
                alert('Error al enviar solicitud: ' + insertError.message);
                if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Agregar'; }
            } else {
                alert('Solicitud de amistad enviada con éxito.');
                if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Pendiente'; targetButton.style.backgroundColor = '#ffc107'; }
                loadPeopleSuggestions();
            }
        }
        return;
    }


    // Si no hay relaciones ni solicitudes pendientes, se envía la solicitud
    const { data, error } = await supabase
        .from('friend_requests')
        .insert([
            { sender_id: currentUserId, receiver_id: receiverId, status: 'pending' }
        ]);

    if (error) {
        console.error('Error al enviar solicitud de amistad:', error.message);
        alert('Error al enviar solicitud: ' + error.message);
        if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Agregar'; }
    } else {
        alert('Solicitud de amistad enviada con éxito.');
        if (targetButton) { targetButton.disabled = false; targetButton.textContent = 'Pendiente'; targetButton.style.backgroundColor = '#ffc107'; }
        loadPeopleSuggestions(); // Recargar sugerencias para actualizar el estado del botón
    }
}


// --- Realtime Subscriptions (para actualizaciones en vivo) ---

function setupRealtimeSubscriptions() {
    supabase
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
            console.log('Cambio en posts recibido!', payload);
            loadPosts();
        })
        .subscribe();

    // Filtra las notificaciones para solicitudes de amistad que me conciernen
    supabase
        .channel('public:friend_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${currentUserId}` }, payload => {
            console.log('Cambio en friend_requests recibido!', payload);
            loadFriendRequests();
            loadPeopleSuggestions();
        })
        .subscribe();

    // Filtra las notificaciones para amistades que me conciernen
    // Para que las sugerencias y el estado de los amigos se actualice si alguien me acepta o elimina
    supabase
        .channel('public:friendships')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `user1_id=eq.${currentUserId}||user2_id=eq.${currentUserId}` }, payload => {
            console.log('Cambio en friendships recibido!', payload);
            // Si hay cambios en amistades, recargar sugerencias para reflejar quién es amigo
            loadPeopleSuggestions();
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


// Iniciar la verificación de autenticación y carga de datos al cargar el DOM
document.addEventListener('DOMContentLoaded', checkAuthAndLoadData);