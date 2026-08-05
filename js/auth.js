// ============================================================
// AUTENTICACIÓN — Novedades DPSN
// ============================================================
// Mientras el proyecto de Firebase real no esté conectado
// (firebase-config.js con las claves de ejemplo "REEMPLAZAR..."),
// el sistema funciona en MODO DEMO: acepta el usuario/clave de
// prueba que figura abajo, para que puedas navegar el sistema.
// Cuando conectes Firebase de verdad, este modo se desactiva solo.
// ============================================================

const DEMO_MODE = (typeof firebaseConfig !== "undefined") &&
  firebaseConfig.apiKey === "REEMPLAZAR_API_KEY";

const DEMO_USUARIOS = {
  "demo@pna.gob.ar": { clave: "demo1234", perfil: USUARIO_DEMO }
};

function guardarSesion(usuario) {
  sessionStorage.setItem("novedades_dpsn_usuario", JSON.stringify(usuario));
}

function obtenerSesion() {
  const raw = sessionStorage.getItem("novedades_dpsn_usuario");
  return raw ? JSON.parse(raw) : null;
}

function cerrarSesion() {
  sessionStorage.removeItem("novedades_dpsn_usuario");
  if (!DEMO_MODE && typeof auth !== "undefined") {
    auth.signOut();
  }
  window.location.href = "index.html";
}

async function iniciarSesion(email, clave, mostrarError) {
  if (DEMO_MODE) {
    const u = DEMO_USUARIOS[email.trim().toLowerCase()];
    if (u && u.clave === clave) {
      guardarSesion({ email, ...u.perfil });
      window.location.href = "seleccion.html";
    } else {
      mostrarError("Usuario o contraseña incorrectos. (Modo demo: usá demo@pna.gob.ar / demo1234)");
    }
    return;
  }

  // Flujo real con Firebase Authentication + Firestore
  try {
    const cred = await auth.signInWithEmailAndPassword(email, clave);
    const doc = await db.collection("usuarios").doc(cred.user.uid).get();
    if (!doc.exists) {
      mostrarError("Tu usuario no tiene un perfil de permisos asignado. Contactá al administrador.");
      await auth.signOut();
      return;
    }
    guardarSesion({ email, uid: cred.user.uid, ...doc.data() });
    window.location.href = "seleccion.html";
  } catch (err) {
    mostrarError("No se pudo iniciar sesión. Verificá el usuario y la contraseña.");
  }
}

/** Protege una página: si no hay sesión, redirige al login. */
function requerirSesion() {
  const u = obtenerSesion();
  if (!u) {
    window.location.href = "index.html";
    return null;
  }
  return u;
}
