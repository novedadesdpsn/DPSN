// ============================================================
// MODELO DE ROLES — Novedades DPSN
// ============================================================
// Cada usuario tiene UN documento en la colección "usuarios" de
// Firestore, con esta forma:
//
// usuarios/{uid}:
// {
//   nombre: "Apellido, Nombre",
//   jerarquia: "PR",
//   permisos: {
//     oficinas: "admin" | "lector" | null,
//     guardias: "admin" | "lector" | null
//   },
//   administradorGlobal: true | false   // Director, jefes de depto/división
// }
//
// Un usuario puede tener admin en un módulo y lector en el otro
// (o los dos iguales, o acceso a uno solo). administradorGlobal
// en true implica admin en ambos módulos sin importar "permisos".
// ============================================================

const ModuloAcceso = {
  OFICINAS: "oficinas",
  GUARDIAS: "guardias"
};

const NivelPermiso = {
  ADMIN: "admin",
  LECTOR: "lector",
  NINGUNO: null
};

/**
 * Devuelve el nivel de permiso efectivo de un usuario para un módulo.
 * @param {object} usuario - documento de Firestore del usuario
 * @param {string} modulo - "oficinas" | "guardias"
 * @returns {"admin"|"lector"|null}
 */
function obtenerPermiso(usuario, modulo) {
  if (!usuario) return null;
  if (usuario.administradorGlobal) return NivelPermiso.ADMIN;
  return (usuario.permisos && usuario.permisos[modulo]) || null;
}

function puedeVer(usuario, modulo) {
  return obtenerPermiso(usuario, modulo) !== null;
}

function puedeEditar(usuario, modulo) {
  return obtenerPermiso(usuario, modulo) === NivelPermiso.ADMIN;
}

// Usuario de ejemplo para poder previsualizar el sistema sin
// Firebase todavía conectado. Se reemplaza por el usuario real
// una vez que auth.js esté leyendo de Firestore.
const USUARIO_DEMO = {
  nombre: "Piccoli, Leonardo Agustín",
  jerarquia: "OP",
  administradorGlobal: false,
  permisos: {
    oficinas: "admin",
    guardias: "admin"
  }
};
