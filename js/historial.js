// ============================================================
// HISTORIAL DE PARTES — Novedades DPSN
// ============================================================
// Cada vez que se exporta el PDF de Guardias, se guarda además una
// "foto" estructurada de los datos de ese día en la colección
// "historialPartes" de Firestore (documento = fecha, formato
// AAAA-MM-DD). Esto es lo que le permite al Asistente y a
// Estadísticas buscar y filtrar información de días anteriores,
// no solo la del parte en curso.
//
// El PDF guardado en Drive sigue sirviendo como respaldo/archivo
// legible para una persona — este historial es la base de datos
// real, estructurada, que usa el sistema para buscar.
// ============================================================

const COLECCION_HISTORIAL = 'historialPartes';
const CLAVE_HISTORIAL_LOCAL = 'novedades_dpsn_historial_local'; // solo se usa en modo demo

function fechaISOHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Junta el estado actual de todas las secciones para guardarlo como una foto del día. */
function construirInstantaneaDelDia() {
  const datos = {};
  SECCIONES_PERSISTIDAS.forEach(clave => { datos[clave] = DATOS_EJEMPLO[clave]; });
  return { fecha: fechaISOHoy(), fechaVisual: fechaHoy(), datos };
}

/** Se llama automáticamente al exportar el PDF de Guardias. No bloquea la descarga si falla. */
async function archivarParteDelDia() {
  const instantanea = construirInstantaneaDelDia();

  if (DEMO_MODE) {
    try {
      const lista = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_LOCAL) || '{}');
      lista[instantanea.fecha] = instantanea;
      localStorage.setItem(CLAVE_HISTORIAL_LOCAL, JSON.stringify(lista));
    } catch (e) { console.error('No se pudo archivar el parte del día (modo demo):', e); }
    return;
  }

  try {
    await db.collection(COLECCION_HISTORIAL).doc(instantanea.fecha).set({
      ...instantanea,
      guardadoEn: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('No se pudo archivar el parte del día en el historial:', err);
  }
}

/** Trae todos los partes archivados (para búsquedas y estadísticas históricas). */
async function obtenerHistorialCompleto() {
  if (DEMO_MODE) {
    try {
      const lista = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_LOCAL) || '{}');
      return Object.values(lista).sort((a, b) => b.fecha.localeCompare(a.fecha));
    } catch (e) { return []; }
  }

  try {
    const snap = await db.collection(COLECCION_HISTORIAL).orderBy('fecha', 'desc').get();
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error('No se pudo leer el historial:', err);
    return [];
  }
}
