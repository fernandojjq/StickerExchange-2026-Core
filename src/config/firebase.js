// ============================================================================
// ARCHIVO: src/config/firebase.js
// VERSIÓN: 11.0 - Configuración de Firebase Realtime Database
// ============================================================================

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuración de Firebase
// IMPORTANTE: Crear proyecto en https://console.firebase.google.com/
// 1. Crear proyecto nuevo
// 2. Ir a "Build" > "Realtime Database" > "Create Database"
// 3. Seleccionar ubicación cercana (ej: europe-west1)
// 4. Empezar en "Test Mode" (luego asegurar en producción)
// 5. Ir a Project Settings > Your apps > Web > Copiar config

const firebaseConfig = {
    // ⚠️ REEMPLAZAR con tus credenciales de Firebase
    // Estas son variables de entorno (crear archivo .env.local)
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener referencia a la base de datos
export const database = getDatabase(app);

// Exportar la app por si se necesita para otros servicios
export default app;
