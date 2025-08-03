// scripts/home.js

import { supabase } from './supabase.js';

// Referencias a elementos del DOM (existentes)
const logoutButton = document.getElementById('logout');
const dropbtn = document.querySelector('.dropbtn');
const dropdownContent = document.querySelector('.dropdown-content');

const postContentInput = document.getElementById('postContent');
const publishPostButton = document.getElementById('publishPost');
const postsFeed = document.getElementById('postsFeed');
const friendRequestsList = document.getElementById('friendRequestsList');
const peopleSuggestionsList = document.getElementById('peopleSuggestionsList');

// Nuevas referencias a elementos del DOM para la creación de posts multimedia y perfil de usuario
const currentUserAvatar = document.getElementById('currentUserAvatar');
const currentUsernameSpan = document.getElementById('currentUsername');
const imageUploadInput = document.getElementById('imageUpload');
const videoUploadInput = document.getElementById('videoUpload');
const audioUploadInput = document.getElementById('audioUpload');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const uploadVideoBtn = document.getElementById('uploadVideoBtn');
const uploadAudioBtn = document.getElementById('uploadAudioBtn');
const mediaPreview = document.getElementById('mediaPreview');
const postMessage = document.getElementById('postMessage'); // Para mensajes de feedback

let currentUserId = null; // Para almacenar el ID del usuario actual
let selectedFile = null; // Para almacenar el archivo seleccionado (imagen, video o audio)
let fileType = null;     // Para almacenar el tipo de archivo ('image', 'video', 'audio')

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

function showMessage(msg, isError = false) {
    postMessage.textContent = msg;
    postMessage.classList.remove('error');
    if (isError) {
        postMessage.classList.add('error');
    }
    postMessage.style.display = 'block';
    // Ocultar el mensaje después de 5 segundos con un fade out
    setTimeout(() => {
        postMessage.style.opacity = '0';
        setTimeout(() => {
            postMessage.style.display = 'none';
            postMessage.style.opacity = '1'; // Resetear opacidad para la próxima vez
        }, 500); // Duración del fade out
    }, 4500); // 4.5 segundos antes de iniciar el fade out
}

// --- Lógica de Autenticación y Carga Inicial (CORREGIDO) ---

// Esta función se encarga de verificar y crear el perfil si no existe.
async function createOrCheckProfile(user) {
    if (!user) return;

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        // PGRST116 = "no rows found"
        if (error && error.code === 'PGRST116') {
            console.log("Perfil no encontrado para el usuario. Creando uno nuevo...");
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    username: user.email.split('@')[0], // Usar parte del email como nombre de usuario inicial
                    avatar_url: null, // Puedes establecer un avatar predeterminado
                    // ... otras columnas de tu tabla 'profiles'
                });

            if (insertError) {
                console.error("Error al crear el perfil:", insertError.message);
            } else {
                console.log("Perfil creado exitosamente para el usuario:", user.email);
            }
        } else if (error) {
            console.error("Error al verificar la existencia del perfil:", error.message);
        } else {
            console.log("El perfil del usuario ya existe.");
        }
    } catch (err) {
        console.error("Un error inesperado ocurrió en createOrCheckProfile:", err);
    }
}

// Esta es la función principal que se ejecuta al cargar la página
async function checkAuthAndLoadData() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.warn('Usuario no autenticado, redirigiendo a la página de inicio.');
        window.location.href = 'index.html';
        return;
    }

    currentUserId = user.id;
    console.log('Usuario autenticado:', user.email, 'ID:', currentUserId);

    // PASO CRÍTICO: Primero verifica y crea el perfil si es necesario
    await createOrCheckProfile(user);

    // Luego carga el resto de los datos de la aplicación
    displayCurrentUserProfile();
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

// --- Funcionalidad de Cerrar Sesión ---
logoutButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión: ' + error.message);
    } else {
        console.log('Sesión cerrada exitosamente.');
        window.location.href = 'index.html';
    }
});

