// ============================================================
// AUDITORÍA — Novedades DPSN
// ============================================================
// Firebase Authentication guarda cuándo entró cada usuario, pero
// no guarda "qué modificó" — eso hay que armarlo nosotros. Esto
// registra, en la colección "auditoria" de Firestore, quién
// cambió qué sección y cuándo, comparando el valor nuevo contra
// el último que vimos de esa sección (no hace falta anotar cada
// botón de agregar/editar uno por uno).
// ============================================================

const COLECCION_AUDITORIA = 'auditoria';
let ULTIMO_ESTADO_CONOCIDO = {};

function inicializarEstadoConocido() {
  SECCIONES_PERSISTIDAS.forEach(clave => {
    ULTIMO_ESTADO_CONOCIDO[clave] = JSON.stringify(DATOS_EJEMPLO[clave]);
  });
}

/** Actualiza el "último estado conocido" SIN generar una entrada de auditoría — se usa cuando el cambio llega de otro usuario (escucha en vivo), no de esta sesión. */
function sincronizarEstadoConocido(clave, valor) {
  ULTIMO_ESTADO_CONOCIDO[clave] = JSON.stringify(valor);
}

function resumenSeccionParaAuditoria(valor) {
  if (valor && valor.porDependencia) {
    const n = Object.values(valor.porDependencia).reduce((acc, l) => acc + l.length, 0);
    return `${n} registro(s) en total`;
  }
  if (valor && Array.isArray(valor.filas)) return `${valor.filas.length} fila(s)`;
  if (valor && Array.isArray(valor.tramitesAnalisis)) {
    return `${valor.tramitesAnalisis.length} trámite(s), ${valor.certificadosArqueo.length} certificado(s), ${valor.giradosTNAV.length} girado(s)`;
  }
  if (Array.isArray(valor)) return `${valor.length} registro(s)`;
  return 'actualizado';
}

const ETIQUETAS_SECCION = {
  inspeccionesExtraordinarias: 'Inspecciones Extraordinarias',
  estadoRectorPuerto: 'Estado Rector de Puerto',
  casosMAS: 'Casos MAS',
  casosSAR: 'Casos SAR',
  buquesDetencionMapa: 'Mapa de Buques con Detención',
  otros: 'Otros',
  oficinas: 'Oficinas',
  buquesDetencion: 'Buques con Detención',
  inspeccionesTecnicas: 'Inspecciones Técnicas',
  divisionControlGestion: 'División Control de Gestión',
  licencias: 'Licencias',
  cursos: 'Cursos',
  guardia: 'Guardia'
};

/** Se llama desde persistirDatosGuardia() para cada sección que cambió realmente. No bloquea el guardado si falla. */
async function registrarAuditoriaSiCambio(clave, valorNuevo) {
  const nuevoJSON = JSON.stringify(valorNuevo);
  if (ULTIMO_ESTADO_CONOCIDO[clave] === nuevoJSON) return; // sin cambios reales
  ULTIMO_ESTADO_CONOCIDO[clave] = nuevoJSON;

  if (DEMO_MODE) return; // en modo demo no hay multiusuario real, no tiene sentido auditar

  const usuario = obtenerSesion();
  if (!usuario) return;

  try {
    await db.collection(COLECCION_AUDITORIA).add({
      seccion: clave,
      seccionEtiqueta: ETIQUETAS_SECCION[clave] || clave,
      resumen: resumenSeccionParaAuditoria(valorNuevo),
      usuarioDni: usuario.dni || '',
      usuarioNombre: usuario.nombre || usuario.dni || '',
      fechaHora: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('No se pudo registrar la auditoría:', err);
  }
}

async function obtenerAuditoriaReciente(limite) {
  if (DEMO_MODE) return [];
  try {
    const snap = await db.collection(COLECCION_AUDITORIA).orderBy('fechaHora', 'desc').limit(limite || 150).get();
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error('No se pudo leer la auditoría:', err);
    return [];
  }
}

async function obtenerAuditoriaPorFecha(fechaISO) {
  if (DEMO_MODE) return [];
  try {
    const inicio = new Date(fechaISO + 'T00:00:00');
    const fin = new Date(fechaISO + 'T23:59:59.999');
    const snap = await db.collection(COLECCION_AUDITORIA)
      .where('fechaHora', '>=', inicio)
      .where('fechaHora', '<=', fin)
      .orderBy('fechaHora', 'desc')
      .get();
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error('No se pudo leer la auditoría de esa fecha:', err);
    return [];
  }
}

function formatearFechaHoraAuditoria(ts) {
  if (!ts || !ts.toDate) return '—';
  const d = ts.toDate();
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

async function abrirModalAuditoria() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalAuditoria';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header">
        <h3>Actividad</h3>
        <button type="button" onclick="document.getElementById('modalAuditoria').remove()">✕</button>
      </div>
      <div style="padding:12px 20px; border-bottom:1px solid var(--gris-100); display:flex; gap:10px; align-items:flex-end;">
        <div class="campo" style="margin:0; flex:1;">
          <label>Buscar por fecha</label>
          <input type="date" id="filtroFechaAuditoria">
        </div>
        <button class="btn-secundario" type="button" onclick="buscarAuditoriaPorFecha()">Buscar</button>
        <button class="btn-secundario" type="button" onclick="cargarAuditoriaReciente()">Ver recientes</button>
      </div>
      <div class="modal-lista" id="listaAuditoria"><div class="placeholder-panel">Consultando…</div></div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="document.getElementById('modalAuditoria').remove()">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  cargarAuditoriaReciente();
}

function renderizarListaAuditoria(registros, mensajeVacio) {
  const cont = document.getElementById('listaAuditoria');
  if (!cont) return;
  if (!registros.length) {
    cont.innerHTML = `<div class="placeholder-panel">${esc(mensajeVacio)}</div>`;
    return;
  }
  cont.innerHTML = registros.map(r => `
    <div style="padding:8px 0; border-bottom:1px solid var(--gris-100); font-size:12.5px;">
      <div style="display:flex; justify-content:space-between; gap:8px;">
        <strong style="color:var(--azul-marino);">${esc(r.usuarioNombre)}</strong>
        <span style="color:var(--gris-500); white-space:nowrap;">${esc(formatearFechaHoraAuditoria(r.fechaHora))}</span>
      </div>
      <div>${esc(r.seccionEtiqueta)} — ${esc(r.resumen)}</div>
    </div>
  `).join('');
}

async function cargarAuditoriaReciente() {
  document.getElementById('listaAuditoria').innerHTML = '<div class="placeholder-panel">Consultando…</div>';
  const registros = await obtenerAuditoriaReciente();
  renderizarListaAuditoria(registros, 'Todavía no hay actividad registrada.');
}

async function buscarAuditoriaPorFecha() {
  const fecha = document.getElementById('filtroFechaAuditoria').value;
  if (!fecha) return;
  document.getElementById('listaAuditoria').innerHTML = '<div class="placeholder-panel">Consultando…</div>';
  const registros = await obtenerAuditoriaPorFecha(fecha);
  renderizarListaAuditoria(registros, 'No hay actividad registrada para esa fecha.');
}
