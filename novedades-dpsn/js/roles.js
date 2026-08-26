// ============================================================
// MODELO DE ROLES — Novedades DPSN
// ============================================================
// Un solo módulo (ya no existe Oficinas). Cada usuario tiene un
// documento en la colección "usuarios" de Firestore:
//
// usuarios/{uid}:
// {
//   nombre: "Apellido, Nombre",
//   jerarquia: "PR",
//   administradorGlobal: true | false,   // Director, jefes de depto/división
//   permisos: { guardias: "admin" | "lector" | null }
// }
//
// administradorGlobal en true implica admin sin importar "permisos".
// ============================================================

const NivelPermiso = { ADMIN: "admin", LECTOR: "lector", NINGUNO: null };

function obtenerPermiso(usuario) {
  if (!usuario) return null;
  if (usuario.administradorGlobal) return NivelPermiso.ADMIN;
  return (usuario.permisos && usuario.permisos.guardias) || null;
}

function puedeVer(usuario) { return obtenerPermiso(usuario) !== null; }
function puedeEditar(usuario) { return obtenerPermiso(usuario) === NivelPermiso.ADMIN; }

// Usuario de ejemplo para poder previsualizar el sistema sin
// Firebase todavía conectado.
const USUARIO_DEMO = {
  nombre: "Piccoli, Leonardo Agustín",
  jerarquia: "OP",
  administradorGlobal: false,
  permisos: { guardias: "admin" }
};