// --- Mostrar Información del Usuario Logueado (AJUSTADO) ---
async function displayCurrentUserProfile() {
    if (!currentUserId) {
        console.warn('currentUserId no está disponible para mostrar el perfil.');
        return;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', currentUserId)
        .single(); // Esto ahora debería funcionar, ya que hemos limpiado las duplicaciones

    if (error) {
        console.error('Error al cargar el perfil del usuario actual:', error.message);
        currentUsernameSpan.textContent = 'Error';
        currentUserAvatar.src = 'https://via.placeholder.com/40';
        return;
    }
    currentUsernameSpan.textContent = profile.username || 'Tu Perfil';
    currentUserAvatar.src = profile.avatar_url || 'https://via.placeholder.com/40';
    currentUserAvatar.alt = profile.username || 'Tu Avatar';

    if (profile) {
        currentUsernameSpan.textContent = profile.username || 'Tu Perfil';
        currentUserAvatar.src = profile.avatar_url || 'https://via.placeholder.com/40';
        currentUserAvatar.alt = profile.username || 'Tu Avatar';
    } else {
        console.warn('Perfil de usuario no encontrado en la base de datos.');
        currentUsernameSpan.textContent = 'Perfil no encontrado';
        currentUserAvatar.src = 'https://via.placeholder.com/40';
    }
}

// --- Manejo de la subida y previsualización de archivos (NUEVO) ---

// Asignar listeners a los botones que simulan el click en el input file
uploadImageBtn.addEventListener('click', () => imageUploadInput.click());
uploadVideoBtn.addEventListener('click', () => videoUploadInput.click());
uploadAudioBtn.addEventListener('click', () => audioUploadInput.click());

// Asignar listeners a los inputs de tipo file para detectar cuando se selecciona un archivo
imageUploadInput.addEventListener('change', (event) => handleFileSelect(event.target.files[0], 'image'));
videoUploadInput.addEventListener('change', (event) => handleFileSelect(event.target.files[0], 'video'));
audioUploadInput.addEventListener('change', (event) => handleFileSelect(event.target.files[0], 'audio'));

function handleFileSelect(file, type) {
    if (file) {
        // Reiniciar los otros inputs para que solo uno tenga un archivo
        imageUploadInput.value = '';
        videoUploadInput.value = '';
        audioUploadInput.value = '';

        selectedFile = file;
        fileType = type;
        const reader = new FileReader();

        reader.onload = (e) => {
            mediaPreview.innerHTML = ''; // Limpiar previsualización anterior
            let mediaElement;

            if (type === 'image') {
                mediaElement = document.createElement('img');
                mediaElement.src = e.target.result;
                mediaElement.alt = 'Preview';
            } else if (type === 'video') {
                mediaElement = document.createElement('video');
                mediaElement.src = e.target.result;
                mediaElement.controls = true;
                mediaElement.autoplay = false; // No autoplay en la preview
                mediaElement.muted = true; // Silenciar por defecto en preview
            } else if (type === 'audio') {
                mediaElement = document.createElement('audio');
                mediaElement.src = e.target.result;
                mediaElement.controls = true;
                mediaElement.autoplay = false;
            }

            if (mediaElement) {
                mediaPreview.appendChild(mediaElement);
                // Añadir botón para remover el archivo
                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-media-btn');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', clearMediaSelection);
                mediaPreview.appendChild(removeBtn);
            }
        };
        reader.readAsDataURL(file);
    } else {
        clearMediaSelection();
    }
}

function clearMediaSelection() {
    selectedFile = null;
    fileType = null;
    mediaPreview.innerHTML = '';
    imageUploadInput.value = ''; // Resetear el input file para que se pueda seleccionar el mismo archivo de nuevo
    videoUploadInput.value = '';
    audioUploadInput.value = '';
}


// --- Publicaciones (Feed) - CORREGIDO el nombre del bucket ---

// ... (código anterior) ...

