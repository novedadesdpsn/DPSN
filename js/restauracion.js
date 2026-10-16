// ============================================================
// PUNTOS DE RESTAURACIÓN — Novedades DPSN
// ============================================================
// Copias completas del parte para poder volver atrás aunque alguien
// borre todo.
//  - AUTOMÁTICOS: se generan solos cada 30 minutos (mientras haya una
//    sesión de administrador abierta y solo si algo cambió), al ingresar,
//    antes de "Finalizar Guardia" y antes de restaurar. Se guardan los
//    últimos 10; los más viejos se descartan.
//  - MANUAL: botón "Crear punto ahora". Hay un único punto manual: crear
//    uno nuevo reemplaza al anterior y, además, reemplaza a los
//    automáticos más viejos (el manual pasa a ser el punto más reciente).
// Se guardan en Firestore (colección "puntosRestauracion") y se
// comparten entre todos los usuarios; en modo demo, en el navegador.
// ============================================================

const COLECCION_PUNTOS = 'puntosRestauracion';
const CLAVE_PUNTOS_LOCAL = 'novedades_dpsn_puntos_restauracion';
const INTERVALO_AUTO_MIN = 30;
const MAX_PUNTOS_AUTO = 10;

async function listarPuntosRestauracion() {
  if (DEMO_MODE) {
    try { return JSON.parse(localStorage.getItem(CLAVE_PUNTOS_LOCAL) || '[]'); } catch (e) { return []; }
  }
  try {
    const snap = await db.collection(COLECCION_PUNTOS).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { console.error('No se pudieron leer los puntos de restauración:', err); return []; }
}

async function guardarListaLocal(lista) { localStorage.setItem(CLAVE_PUNTOS_LOCAL, JSON.stringify(lista)); }

async function borrarPunto(id) {
  if (DEMO_MODE) {
    const lista = (await listarPuntosRestauracion()).filter(p => p.id !== id);
    await guardarListaLocal(lista);
    return;
  }
  await db.collection(COLECCION_PUNTOS).doc(id).delete();
}

async function guardarPunto(punto) {
  if (DEMO_MODE) {
    const lista = (await listarPuntosRestauracion()).filter(p => p.id !== punto.id);
    lista.push(punto);
    await guardarListaLocal(lista);
    return;
  }
  await db.collection(COLECCION_PUNTOS).doc(punto.id).set(punto);
}

function nombreUsuarioActual() {
  const el = document.getElementById('nombreUsuario');
  return el ? el.textContent : '';
}

/**
 * tipo: 'auto' | 'manual'. Devuelve true si se guardó.
 * Los automáticos no se guardan si el parte es idéntico al último punto.
 */
async function crearPuntoRestauracion(tipo, etiqueta) {
  try {
    const foto = UNDO.foto();
    const puntos = await listarPuntosRestauracion();
    const ordenados = puntos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (tipo === 'auto') {
      if (ordenados.length && ordenados[0].foto === foto) return false;
      await guardarPunto({ id: 'auto-' + Date.now(), tipo: 'auto', etiqueta: etiqueta || 'Automático', fecha: new Date().toISOString(), autor: nombreUsuarioActual(), foto });
      const autos = ordenados.filter(p => p.tipo === 'auto');
      // Quedan los últimos MAX_PUNTOS_AUTO (contando el recién creado).
      for (const viejo of autos.slice(MAX_PUNTOS_AUTO - 1)) await borrarPunto(viejo.id);
      return true;
    }

    // Manual: reemplaza al manual anterior y a los automáticos más viejos.
    await guardarPunto({ id: 'manual', tipo: 'manual', etiqueta: etiqueta || 'Punto manual', fecha: new Date().toISOString(), autor: nombreUsuarioActual(), foto });
    for (const p of puntos.filter(p => p.tipo === 'auto')) await borrarPunto(p.id);
    return true;
  } catch (err) {
    console.error('No se pudo crear el punto de restauración:', err);
    return false;
  }
}

function cerrarModalRestauracion() {
  const m = document.getElementById('modalRestauracion');
  if (m) m.remove();
}

function formatoFechaPunto(iso) {
  try { return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; }
}

async function abrirModalRestauracion() {
  cerrarModalRestauracion();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalRestauracion';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header"><h3>Puntos de restauración</h3><button type="button" onclick="cerrarModalRestauracion()">✕</button></div>
      <div class="modal-lista" id="restLista"><div class="placeholder-panel">Cargando…</div></div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalRestauracion()">Cerrar</button>
        <button class="btn-primario" type="button" id="restCrear">Crear punto ahora</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('restCrear').addEventListener('click', async () => {
    const btn = document.getElementById('restCrear');
    btn.disabled = true; btn.textContent = 'Guardando…';
    const ok = await crearPuntoRestauracion('manual', 'Punto manual');
    UNDO.aviso(ok ? 'Punto de restauración creado.' : 'No se pudo crear el punto de restauración.');
    abrirModalRestauracion();
  });

  const puntos = (await listarPuntosRestauracion()).sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'manual' ? -1 : 1;
    return b.fecha.localeCompare(a.fecha);
  });
  const cont = document.getElementById('restLista');
  if (!cont) return;
  if (!puntos.length) { cont.innerHTML = '<div class="placeholder-panel">Todavía no hay puntos de restauración.</div>'; return; }
  cont.innerHTML = `<p style="font-size:12px; color:var(--gris-700); margin:0 0 8px;">Restaurar deja el parte exactamente como estaba en ese momento. Antes de restaurar se guarda un punto del estado actual, y además podés usar "Deshacer".</p>` +
    puntos.map(p => `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--gris-300); border-radius:8px; padding:8px 12px; margin-bottom:8px;">
      <div>
        <span class="tag ${p.tipo === 'manual' ? 'seguimiento' : 'inicial'}">${p.tipo === 'manual' ? 'Manual' : 'Automático'}</span>
        <strong style="margin-left:6px;">${esc(formatoFechaPunto(p.fecha))}</strong>
        <div style="font-size:11.5px; color:var(--gris-500); margin-top:2px;">${esc(p.etiqueta || '')}${p.autor ? ' · ' + esc(p.autor) : ''}</div>
      </div>
      <button type="button" class="btn-secundario rest-btn" data-id="${esc(p.id)}">Restaurar</button>
    </div>`).join('');
  cont.querySelectorAll('.rest-btn').forEach(btn => btn.addEventListener('click', () => restaurarPunto(btn.dataset.id, puntos)));
}

async function restaurarPunto(id, puntos) {
  const p = puntos.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`¿Restaurar el parte al punto del ${formatoFechaPunto(p.fecha)}? Se va a reemplazar todo lo cargado desde entonces.`)) return;
  await crearPuntoRestauracion('auto', 'Antes de restaurar');
  // La restauración queda como un paso más del historial: se puede deshacer.
  UNDO.pila.push(UNDO.foto());
  if (UNDO.pila.length > UNDO.MAX) UNDO.pila.shift();
  UNDO.rehacerPila = [];
  UNDO.aplicarFoto(p.foto);
  UNDO.actualizarBoton();
  cerrarModalRestauracion();
  UNDO.aviso('Parte restaurado.');
}

function iniciarPuntosRestauracion() {
  if (SOLO_LECTURA_ACTUAL) { const b = document.getElementById('btnRestauracion'); if (b) b.classList.add('oculto'); return; }
  const b = document.getElementById('btnRestauracion');
  if (b) b.addEventListener('click', abrirModalRestauracion);
  crearPuntoRestauracion('auto', 'Al ingresar');
  setInterval(() => crearPuntoRestauracion('auto', 'Automático'), INTERVALO_AUTO_MIN * 60 * 1000);
}
