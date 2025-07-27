// Referencias a formularios y elementos
const formLogin = document.getElementById('formLogin');
const usersList = document.getElementById('users-list');
const chatSection = document.getElementById('chat-section');
const chatBox = document.getElementById('chat-box');
const chatWith = document.getElementById('chat-with');
const messagesDiv = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const SUPABASE_URL = 'https://ihpfwakcpvrwsmkbtwnt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'; // (Anon key)
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log(client);

// Referencias a botones y modales
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const modalLogin = document.getElementById('modal-login');
const modalRegister = document.getElementById('modal-signup');
const signupForm = document.getElementById('form-signup');
const closeLogin = document.getElementById('close-login');
const closeRegister = document.getElementById('close-signup');


btnLogin.onclick = () => modalLogin.style.display = 'flex';
btnRegister.onclick = () => modalRegister.style.display = 'flex';
closeLogin.onclick = () => modalLogin.style.display = 'none';
closeRegister.onclick = () => modalRegister.style.display = 'none';


// Variables
let sers = [];
let currentUser = null;
let chattingWith = null;
let chatHistory = {};  // { "user1-user2": [{sender, text}, ...] }

// Mostrar modal
function showModal(modal) {
  if (modal) modal.style.display = 'flex';
}
// Ocultar modal
function hideModal(modal) {
  if (modal) modal.style.display = 'none';
}

// Renderizar lista de usuarios excepto el actual
function renderUsers() {
  usersList.innerHTML = '';
  users
    .filter(u => u.username !== currentUser.username)
    .forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.textContent = user.username;
      userDiv.classList.add('User');
      userDiv.onclick = () => openChat(user.username);
      usersList.appendChild(userDiv);
    });
}

// Abrir chat con usuario seleccionado
function openChat(userName) {
  chattingWith = userName;
  chatWith.textContent = chattingWith;
  chatBox.classList.remove('hidden');
  renderMessages();

}

// Renderizar mensajes en el chat
function renderMessages() {
  messagesDiv.innerHTML = '';
  const chatKey1 = `${currentUser.username}-${chattingWith}`;
  const chatKey2 = `${chattingWith}-${currentUser.username}`;
  const messages = chatHistory[chatKey1] || chatHistory[chatKey2] || [];

  messages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = msg.text;
    msgDiv.classList.add('message');
    if (msg.sender === currentUser.username) msgDiv.classList.add('own');
    messagesDiv.appendChild(msgDiv);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Evento enviar mensaje
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !chattingWith) return;

  const chatKey1 = `${currentUser.username}-${chattingWith}`;
  const chatKey2 = `${chattingWith}-${currentUser.username}`;

  if (!chatHistory[chatKey1] && !chatHistory[chatKey2]) {
    chatHistory[chatKey1] = [];
  }

  const keyToUse = chatHistory[chatKey1] ? chatKey1 : chatKey2;

  // Guardar en historial local
  chatHistory[keyToUse].push({ sender: currentUser.username, text });

  // Guardar en Supabase
  try {
    await client.from('chat_messages').insert([
      {
        sender_id: currentUser.username,
        receiver_id: chattingWith,
        message: text,
      }
    ]);
  } catch (error) {
    console.error('Error al guardar mensaje en Supabase:', error.message);
  }

  messageInput.value = '';
  renderMessages();
});


// Login
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = formLogin.querySelector('input[name="login-email"]').value;
  const password = formLogin.querySelector('input[name="login-password"]').value;


  console.log("Email:", email);
  console.log("Password:", password);

  const { data, error } = await client.auth.signIn({
    email,
    password,
  });

    if (error) {
      console.error('Error en login:', error.message);
    } else {
      console.log('Usuario:', data.user);
      window.location.href = 'home.html';
    }
  });

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  const { data, error } = await client.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Error en registro:', error.message);
    alert("❌ Error: " + error.message);
  } else {
    alert("✅ Registro exitoso. Por favor, verifica tu correo si es necesario.");

    // 🔁 Espera un segundo para confirmar que el usuario está logueado
    setTimeout(() => {
      window.location.href = 'crear_perfil.html';
    }, 1000);
  }
  
});