publishPostButton.addEventListener('click', async () => {
    // ... (tu código para el contenido y el archivo seleccionado) ...

    let mediaUrl = null;
    let postMediaType = null;
    const bucketName = 'post-media'; // Asegúrate de que este es el nombre correcto

    if (selectedFile) {
        // Generar un nombre único para el archivo
        // Ahora se usa solo el nombre del archivo, sin la carpeta del usuario en el path
        const filePath = `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, selectedFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error al subir el archivo:', uploadError.message);
            showMessage('Error al subir el archivo: ' + uploadError.message, true);
            publishPostButton.disabled = false;
            publishPostButton.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar';
            return;
        }

        // Obtener la URL pública del archivo subido
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        mediaUrl = publicUrlData.publicUrl;
        postMediaType = fileType;
        console.log('Archivo subido, URL:', mediaUrl);
    }

    // Insertar la publicación en la base de datos (con o sin media)
    const { data: postData, error: insertError } = await supabase
        .from('posts')
        .insert([
            {
                user_id: currentUserId,
                content: content,
                media_url: mediaUrl,
                media_type: postMediaType
            }
        ]);

    if (insertError) {
        console.error('Error al publicar:', insertError.message);
        showMessage('Error al publicar: ' + insertError.message, true);
    } else {
        postContentInput.value = '';
        clearMediaSelection();
        showMessage('✅ Publicación exitosa.', false);
        console.log('Publicación exitosa.');
    }
    publishPostButton.disabled = false;
    publishPostButton.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar';
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

        let mediaHtml = '';
        if (post.media_url && post.media_type) {
            if (post.media_type === 'image') {
                mediaHtml = `<div class="post-media"><img src="${post.media_url}" alt="Publicación"></div>`;
            } else if (post.media_type === 'video') {
                mediaHtml = `<div class="post-media"><video src="${post.media_url}" controls></video></div>`;
            } else if (post.media_type === 'audio') {
                mediaHtml = `<div class="post-media"><audio src="${post.media_url}" controls></audio></div>`;
            }
        }

        // Contenido de texto: si no hay contenido pero sí multimedia, se usa un string vacío.
        // Esto previene que muestre 'null' o 'undefined' en el HTML.
        const postTextContent = post.content ? `<p>${post.content}</p>` : '';

        postElement.innerHTML = `
            <div class="post-header">
                <img src="${avatarUrl}" alt="${username}" class="post-avatar">
                <div class="post-user-info">
                    <a href="mi-perfil.html?id=${post.user_id}" class="post-username">${username}</a>
                    <span class="post-timestamp">${formatTimeAgo(post.created_at)}</span>
                </div>
            </div>
            <div class="post-content">
                ${postTextContent}
                ${mediaHtml}
            </div>
        `;
        postsFeed.appendChild(postElement);
    });
}

// --- Solicitudes de Amistad y Gestión de Amistades (Existente, sin cambios funcionales) ---

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
        // Asegúrate de que no exista ya una amistad para evitar duplicados
        const { data: existingFriendship, error: checkError } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${senderId}),and(user1_id.eq.${senderId},user2_id.eq.${currentUserId})`);

        if (checkError) {
            console.error('Error al verificar amistad existente:', checkError.message);
            return;
        }

        if (existingFriendship && existingFriendship.length === 0) {
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
                // alert('¡Amistad establecida!'); // Comentado para evitar popups excesivos
            }
        } else {
            console.log('Amistad ya existe o ha sido manejada previamente.');
        }
    }

    loadFriendRequests();
    loadPeopleSuggestions();
}



// --- Sugerencias de Personas ---

async function loadPeopleSuggestions() {
    peopleSuggestionsList.innerHTML = '<p class="no-suggestions-message">Cargando sugerencias...</p>';

    // Paso 1: Obtener IDs de amigos actuales
    const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

    if (friendError) {
        console.error('Error al obtener amistades:', friendError.message);
        peopleSuggestionsList.innerHTML = '<p class="no-suggestions-message error">Error al cargar sugerencias.</p>';
        return;
    }

    // Paso 2: Obtener IDs de solicitudes pendientes (enviadas o recibidas)
    const { data: requests, error: requestError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (requestError) {
        console.error('Error al obtener solicitudes pendientes:', requestError.message);
        // No es un error fatal para mostrar sugerencias, pero lo registramos
        // Podrías decidir si quieres retornar aquí o continuar sin considerar estas solicitudes.
    }

    // Paso 3: Construir un Set de IDs a excluir (amigos, solicitudes pendientes, y el propio usuario)
    const excludedIds = new Set();
    excludedIds.add(currentUserId); // Siempre excluir al usuario actual

    friendships.forEach(f => {
        excludedIds.add(f.user1_id);
        excludedIds.add(f.user2_id);
    });

    if (requests) { // Asegúrate de que 'requests' no sea null si hubo un error al cargarlas
        requests.forEach(r => {
            excludedIds.add(r.sender_id);
            excludedIds.add(r.receiver_id);
        });
    }

    // Convertir el Set a un Array para el filtro 'in' de Supabase
    const excludedIdsArray = Array.from(excludedIds);

    // Paso 4: Obtener perfiles que NO estén en la lista de excluidos
    let query = supabase
        .from('profiles')
        .select('id, username, avatar_url');

    // Solo aplica el filtro 'not.in' si hay IDs para excluir.
    // Si excludedIdsArray solo contiene el currentUserId, Supabase no necesita un 'not.in' complejo,
    // ya que el 'neq' ya lo cubre. Pero 'not.in' con un solo elemento también debería funcionar.
    // El problema es cuando el array de 'in' está vacío o mal formado.
    // La mejor práctica es siempre asegurarse de que el array del 'in' contenga al menos el currentUserId,
    // lo cual ya hacemos. El error "failed to parse filter" sugiere que el string URL se está generando mal.
    // Una posible solución es usar `neq` para el currentUserId, y luego `not.in` para el resto,
    // o simplemente asegurarse que el array para `not.in` nunca esté vacío.

    // Dada la traza del error `not.in.7539ff59-e5c7-...`, Supabase está interpretando el filtro como `not.in.<ID1>,<ID2>,...`
    // Si el array está vacío o solo con un elemento, es posible que el string `not.in.` se forme incorrectamente.
    // Vamos a forzar que la lista de IDs para 'in' sea siempre un array válido, incluso si solo contiene el user_id.

    // La sintaxis `not('id', 'in', excludedIdsArray)` ya debería manejar esto,
    // pero si el error persiste, la siguiente lógica es más explícita:

    if (excludedIdsArray.length > 0) { // Si hay IDs para excluir
        query = query.not('id', 'in', `(${excludedIdsArray.join(',')})`); // Usa un string formateado
    }
    // Nota: La sintaxis `not('id', 'in', excludedIdsArray)` (pasando el array directamente) es la recomendada por Supabase
    // y debería funcionar. Si da error, es posible que la versión del SDK o el servidor tenga un quirk.
    // El cambio `(${excludedIdsArray.join(',')})` es un intento de forzar el formato de cadena esperado.

    // Una alternativa más segura para el filtro si el `not.in` sigue dando problemas:
    // let profilesToExclude = Array.from(excludedIds);
    // if (profilesToExclude.length > 0) {
    //     // Construir una cláusula OR para excluir cada ID individualmente si `not.in` falla.
    //     // Esto es menos eficiente pero más robusto si hay un bug en el cliente/servidor de Supabase.
    //     const orConditions = profilesToExclude.map(id => `id.neq.${id}`).join(',');
    //     query = query.or(orConditions);
    // }


    const { data: profiles, error: profilesError } = await query.limit(5); // Limitar a unas pocas sugerencias

    if (profilesError) {
        console.error('Error al cargar perfiles sugeridos:', profilesError.message);
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

        const avatar = profile.avatar_url || 'https://via.placeholder.com/50';
        const username = profile.username || 'Usuario Desconocido';

        suggestionElement.innerHTML = `
            <img src="${avatar}" alt="${username}" class="suggestion-avatar">
            <div class="suggestion-info">
                <span class="suggestion-username">${username}</span>
            </div>
            <div class="suggestion-actions">
                <button class="send-request-btn" data-receiver-id="${profile.id}">Añadir</button>
            </div>
        `;
        peopleSuggestionsList.appendChild(suggestionElement);
    });

    peopleSuggestionsList.querySelectorAll('.send-request-btn').forEach(button => {
        button.addEventListener('click', (e) => sendFriendRequest(e.target.dataset.receiverId, e.target));
    });
}

