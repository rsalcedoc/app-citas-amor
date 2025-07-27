// scripts/perfil_usuario.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session || !session.user) {
    alert("Debes iniciar sesión para ver tu perfil.");
    window.location.href = "iniciar_sesion.html";
    return;
  }

  const userId = session.user.id;

  const { data: perfil, error: errorPerfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (errorPerfil || !perfil) {
    alert("Error al cargar perfil.");
    return;
  }

  document.getElementById('avatar').src = perfil.avatar_url || "https://via.placeholder.com/120";
  document.getElementById('username').textContent = perfil.username;
  document.getElementById('age').textContent = perfil.age || "No definido";
  document.getElementById('sexo').textContent = perfil.sexo || "No definido";
  document.getElementById('location').textContent = perfil.location || "No definido";
  document.getElementById('preferencias').textContent = perfil.preferencias || "No definido";
  document.getElementById('gustos').textContent = perfil.gustos || "No definido";
  document.getElementById('deportes').textContent = perfil.deportes || "No definido";

  document.getElementById('editarPerfil').addEventListener('click', () => {
    window.location.href = 'encuesta_perfil.html';
  });
});
