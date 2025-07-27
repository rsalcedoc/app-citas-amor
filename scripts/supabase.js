// scripts/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ihpfwakcpvrwsmkbtwnt.supabase.co';
// ADVERTENCIA DE SEGURIDAD: En una aplicación de producción real,
// NUNCA hardcodes tu clave API de Supabase de esta manera.
// Deberías usar variables de entorno (ej. con Vite/Webpack)
// o un backend para manejar esto de forma segura.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocGZ3YWtjcHZyd3Nta2J0d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODUxMzAsImV4cCI6MjA2MzI2MTEzMH0.u15jG9J3c0e1k2ugz9-Oi3BVreqc-3NTpcQgZlSZjLc'


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);