document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const sidebarLinks = document.querySelectorAll('.config-sidebar .sidebar-link');
    const configSections = document.querySelectorAll('.config-content-area .config-section');

    // Elementos para la sección de Temas
    const lightModeBtn = document.getElementById('lightModeBtn');
    const darkModeBtn = document.getElementById('darkModeBtn');
    const body = document.body;
    const configPageContainer = document.querySelector('.config-page-container'); // Contenedor principal de la página de configuración


    // --- Lógica de Temas y Apariencia ---

    /**
     * Aplica el tema (claro u oscuro) a la página.
     * Guarda la preferencia en localStorage.
     * @param {string} theme 'light' o 'dark'.
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if (configPageContainer) {
                configPageContainer.classList.add('dark-mode');
            }
            // Actualiza el estado visual de los botones de tema
            if (lightModeBtn) lightModeBtn.classList.remove('active-theme');
            if (darkModeBtn) darkModeBtn.classList.add('active-theme');
        } else {
            body.classList.remove('dark-mode');
            if (configPageContainer) {
                configPageContainer.classList.remove('dark-mode');
            }
            // Actualiza el estado visual de los botones de tema
            if (lightModeBtn) lightModeBtn.classList.add('active-theme');
            if (darkModeBtn) darkModeBtn.classList.remove('active-theme');
        }
        localStorage.setItem('appTheme', theme); // Guarda la preferencia del usuario
    }

    // Cargar el tema guardado en localStorage al cargar la página
    const savedTheme = localStorage.getItem('appTheme') || 'light'; // Por defecto, tema claro
    applyTheme(savedTheme); // Aplica el tema al cargar

    // Event Listeners para los botones de tema
    if (lightModeBtn) {
        lightModeBtn.addEventListener('click', () => applyTheme('light'));
    }
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => applyTheme('dark'));
    }


    // --- Lógica para mostrar/ocultar secciones de configuración ---

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Evitar que el enlace navegue a una nueva página

            // 1. Quitar la clase 'active' de todos los enlaces de la barra lateral
            sidebarLinks.forEach(item => item.classList.remove('active'));

            // 2. Añadir la clase 'active' al enlace que fue clickeado
            event.currentTarget.classList.add('active');

            // 3. Ocultar todas las secciones de contenido
            configSections.forEach(section => section.classList.add('hidden'));

            // 4. Mostrar la sección de contenido correspondiente al enlace clickeado
            // El 'data-section' del enlace es 'general', 'security-login', etc.
            // El ID de la sección de contenido es 'general-content', 'security-login-content', etc.
            const targetSectionId = event.currentTarget.dataset.section + '-content';
            const targetSection = document.getElementById(targetSectionId);

            if (targetSection) {
                targetSection.classList.remove('hidden'); // Muestra la sección
            }
        });
    });

    // Asegurarse de que la sección activa inicialmente (por defecto 'general') se muestre
    // Esto se ejecuta una vez al cargar la página para que la primera sección sea visible.
    const initialActiveLink = document.querySelector('.config-sidebar .sidebar-link.active');
    if (initialActiveLink) {
        const initialSectionId = initialActiveLink.dataset.section + '-content';
        const initialSection = document.getElementById(initialSectionId);
        if (initialSection) {
            initialSection.classList.remove('hidden');
        }
    }


    // --- Lógica de Cerrar Sesión (signOut) ---
    // Se asume que esta lógica ya está en 'js/main.js' y es accesible globalmente
    // o que el 'main.js' se importa antes y su función de signOut está disponible.
    // Si no es así y quieres manejar el signOut directamente aquí, puedes descomentar y adaptar:

    /*
    // IMPORTANTE: Asegúrate de tener tu URL y clave de Supabase aquí si manejas el signOut localmente
    // y no desde main.js o un archivo global de Supabase.
    // import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
    // const SUPABASE_URL = 'https://ihpfwakcpvrwsmkbtwnt.supabase.co'; // Reemplaza con tu URL de Supabase
    // const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Reemplaza con tu clave ANON_KEY
    // const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // const signOutBtn = document.getElementById('signOut'); // Asume que el botón tiene este ID
    // if (signOutBtn) {
    //     signOutBtn.addEventListener('click', async (e) => {
    //         e.preventDefault(); // Previene la acción por defecto del enlace
    //         const { error } = await supabase.auth.signOut();
    //         if (error) {
    //             console.error('Error al cerrar sesión:', error.message);
    //             alert('Error al cerrar sesión: ' + error.message);
    //         } else {
    //             // Redirige a la página de login después de cerrar sesión
    //             window.location.href = 'login.html'; // Asegúrate de que esta ruta sea correcta
    //         }
    //     });
    // }
    */
});