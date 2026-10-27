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

// ============================================================
// CAMBIAR CONTRASEÑA (self-service)
// ============================================================
// Cada usuario puede cambiar su propia contraseña desde el sistema,
// sin que un administrador tenga que entrar a la Consola de Firebase.
// Así cada uno es responsable de la suya, y nadie más la sabe.
// Pide la contraseña actual para reautenticar (Firebase lo exige
// para esta operación) antes de fijar la nueva.
// ============================================================

function cerrarModalCambiarContrasena() {
  const m = document.getElementById("modalCambiarContrasena");
  if (m) m.remove();
}

function uiCambiarContrasena() {
  if (DEMO_MODE) {
    alert("El modo demo no tiene una contraseña real de Firebase para cambiar.");
    return;
  }
  cerrarModalCambiarContrasena();
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "modalCambiarContrasena";
  modal.innerHTML = `
    <div class="modal-caja">
      <div class="modal-header">
        <h3>Cambiar mi contraseña</h3>
        <button type="button" onclick="cerrarModalCambiarContrasena()">✕</button>
      </div>
      <div class="modal-campos">
        <div class="campo"><label>Contraseña actual</label><input type="password" id="ccActual" autocomplete="current-password"></div>
        <div class="campo"><label>Contraseña nueva (mínimo 6 caracteres)</label><input type="password" id="ccNueva" autocomplete="new-password"></div>
        <div class="campo"><label>Repetir contraseña nueva</label><input type="password" id="ccRepetir" autocomplete="new-password"></div>
        <p id="ccError" style="color:var(--rojo); font-size:12.5px; display:none; margin:4px 0 0;"></p>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalCambiarContrasena()">Cancelar</button>
        <button class="btn-primario" type="button" id="btnGuardarContrasena">Guardar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const mostrarError = (msg) => {
    const el = document.getElementById("ccError");
    el.textContent = msg;
    el.style.display = "block";
  };

  document.getElementById("btnGuardarContrasena").addEventListener("click", async () => {
    const actual = document.getElementById("ccActual").value;
    const nueva = document.getElementById("ccNueva").value;
    const repetir = document.getElementById("ccRepetir").value;
    if (!actual || !nueva || !repetir) { mostrarError("Completá los tres campos."); return; }
    if (nueva.length < 6) { mostrarError("La contraseña nueva tiene que tener al menos 6 caracteres."); return; }
    if (nueva !== repetir) { mostrarError("La contraseña nueva no coincide en los dos campos."); return; }

    const btn = document.getElementById("btnGuardarContrasena");
    btn.disabled = true;
    btn.textContent = "Guardando…";
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("sin-sesion");
      const cred = firebase.auth.EmailAuthProvider.credential(user.email, actual);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(nueva);
      cerrarModalCambiarContrasena();
      alert("Listo, tu contraseña se cambió correctamente. La próxima vez que entres, usá la nueva.");
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Guardar";
      if (["auth/wrong-password", "auth/invalid-credential", "auth/invalid-login-credentials"].includes(err.code)) {
        mostrarError("La contraseña actual es incorrecta.");
      } else if (err.code === "auth/weak-password") {
        mostrarError("La contraseña nueva es muy débil. Probá con otra.");
      } else if (err.code === "auth/requires-recent-login" || err.message === "sin-sesion") {
        mostrarError("Tu sesión expiró. Cerrá sesión, volvé a entrar y probá de nuevo.");
      } else {
        mostrarError("No se pudo cambiar la contraseña. Probá de nuevo en un momento.");
      }
    }
  });
}
