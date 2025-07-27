import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ihpfwakcpvrwsmkbtwnt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'
);

window.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('encuestaForm');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    alert("❌ No has iniciado sesión.");
    window.location.href = "index.html";
    return;
  }

  const userId = session.user.id;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const edad = parseInt(document.getElementById('edad').value);
    const sexo = document.getElementById('sexo').value;
    const gustos = document.getElementById('gustos').value.trim();
    const deportes = document.getElementById('deportes').value.trim();

    const intereses = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(el => el.value);

    const { error } = await supabase.from('profiles').update({
      age: edad,
      sexo,
      intereses: intereses.join(', '),
      gustos,
      deportes
    }).eq('id', userId);

    if (error) {
      alert("❌ Error al guardar perfil: " + error.message);
    } else {
      alert("✅ Perfil completado");
      window.location.href = "home.html";
    }
  });
});
