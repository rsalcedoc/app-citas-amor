// scripts/mi-perfil.js

import { supabase } from './supabase.js';

// --- Referencias a elementos del DOM ---
const logoutButton = document.getElementById('logout');
const dropbtn = document.querySelector('.dropbtn');
const dropdownContent = document.querySelector('.dropdown-content');

// Elementos de la cabecera del perfil
const profileAvatar = document.getElementById('profileAvatar');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const coverPhoto = document.getElementById('coverPhoto');
const editProfileBtn = document.getElementById('editProfileBtn');

// Elementos del modal de edición
const editProfileModal = document.getElementById('editProfileModal');
const closeButton = editProfileModal.querySelector('.close-button');
const profileForm = document.getElementById('profileForm');
const usernameInput = document.getElementById('usernameInput');
const bioInput = document.getElementById('bioInput');
const ageInput = document.getElementById('ageInput');
const genderSelect = document.getElementById('genderSelect');
const locationInput = document.getElementById('locationInput');
const interestsInput = document.getElementById('interestsInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');

// Elementos de la barra lateral izquierda
const genderInfo = document.getElementById('genderInfo');
const ageInfo = document.getElementById('ageInfo');
const locationInfo = document.getElementById('locationInfo');
const galleryPhotos = document.getElementById('galleryPhotos');
const galleryInput = document.getElementById('galleryInput');

// Elementos del área de publicaciones
const currentUserForPost = document.getElementById('currentUserForPost');
const postContentInput = document.getElementById('postContentInput');
const postImageInput = document.getElementById('postImageInput');
const publishPostBtn = document.getElementById('publishPostBtn');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const userPostsFeed = document.getElementById('user-posts-feed');

// Variables globales
let currentUserId = null;
const AVATAR_BUCKET_NAME = 'avatars';
const GALLERY_BUCKET_NAME = 'gallery';
const POST_MEDIA_BUCKET_NAME = 'post-media';

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

// --- Manejo del Modal de Edición ---
editProfileBtn.addEventListener('click', () => {
    editProfileModal.style.display = 'flex';
});

closeButton.addEventListener('click', () => {
    editProfileModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === editProfileModal) {
        editProfileModal.style.display = 'none';
    }
});

// --- Carga del Perfil del Usuario ---
async function loadUserProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.warn('Usuario no autenticado, redirigiendo a la página de inicio.');
        window.location.href = 'index.html';
        return;
    }

    currentUserId = user.id;

    // Cargar datos del perfil
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

    if (error) {
        console.error('Error al cargar el perfil:', error.message);
        alert('Error al cargar tu perfil: ' + error.message);
        return;
    }

    if (profile) {
        // Actualizar la cabecera
        profileUsername.textContent = profile.username || 'Tu Nombre';
        profileBio.textContent = profile.bio || 'Aún no tienes biografía.';
        profileAvatar.src = profile.avatar_url || 'https://via.placeholder.com/150';

        // Actualizar la información en la barra lateral
        genderInfo.textContent = profile.gender || 'N/A';
        ageInfo.textContent = profile.age || 'N/A';
        locationInfo.textContent = profile.location || 'N/A';
        
        // Cargar datos en el modal de edición
        usernameInput.value = profile.username || '';
        bioInput.value = profile.bio || '';
        ageInput.value = profile.age || '';
        genderSelect.value = profile.gender || '';
        locationInput.value = profile.location || '';
        interestsInput.value = profile.interests || '';

        // Actualizar el nombre en el área de post
        currentUserForPost.textContent = profile.username || '...';
        
        // Cargar galería y posts
        // Ahora tienes una columna 'gallery_photos' que es un JSONB
        displayGalleryPhotos(profile.gallery_photos);
        loadUserPosts();
    }
}

// --- Guardar Cambios del Perfil ---
profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Guardando...';

    const updates = {
        username: usernameInput.value.trim(),
        bio: bioInput.value.trim(),
        age: parseInt(ageInput.value) || null, // Convertir a número o null
        gender: genderSelect.value || null,
        location: locationInput.value.trim(),
        interests: interestsInput.value.trim(), // Se guarda como cadena
        updated_at: new Date().toISOString() // Actualiza la marca de tiempo
    };

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUserId);

    if (error) {
        console.error('Error al actualizar el perfil:', error.message);
        alert('Error al guardar: ' + error.message);
    } else {
        alert('¡Perfil actualizado exitosamente!');
        // Recargar el perfil para reflejar los cambios en el encabezado
        loadUserProfile();
    }

    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent = 'Guardar Cambios';
});


