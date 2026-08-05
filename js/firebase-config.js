// ============================================================
// CONFIGURACIÓN DE FIREBASE — Novedades DPSN
// ============================================================
// 1. Entrá a https://console.firebase.google.com con el Gmail
//    que vas a usar para este proyecto.
// 2. Creá un proyecto nuevo (ej: "novedades-dpsn").
// 3. Dentro del proyecto: Authentication > Sign-in method >
//    habilitá "Correo electrónico/contraseña".
// 4. Dentro del proyecto: Firestore Database > Crear base de
//    datos (modo producción, región sudamericana si está
//    disponible).
// 5. Configuración del proyecto (ícono de tuerca) > Tus apps >
//    Agregar app > Web (</>) > copiá el objeto "firebaseConfig"
//    y pegalo abajo, reemplazando los valores de ejemplo.
// ============================================================

const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "REEMPLAZAR.firebaseapp.com",
  projectId: "REEMPLAZAR",
  storageBucket: "REEMPLAZAR.appspot.com",
  messagingSenderId: "REEMPLAZAR",
  appId: "REEMPLAZAR"
};

// Inicialización (usa Firebase v9+ compat para simplicidad en GitHub Pages,
// sin necesidad de bundlers/build step)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
