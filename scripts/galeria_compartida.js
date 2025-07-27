import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

const galleryImageInput = document.getElementById('galleryImageInput');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const galleryGrid = document.getElementById('galleryGrid');
const loadingSpinner = document.getElementById('loadingSpinner');

let currentUserId = null; // Para almacenar el ID del usuario autenticado

// --- Funciones de Autenticación y Carga Inicial ---
async function checkAuthAndLoadGallery() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
            currentUserId = user.id;
            console.log('Usuario autenticado:', user.email, 'ID:', user.id);
            await loadGalleryImages(); // Cargar imágenes si hay usuario
        } else {
            console.log('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'login.html'; // Redirige si no está autenticado
        }
    } catch (error) {
        console.error('Error en autenticación o carga inicial:', error.message);
        alert('Error al verificar sesión: ' + error.message);
        window.location.href = 'login.html'; // Asegura redirección en caso de error
    }
}

// --- Funciones de Carga de Galería ---
async function loadGalleryImages() {
    showLoadingSpinner();
    try {
        // Obtenemos las URLs de las imágenes de la galería (ej. de una tabla 'gallery_photos')
        // Si aún no tienes una tabla 'gallery_photos', las obtendremos del Storage directamente
        
        // Opción 1: Obtener URLs de una tabla 'gallery_photos' (RECOMENDADO para metadatos)
        // Necesitarás una tabla 'gallery_photos' con columnas como id, user_id, image_url, caption, created_at
        const { data: photos, error: photosError } = await supabase
            .from('gallery_photos')
            .select('id, image_url, caption, profiles(username)') // Asume que 'profiles' está relacionada
            .order('created_at', { ascending: false });

        if (photosError) throw photosError;

        if (photos && photos.length > 0) {
            displayGallery(photos);
        } else {
            galleryGrid.innerHTML = '<p class="no-photos-message">¡Aún no hay fotos en la galería! Sube la primera.</p>';
        }

    } catch (error) {
        console.error('Error al cargar imágenes de la galería:', error.message);
        // Si la tabla no existe o hay un error, intentamos directamente del Storage
        try {
            const { data, error: listError } = await supabase.storage
                .from('avatars-and-gallery') // Tu bucket
                .list('gallery_photos/', { // Asumiendo una subcarpeta para la galería
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

            if (listError) throw listError;

            const galleryUrls = data
                .filter(file => file.name !== '.emptyFolderPlaceholder') // Ignorar placeholder
                .map(file => {
                    const publicUrl = supabase.storage
                        .from('avatars-and-gallery')
                        .getPublicUrl(`gallery_photos/${file.name}`).data.publicUrl;
                    return { image_url: publicUrl, caption: file.name.split('/').pop(), username: 'Desconocido' }; // Ajusta si tienes metadatos
                });

            if (galleryUrls.length > 0) {
                displayGallery(galleryUrls);
            } else {
                galleryGrid.innerHTML = '<p class="no-photos-message">¡Aún no hay fotos en la galería! Sube la primera.</p>';
            }

        } catch (storageError) {
            console.error('Error al listar archivos del Storage para la galería:', storageError.message);
            galleryGrid.innerHTML = '<p class="error-message">Error al cargar la galería. Intenta de nuevo más tarde.</p>';
        }
    } finally {
        hideLoadingSpinner();
    }
}

function displayGallery(photos) {
    galleryGrid.innerHTML = ''; // Limpiar galería antes de mostrar
    photos.forEach((photo, index) => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        // Aplica un delay a la animación para cada tarjeta
        photoCard.style.animationDelay = `${index * 0.1}s`;

        photoCard.innerHTML = `
            <img src="${photo.image_url}" alt="${photo.caption || 'Foto de galería'}">
            <div class="photo-details">
                <p class="photo-caption">${photo.caption || 'Sin descripción'}</p>
                ${photo.profiles ? `<p class="uploaded-by">Por: ${photo.profiles.username || 'Usuario desconocido'}</p>` : ''}
            </div>
        `;
        galleryGrid.appendChild(photoCard);
    });
}

// --- Funciones de Subida de Imagen ---
galleryImageInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        uploadImageBtn.style.display = 'inline-block'; // Mostrar botón de subir
    } else {
        uploadImageBtn.style.display = 'none';
    }
});

uploadImageBtn.addEventListener('click', async () => {
    const file = galleryImageInput.files[0];
    if (!file) {
        alert('Por favor, selecciona una imagen para subir.');
        return;
    }

    if (!currentUserId) {
        alert('Debes iniciar sesión para subir fotos.');
        return;
    }

    showLoadingSpinner();
    // Nueva Ruta: Directamente en la carpeta del usuario, pero con un prefijo para distinguir de avatares
    // Ejemplo: avatars-and-gallery/USER_ID/gallery_foto_timestamp.ext
    const filePath = `${currentUserId}/gallery_${Date.now()}_${file.name}`; // <-- ¡Cambio clave aquí!

    try {
        const { data, error } = await supabase.storage
            .from('avatars-and-gallery') // Tu bucket
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false // No sobrescribir si ya existe
            });

        if (error) throw error;

        // Obtener la URL pública
        const publicUrl = supabase.storage
            .from('avatars-and-gallery')
            .getPublicUrl(filePath).data.publicUrl;

        console.log('Imagen subida con éxito:', publicUrl);
        alert('¡Imagen subida con éxito!');

        // Opcional: Guardar metadatos en una tabla de la base de datos
        // Esto es HIGHLY RECOMENDED para gestionar las imágenes de la galería
        const { error: dbError } = await supabase
            .from('gallery_photos')
            .insert([
                { user_id: currentUserId, image_url: publicUrl, caption: file.name.split('.')[0] } // Puedes pedir un caption al usuario
            ]);

        if (dbError) throw dbError;
        
        // Recargar la galería para mostrar la nueva imagen
        await loadGalleryImages();
        galleryImageInput.value = ''; // Limpiar input de archivo
        uploadImageBtn.style.display = 'none'; // Ocultar botón de subir

    } catch (error) {
        console.error('Error al subir la imagen:', error.message);
        alert('Error al subir la imagen: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
});

// --- UI Helpers ---
function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
    galleryGrid.innerHTML = ''; // Limpia el contenido mientras carga
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
        window.location.href = 'login.html';
    }
});

// Iniciar la carga de la galería al cargar la página
checkAuthAndLoadGallery();