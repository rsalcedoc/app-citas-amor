// scripts/mi-perfil.js

import { supabase } from './supabase.js';

// --- Referencias a elementos del DOM ---
const logoutButton = document.getElementById('logout');
const dropbtn = document.querySelector('.dropbtn');
const dropdownContent = document.querySelector('.dropdown-content');

const profileAvatar = document.getElementById('profileAvatar');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');

const profileForm = document.getElementById('profileForm');
const usernameInput = document.getElementById('usernameInput');
const bioInput = document.getElementById('bioInput');
const ageInput = document.getElementById('ageInput');
const genderSelect = document.getElementById('genderSelect');
const locationInput = document.getElementById('locationInput');
const interestsInput = document.getElementById('interestsInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');

const avatarInput = document.getElementById('avatarInput');
const galleryPhotos = document.getElementById('galleryPhotos');
const galleryInput = document.getElementById('galleryInput');
const uploadGalleryBtn = document.getElementById('uploadGalleryBtn');

let currentUserId = null;
const SUPABASE_STORAGE_BUCKET = 'avatars-and-gallery'; // Nombre del bucket que creaste

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

// --- Carga del Perfil del Usuario ---
async function loadUserProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.warn('Usuario no autenticado, redirigiendo a la página de inicio.');
        window.location.href = 'index.html'; // Redirige a la página de login/registro
        return;
    }

    currentUserId = user.id;
    console.log('Usuario autenticado en Mi Perfil:', user.email, 'ID:', currentUserId);

    // Cargar datos del perfil de la tabla 'profiles'
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single(); // Espera un único resultado

    if (error) {
        console.error('Error al cargar el perfil:', error.message);
        alert('Error al cargar tu perfil: ' + error.message);
        return;
    }

    if (profile) {
        // Actualizar el DOM con los datos del perfil
        profileUsername.textContent = profile.username || 'Tu Nombre';
        profileBio.textContent = profile.bio || 'Aún no tienes biografía.';
        profileAvatar.src = profile.avatar_url || 'https://via.placeholder.com/150'; // Avatar por defecto

        usernameInput.value = profile.username || '';
        bioInput.value = profile.bio || '';
        ageInput.value = profile.age || '';
        genderSelect.value = profile.gender || '';
        locationInput.value = profile.location || '';
        interestsInput.value = profile.interests || ''; // Asume que es una cadena

        // Cargar galería de fotos
        displayGalleryPhotos(profile.gallery_photos);
    }
}

// --- Guardar Cambios del Perfil ---
profileForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evitar recarga de página

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
        alert('Error al guardar los cambios: ' + error.message);
    } else {
        alert('¡Perfil actualizado exitosamente!');
        // Recargar el perfil para reflejar los cambios en el encabezado
        loadUserProfile();
    }

    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent = 'Guardar Cambios';
});

// --- Gestión de Avatares ---
avatarInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Puedes mostrar un spinner o un mensaje de "subiendo"
    profileAvatar.src = 'https://via.placeholder.com/150?text=Subiendo...'; // Placeholder temporal

    const filePath = `${currentUserId}/avatar/${Date.now()}_${file.name}`; // Ruta única para el avatar

    const { data, error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600', // Cache por 1 hora
            upsert: true // Si ya existe, lo reemplaza
        });

    if (error) {
        console.error('Error al subir avatar:', error.message);
        alert('Error al subir avatar: ' + error.message);
        loadUserProfile(); // Vuelve a cargar el avatar original
        return;
    }

    // Obtener la URL pública del archivo subido
    const { data: publicURLData } = supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(filePath);

    if (publicURLData && publicURLData.publicUrl) {
        const publicUrl = publicURLData.publicUrl;
        console.log('Avatar subido, URL:', publicUrl);

        // Actualizar la URL del avatar en la tabla 'profiles'
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
            .eq('id', currentUserId);

        if (updateError) {
            console.error('Error al actualizar avatar_url en la BD:', updateError.message);
            alert('Error al guardar la URL del avatar: ' + updateError.message);
        } else {
            alert('¡Avatar actualizado!');
            profileAvatar.src = publicUrl; // Muestra la nueva imagen
        }
    } else {
        alert('Error al obtener la URL pública del avatar.');
        loadUserProfile();
    }
});

