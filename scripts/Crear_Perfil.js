import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ihpfwakcpvrwsmkbtwnt.supabase.co';
// ADVERTENCIA DE SEGURIDAD: En una aplicación de producción real,
// NUNCA hardcodes tu clave API de Supabase de esta manera.
// Deberías usar variables de entorno o un backend para manejar esto de forma segura.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Referencias a elementos del DOM
const authStatus = document.getElementById('authStatus');
const form = document.getElementById('perfilForm');
const messageDiv = document.getElementById('message');

const usernameInput = document.getElementById('username');
const ageInput = document.getElementById('age');
const locationInput = document.getElementById('location');
const avatarUrlInput = document.getElementById('avatar_url');
const bioTextarea = document.getElementById('bio');

let currentUserId = null; // Para almacenar el ID del usuario actual

// Función para mostrar mensajes al usuario
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message show ${type}`; // Añade clases para estilo y visibilidad
    setTimeout(() => {
        messageDiv.classList.remove('show'); // Oculta el mensaje después de 5 segundos
    }, 5000);
}

// Lógica principal al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar la sesión del usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
        authStatus.textContent = "❌ No has iniciado sesión o la sesión ha expirado.";
        authStatus.classList.add('error');
        form.style.display = 'none'; // Ocultar el formulario si no hay sesión
        return;
    }

    authStatus.textContent = "✅ Sesión iniciada como: " + session.user.email;
    authStatus.classList.add('success');
    currentUserId = session.user.id; // Guarda el ID del usuario

    // 2. Cargar perfil existente del usuario
    await loadUserProfile(currentUserId);

    // 3. Configurar el evento de envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const age = parseInt(ageInput.value);
        const location = locationInput.value.trim();
        const avatar_url = avatarUrlInput.value.trim();
        const bio = bioTextarea.value.trim();

        // Validaciones básicas adicionales
        if (!username || isNaN(age) || age < 18 || !location) {
            showMessage("Por favor, rellena todos los campos obligatorios (Nombre, Edad, Ciudad) y asegúrate que la edad sea válida.", "error");
            return;
        }

        // Realiza el upsert (inserta o actualiza) en la tabla 'profiles'
        const { error: upsertError } = await supabase.from('profiles').upsert([
            {
                id: currentUserId, // El ID del usuario es la clave primaria en 'profiles'
                username,
                age,
                location,
                avatar_url,
                bio
            }
        ]);

        if (upsertError) {
            showMessage("❌ Error al guardar el perfil: " + upsertError.message, "error");
            console.error("Detalles del error:", upsertError);
        } else {
            showMessage("✅ Perfil guardado con éxito.", "success");
            // Redirigir a la página principal después de un breve retraso
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1500); // Retraso de 1.5 segundos
        }
    });
});

// Función para cargar los datos del perfil si ya existen
async function loadUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('username, age, location, avatar_url, bio')
        .eq('id', userId)
        .single(); // Espera un solo registro

    if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows found"
        console.error("Error al cargar perfil existente:", error);
        showMessage("Hubo un error al cargar tu perfil. Intenta de nuevo.", "error");
        return;
    }

    if (data) {
        // Precargar los campos del formulario con los datos existentes
        usernameInput.value = data.username || '';
        ageInput.value = data.age || '';
        locationInput.value = data.location || '';
        avatarUrlInput.value = data.avatar_url || '';
        bioTextarea.value = data.bio || '';
        showMessage("Tu perfil existente ha sido cargado. Puedes hacer cambios.", "success");
    } else {
        // No se encontró perfil, es un usuario nuevo o no ha completado el perfil
        showMessage("Por favor, completa tu perfil por primera vez.", "success"); // O un mensaje más neutral
    }
}