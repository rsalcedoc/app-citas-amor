import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

const loginForm = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    mensaje.textContent = '❌ Error al iniciar sesión: ' + error.message;
  } else {
    mensaje.textContent = '✅ Sesión iniciada. Redirigiendo...';
    window.location.href = 'home.html';
  }
});

document.getElementById('googleBtn').addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) {
    mensaje.textContent = '❌ Error con Google: ' + error.message;
  }
});

document.getElementById('olvideContrasena').addEventListener('click', async () => {
  const email = prompt("Ingresa tu correo para recuperar la contraseña:");
  if (email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      mensaje.textContent = '❌ Error al enviar correo: ' + error.message;
    } else {
      mensaje.textContent = '📧 Se ha enviado un correo para recuperar tu contraseña.';
    }
  }
});