// --- Subir Avatar ---
avatarInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = `${currentUserId}-${Date.now()}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true // Sobrescribe el archivo si ya existe
        });

    if (error) {
        console.error('Error al subir el avatar:', error.message);
        alert('Error al subir el avatar.');
        return;
    }

    // Obtener la URL pública del avatar
    const { data: { publicUrl } } = supabase.storage.from(AVATAR_BUCKET_NAME).getPublicUrl(filePath);

    // Actualizar la tabla de perfiles con la nueva URL
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', currentUserId);
    loadUserProfile(); // Vuelve a cargar el perfil para ver el nuevo avatar
});


// --- Manejar Galería de Fotos ---
function displayGalleryPhotos(photosArray) {
    galleryPhotos.innerHTML = ''; // Limpia las fotos existentes
    if (!photosArray || photosArray.length === 0) {
        galleryPhotos.innerHTML = '<p class="no-photos-message">Aún no tienes fotos en tu galería.</p>';
        return;
    }
    
    photosArray.forEach(url => {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gallery-item');
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Foto de la galería';
        imgContainer.appendChild(img);
        galleryPhotos.appendChild(imgContainer);
    });
}

// Subir fotos a la galería
galleryInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let currentGallery = [];
    
    // Subir cada archivo seleccionado
    for (const file of files) {
        const fileName = `${currentUserId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${currentUserId}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(GALLERY_BUCKET_NAME)
            .upload(filePath, file);

        if (error) {
            console.error('Error al subir una foto de galería:', error.message);
            alert('Error al subir una foto.');
            continue; // Continúa con el siguiente archivo
        }

        const { data: { publicUrl } } = supabase.storage.from(GALLERY_BUCKET_NAME).getPublicUrl(filePath);
        currentGallery.push(publicUrl);
    }
    
    // Obtener la galería actual y añadir las nuevas fotos
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('gallery_photos')
        .eq('id', currentUserId)
        .single();
    
    if (profile) {
        const existingGallery = profile.gallery_photos || [];
        const updatedGallery = [...existingGallery, ...currentGallery];
        
        // Actualizar la base de datos con el nuevo array de URLs
        await supabase
            .from('profiles')
            .update({ gallery_photos: updatedGallery })
            .eq('id', currentUserId);
        
        loadUserProfile(); // Recargar el perfil para ver la galería actualizada
    }
});


// --- Manejo de la Publicación de Posts ---
postContentInput.addEventListener('input', () => {
    // Habilita el botón si hay contenido o una imagen
    if (postContentInput.value.trim().length > 0 || postImageInput.files.length > 0) {
        publishPostBtn.disabled = false;
    } else {
        publishPostBtn.disabled = true;
    }
});

postImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
        publishPostBtn.disabled = false;
    } else {
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '#';
        if (postContentInput.value.trim().length === 0) {
            publishPostBtn.disabled = true;
        }
    }
});

publishPostBtn.addEventListener('click', async () => {
    const postContent = postContentInput.value.trim();
    const postImageFile = postImageInput.files[0];

    if (!postContent && !postImageFile) {
        alert('La publicación no puede estar vacía.');
        return;
    }

    publishPostBtn.disabled = true;
    publishPostBtn.textContent = 'Publicando...';

    let mediaUrl = null;

    if (postImageFile) {
        const fileName = `${Date.now()}-${postImageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${currentUserId}/${fileName}`; // Subir a una subcarpeta del usuario

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(POST_MEDIA_BUCKET_NAME)
            .upload(filePath, postImageFile);
            
        if (uploadError) {
            console.error('Error al subir la imagen:', uploadError.message);
            alert('Error al subir la imagen.');
            publishPostBtn.disabled = false;
            publishPostBtn.textContent = 'Publicar';
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from(POST_MEDIA_BUCKET_NAME).getPublicUrl(filePath);
        mediaUrl = publicUrl;
    }

    const { data, error } = await supabase
        .from('posts')
        .insert([{
            user_id: currentUserId,
            content: postContent,
            media_url: mediaUrl
        }]);

    if (error) {
        console.error('Error al crear la publicación:', error.message);
        alert('Error al crear la publicación.');
    } else {
        console.log('Publicación creada con éxito.');
        postContentInput.value = '';
        postImageInput.value = '';
        imagePreviewContainer.style.display = 'none';
        loadUserPosts(); // Recargar el feed de publicaciones del usuario
    }

    publishPostBtn.disabled = false;
    publishPostBtn.textContent = 'Publicar';
});

// --- Cargar las publicaciones del usuario actual ---
async function loadUserPosts() {
    if (!currentUserId) return;

    userPostsFeed.innerHTML = '<p class="loading-message">Cargando publicaciones...</p>';

    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles(username, avatar_url)
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al cargar las publicaciones:', error.message);
        userPostsFeed.innerHTML = '<p class="loading-message error">Error al cargar las publicaciones.</p>';
        return;
    }

    if (posts.length === 0) {
        userPostsFeed.innerHTML = '<p class="loading-message">Aún no has hecho publicaciones.</p>';
        return;
    }

    userPostsFeed.innerHTML = '';
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post-item');
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.profiles.avatar_url || 'https://via.placeholder.com/50'}" alt="Avatar" class="post-avatar">
                <div class="post-user-info">
                    <span class="post-username">${post.profiles.username}</span>
                    <span class="post-timestamp">${new Date(post.created_at).toLocaleString()}</span>
                </div>
            </div>
            <div class="post-content">
                <p>${post.content || ''}</p>
                ${post.media_url ? `<img src="${post.media_url}" alt="Imagen de la publicación" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 8px;">` : ''}
            </div>
        `;
        userPostsFeed.appendChild(postElement);
    });
}

// --- Evento de Carga Inicial ---
document.addEventListener('DOMContentLoaded', loadUserProfile);

// --- Logout ---
logoutButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión.');
    } else {
        window.location.href = 'index.html';
    }
});