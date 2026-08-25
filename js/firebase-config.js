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
  apiKey: "AIzaSyAsJ6vqzxpi2HCG2cgCm9WpRvKGKw990u0",
  authDomain: "novedades-dpsn.firebaseapp.com",
  projectId: "novedades-dpsn",
  storageBucket: "novedades-dpsn.firebasestorage.app",
  messagingSenderId: "183094582836",
  appId: "1:183094582836:web:3bd88dc812fbdbb24af461"
};

// Inicialización (usa Firebase v9+ compat para simplicidad en GitHub Pages,
// sin necesidad de bundlers/build step)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