// --- Gestión de Galería de Fotos ---
function displayGalleryPhotos(photosArray) {
    galleryPhotos.innerHTML = ''; // Limpiar galería existente
    const noPhotosMessage = document.createElement('p');
    noPhotosMessage.classList.add('no-photos-message');
    noPhotosMessage.textContent = 'Aún no tienes fotos en tu galería.';

    if (!photosArray || photosArray.length === 0) {
        galleryPhotos.appendChild(noPhotosMessage);
        return;
    }

    photosArray.forEach((photoUrl, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.classList.add('gallery-item');
        photoDiv.innerHTML = `
            <img src="${photoUrl}" alt="Foto de Galería ${index + 1}">
            <button class="delete-gallery-photo-btn" data-url="${photoUrl}"><i class="fas fa-trash"></i></button>
        `;
        galleryPhotos.appendChild(photoDiv);
    });

    // Añadir event listeners a los botones de eliminar
    document.querySelectorAll('.delete-gallery-photo-btn').forEach(button => {
        button.addEventListener('click', deleteGalleryPhoto);
    });
}

galleryInput.addEventListener('change', (event) => {
    // Muestra el botón de subir una vez que se han seleccionado archivos
    if (event.target.files.length > 0) {
        uploadGalleryBtn.style.display = 'inline-block';
    } else {
        uploadGalleryBtn.style.display = 'none';
    }
});

uploadGalleryBtn.addEventListener('click', async () => {
    const files = galleryInput.files;
    if (files.length === 0) return;

    uploadGalleryBtn.disabled = true;
    uploadGalleryBtn.textContent = 'Subiendo...';

    const currentPhotos = await getCurrentGalleryPhotos(); // Obtener fotos actuales para no sobrescribir

    const uploadPromises = Array.from(files).map(async file => {
        const filePath = `${currentUserId}/gallery/${Date.now()}_${file.name}`; // Ruta única
        const { data, error } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(filePath, file, { cacheControl: '3600', upsert: false }); // No upsert si quieres añadir, no reemplazar

        if (error) {
            console.error(`Error al subir ${file.name}:`, error.message);
            return null; // Retorna null si hay un error
        }

        const { data: publicURLData } = supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(filePath);

        return publicURLData.publicUrl || null;
    });

    const newPhotoUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);

    if (newPhotoUrls.length > 0) {
        const updatedPhotos = [...(currentPhotos || []), ...newPhotoUrls]; // Combina las fotos
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ gallery_photos: updatedPhotos, updated_at: new Date().toISOString() })
            .eq('id', currentUserId);

        if (updateError) {
            console.error('Error al actualizar galería en la BD:', updateError.message);
            alert('Error al guardar las nuevas fotos: ' + updateError.message);
        } else {
            alert(`¡Se subieron ${newPhotoUrls.length} fotos a la galería!`);
            galleryInput.value = ''; // Limpiar input de archivo
            uploadGalleryBtn.style.display = 'none'; // Ocultar botón de subir
            loadUserProfile(); // Recargar el perfil para mostrar las nuevas fotos
        }
    } else {
        alert('No se pudo subir ninguna foto.');
    }

    uploadGalleryBtn.disabled = false;
    uploadGalleryBtn.textContent = 'Subir Nueva Foto';
});

async function getCurrentGalleryPhotos() {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('gallery_photos')
        .eq('id', currentUserId)
        .single();
    return profile?.gallery_photos || [];
}

async function deleteGalleryPhoto(event) {
    const button = event.currentTarget;
    const photoUrlToDelete = button.dataset.url;

    if (!confirm('¿Estás seguro de que quieres eliminar esta foto de tu galería?')) {
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const currentPhotos = await getCurrentGalleryPhotos();
    const updatedPhotos = currentPhotos.filter(url => url !== photoUrlToDelete);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ gallery_photos: updatedPhotos, updated_at: new Date().toISOString() })
        .eq('id', currentUserId);

    if (updateError) {
        console.error('Error al eliminar foto de galería en BD:', updateError.message);
        alert('Error al eliminar la foto: ' + updateError.message);
    } else {
        // También intenta eliminar del Storage para liberar espacio
        const pathSegments = photoUrlToDelete.split('/');
        const fileName = pathSegments.pop(); // Último segmento es el nombre del archivo
        const folder = pathSegments.pop(); // Penúltimo segmento es la carpeta (ej. 'gallery')
        const userIdFolder = pathSegments.pop(); // Antepenúltimo segmento es el ID del usuario

        if (folder && userIdFolder && fileName) {
            const storagePath = `${userIdFolder}/${folder}/${fileName}`;
            const { error: storageError } = await supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .remove([storagePath]);

            if (storageError) {
                console.warn('Advertencia: No se pudo eliminar la foto del almacenamiento de Supabase:', storageError.message);
            } else {
                console.log('Foto eliminada del almacenamiento:', storagePath);
            }
        }
        alert('¡Foto eliminada de la galería!');
        loadUserProfile(); // Recargar el perfil para actualizar la galería
    }
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

// Iniciar la carga del perfil al cargar el DOM
document.addEventListener('DOMContentLoaded', loadUserProfile);