import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    // >>> INICIO DE LA LÓGICA CORREGIDA PARA MANEJAR EL ERROR DE USUARIO DUPLICADO <<<
    if (error.message.includes('User already registered')) {
      alert("⚠️ Este email ya está registrado. Por favor, inicia sesión.");
    } else {
      alert("❌ Error al registrarte: " + error.message);
    }
    // >>> FIN DE LA LÓGICA CORREGIDA <<<
    return;
  }

  alert("✅ Registro exitoso. Ahora completa tu perfil.");
  // Aquí es donde puedes agregar la lógica para crear el perfil si aún no lo tienes.
  // Por ejemplo:
  // await createProfileForNewUser(data.user.id, data.user.email);
  window.location.href = "encuesta_perfil.html";
});

document.getElementById('googleBtn').addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  });

  if (error) {
    alert("❌ Error con Google: " + error.message);
  }
});