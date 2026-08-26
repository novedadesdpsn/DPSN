// ============================================================
// AUTENTICACIÓN — Novedades DPSN
// ============================================================
// El personal ingresa con su DNI, no con un correo. Firebase
// Authentication solo acepta direcciones con forma de e-mail, así
// que por dentro (de forma transparente para el usuario) armamos
// un correo interno: {DNI}@dpsn.pna.gob.ar. El usuario nunca ve ni
// escribe ese correo — solo su DNI y su contraseña.
//
// IMPORTANTE al crear cada usuario en Firebase Authentication
// (Console > Authentication > Users > Add user): en el campo
// "Email" hay que poner exactamente ese formato, por ejemplo
// 30123456@dpsn.pna.gob.ar para el DNI 30.123.456. A la persona
// solo le decís su DNI y la contraseña provisoria.
//
// Mientras el proyecto de Firebase real no esté conectado
// (firebase-config.js con las claves de ejemplo "REEMPLAZAR..."),
// el sistema funciona en MODO DEMO con el DNI/clave de prueba de
// abajo. Al completar las claves reales, el modo demo se apaga solo.
// ============================================================

const DEMO_MODE = (typeof firebaseConfig !== "undefined") &&
  firebaseConfig.apiKey === "REEMPLAZAR_API_KEY";

const DOMINIO_INTERNO = "dpsn.pna.gob.ar";

const DEMO_USUARIOS = {
  "30123456": { clave: "demo1234", perfil: USUARIO_DEMO }
};

function dniAEmailInterno(dni) {
  return `${dni.trim()}@${DOMINIO_INTERNO}`;
}

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

async function iniciarSesion(dni, clave, mostrarError) {
  const dniLimpio = dni.trim();

  if (DEMO_MODE) {
    const u = DEMO_USUARIOS[dniLimpio];
    if (u && u.clave === clave) {
      guardarSesion({ dni: dniLimpio, ...u.perfil });
      window.location.href = "dashboard.html";
    } else {
      mostrarError("DNI o contraseña incorrectos. (Modo demo: usá 30123456 / demo1234)");
    }
    return;
  }

  // Flujo real con Firebase Authentication + Firestore
  try {
    const emailInterno = dniAEmailInterno(dniLimpio);
    const cred = await auth.signInWithEmailAndPassword(emailInterno, clave);
    const doc = await db.collection("usuarios").doc(cred.user.uid).get();
    if (!doc.exists) {
      mostrarError("Tu usuario no tiene un perfil de permisos asignado. Contactá al administrador.");
      await auth.signOut();
      return;
    }
    guardarSesion({ dni: dniLimpio, uid: cred.user.uid, ...doc.data() });
    window.location.href = "dashboard.html";
  } catch (err) {
    mostrarError("No se pudo iniciar sesión. Verificá el DNI y la contraseña.");
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
