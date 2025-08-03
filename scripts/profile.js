import { supabase } from './supabase.js';

// Referencias a los elementos del DOM
const profileUsername = document.getElementById('profileUsername');
const profileUserId = document.getElementById('profileUserId');
const profileAvatar = document.getElementById('profileAvatar');
const postsContainer = document.getElementById('postsContainer');

// Función para cargar los datos del perfil
async function loadUserProfile(userId) {
    if (!userId) {
        profileUsername.textContent = 'Perfil no encontrado';
        profileUserId.textContent = 'N/A';
        postsContainer.innerHTML = '<p class="no-content-message">ID de usuario no especificado.</p>';
        return;
    }

    profileUserId.textContent = userId;

    // 1. Obtener los datos del perfil
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        console.error('Error al cargar el perfil:', profileError?.message);
        profileUsername.textContent = 'Perfil no encontrado';
        postsContainer.innerHTML = '<p class="no-content-message">El usuario no existe o hay un error.</p>';
        return;
    }

    // Mostrar los datos del perfil
    profileUsername.textContent = profile.username;
    profileAvatar.src = profile.avatar_url || 'https://via.placeholder.com/120';
    profileAvatar.alt = profile.username;

    // 2. Obtener las publicaciones del perfil
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (postsError) {
        console.error('Error al cargar las publicaciones:', postsError.message);
        postsContainer.innerHTML = '<p class="no-content-message">Error al cargar las publicaciones.</p>';
        return;
    }

    // Mostrar las publicaciones
    postsContainer.innerHTML = '';
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="no-content-message">Este usuario aún no tiene publicaciones.</p>';
    } else {
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('profile-post-item');
            postElement.innerHTML = `
                <p>${post.content}</p>
                <small>Publicado en: ${new Date(post.created_at).toLocaleString()}</small>
            `;
            postsContainer.appendChild(postElement);
        });
    }
}

// Iniciar la carga al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Obtener el ID del usuario de la URL
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');

    loadUserProfile(userId);
});