// ... (resto de tu código) ...

async function sendFriendRequest(receiverId, buttonElement) {
    if (!currentUserId) {
        alert('Debes iniciar sesión para enviar solicitudes de amistad.');
        return;
    }

    buttonElement.disabled = true;
    buttonElement.textContent = 'Enviando...';

    const { data, error } = await supabase
        .from('friend_requests')
        .insert([
            { sender_id: currentUserId, receiver_id: receiverId, status: 'pending' }
        ]);

    if (error) {
        console.error('Error al enviar solicitud de amistad:', error.message);
        alert('Error al enviar solicitud: ' + error.message);
        buttonElement.disabled = false;
        buttonElement.textContent = 'Añadir';
    } else {
        alert('Solicitud de amistad enviada!');
        buttonElement.textContent = 'Solicitud Enviada';
        // No deshabilitar el botón si ya está enviado, para evitar múltiples clics
        // Recargamos las sugerencias para que ese usuario desaparezca
        loadPeopleSuggestions();
    }
}


// --- Suscripciones en Tiempo Real (Existente) ---

function setupRealtimeSubscriptions() {
    // Suscripción para nuevas publicaciones
    supabase
        .channel('posts_feed')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'posts'
        }, payload => {
            console.log('Nueva publicación en tiempo real:', payload);
            loadPosts(); // Recargar todos los posts para incluir el nuevo
        })
        .subscribe();

    // Suscripción para solicitudes de amistad (INSERT y UPDATE para cambios de estado)
    supabase
        .channel('friend_requests_channel')
        .on('postgres_changes', {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'friend_requests',
            filter: `receiver_id=eq.${currentUserId}` // Solo para el usuario actual como receptor
        }, payload => {
            console.log('Cambio en solicitudes de amistad:', payload);
            loadFriendRequests();
            loadPeopleSuggestions(); // También recargar sugerencias, ya que el estado de amistad cambia
        })
        .subscribe();

    // Suscripción para nuevas amistades (para cargar sugerencias si alguien se hace amigo)
    supabase
        .channel('friendships_channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'friendships',
            filter: `user1_id=eq.${currentUserId}|user2_id=eq.${currentUserId}`
        }, payload => {
            console.log('Nueva amistad:', payload);
            loadPeopleSuggestions(); // Recargar sugerencias si se forma una nueva amistad
        })
        .subscribe();
}


// --- Inicialización al cargar el DOM ---
document.addEventListener('DOMContentLoaded', checkAuthAndLoadData);