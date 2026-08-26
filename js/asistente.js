// ============================================================
// ASISTENTE DE BÚSQUEDA — Novedades DPSN
// ============================================================
// Buscador que cruza el parte en curso Y todo el historial
// archivado (una foto por cada día que se exportó el PDF) —
// no es una inteligencia artificial conversacional: eso
// necesitaría un servidor propio con una clave de API, algo que
// este sitio estático en GitHub Pages no tiene. Lo que sí hace:
// buscar por nombre de buque (todas sus inspecciones, con
// deficiencias y fechas, de hoy y de partes anteriores) o por
// fecha.
// ============================================================

function normalizarTexto(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function todasLasInspeccionesExtraordinarias(datos, etiquetaFecha) {
  const out = [];
  ['argentina', 'extranjera'].forEach(bandera => {
    const grupo = datos.inspeccionesExtraordinarias[bandera];
    Object.entries(grupo.porDependencia).forEach(([dep, lista]) => {
      lista.forEach(insp => out.push({ origen: 'Inspección Extraordinaria', bandera, dependencia: dep, fechaParte: etiquetaFecha, ...insp }));
    });
  });
  return out;
}

function todasLasInspeccionesPSC(datos, etiquetaFecha) {
  const out = [];
  Object.entries(datos.estadoRectorPuerto.porDependencia).forEach(([dep, lista]) => {
    lista.forEach(insp => out.push({ origen: 'Estado Rector de Puerto', dependencia: dep, fechaParte: etiquetaFecha, ...insp }));
  });
  return out;
}

function todosLosCasos(bloque, origen, etiquetaFecha) {
  const out = [];
  Object.entries(bloque.porDependencia).forEach(([dep, lista]) => {
    lista.forEach(c => out.push({ origen, dependencia: dep, fechaParte: etiquetaFecha, ...c }));
  });
  return out;
}

/** Junta todo lo buscable de un bundle de datos (el actual, o una foto del historial). */
function todoLoBuscableDe(datos, etiquetaFecha) {
  return [
    ...todasLasInspeccionesExtraordinarias(datos, etiquetaFecha),
    ...todasLasInspeccionesPSC(datos, etiquetaFecha),
    ...todosLosCasos(datos.casosMAS, 'Caso MAS', etiquetaFecha),
    ...todosLosCasos(datos.casosSAR, 'Caso SAR', etiquetaFecha)
  ];
}

/** Trae [{ datos, etiquetaFecha }] para el parte en curso + cada día archivado. */
async function obtenerTodosLosBundles() {
  const bundles = [{ datos: D, etiquetaFecha: 'En curso (hoy)' }];
  const historial = await obtenerHistorialCompleto();
  historial.forEach(parte => bundles.push({ datos: parte.datos, etiquetaFecha: parte.fechaVisual || parte.fecha }));
  return bundles;
}

function buscarPorBuqueEnBundle(datos, etiquetaFecha, q) {
  return todoLoBuscableDe(datos, etiquetaFecha).filter(r => {
    if (r.buque) return normalizarTexto(r.buque.nombre).includes(q);
    return normalizarTexto(r.titulo).includes(q) || normalizarTexto(r.nombreBuque || '').includes(q) || normalizarTexto(r.novedad || '').includes(q);
  });
}

function buscarPorFechaEnBundle(datos, etiquetaFecha, query) {
  const resultados = [];
  todasLasInspeccionesExtraordinarias(datos, etiquetaFecha).concat(todasLasInspeccionesPSC(datos, etiquetaFecha)).forEach(r => {
    if (r.fechaInspMasDetallada && r.fechaInspMasDetallada.includes(query)) resultados.push(r);
  });
  todosLosCasos(datos.casosSAR, 'Caso SAR', etiquetaFecha).forEach(r => {
    if ((r.fechaInicio && r.fechaInicio.includes(query)) || (r.fechaCierre && r.fechaCierre.includes(query))) resultados.push(r);
  });
  return resultados;
}

function renderResultadoAsistente(r) {
  let html = `<div class="item-insp" style="margin-bottom:10px;">
    <div style="display:flex; justify-content:space-between; gap:8px;">
      <div><span class="tag detallada">${esc(r.origen)}</span> <strong>${esc(r.dependencia)}</strong></div>
      <span style="font-size:10.5px; color:var(--gris-500); white-space:nowrap;">${esc(r.fechaParte || '')}</span>
    </div>`;
  if (r.buque) {
    const tipoTexto = r.tipo === 'inicial' ? 'Inicial (II)' : (r.tipo === 'detallada' ? 'Más Detallada (ID)' : `IS de ID Fecha ${r.fechaInspMasDetallada || '—'}`);
    html += `<div style="margin-top:4px;">${esc(r.buque.tipo || '')} "${esc(r.buque.nombre || '')}" (${esc(r.buque.matricula || '')}) — B/${esc(r.buque.bandera || '')}</div>`;
    html += `<div style="margin-top:2px; color:var(--gris-700);">Tipo de inspección: ${tipoTexto}</div>`;
    if (r.deficiencias && r.deficiencias.length) {
      html += `<ul style="margin:6px 0 0 18px;">` + r.deficiencias.map(g => `<li>${esc(textoGrupoDeficiencia(g))}${renderLineasDescripcionHtml(g)}</li>`).join('') + `</ul>`;
    } else {
      html += `<div style="color:var(--verde);">Sin deficiencias registradas</div>`;
    }
  } else {
    html += `<div style="margin-top:4px;"><strong>${esc(r.titulo)}</strong> — ${r.estado === 'pendiente' ? 'Pendiente' : 'Cerrado'}</div>`;
    if (r.fechaInicio) html += `<div>Inicio: ${esc(r.fechaInicio)}${r.fechaCierre ? ' · Cierre: ' + esc(r.fechaCierre) : ''}</div>`;
    if (r.novedad) html += `<div style="margin-top:4px;">${esc(r.novedad)}</div>`;
  }
  html += `</div>`;
  return html;
}

function renderResultadosAsistente(resultados, query) {
  if (!query) return '<div class="placeholder-panel">Escribí el nombre de un buque o una fecha (dd/mm/aaaa) para buscar.</div>';
  if (!resultados.length) return `<div class="placeholder-panel">No encontré nada para "${esc(query)}" — ni en el parte de hoy ni en el historial archivado.</div>`;
  return `<p style="font-size:12.5px; color:var(--gris-700); margin-bottom:10px;"><strong>${resultados.length}</strong> resultado(s) encontrados (hoy + historial)</p>` +
    resultados.map(renderResultadoAsistente).join('');
}

async function ejecutarBusquedaAsistente() {
  const query = document.getElementById('asistenteInput').value.trim();
  const resultadosEl = document.getElementById('asistenteResultados');
  if (!query) { resultadosEl.innerHTML = renderResultadosAsistente([], query); return; }

  resultadosEl.innerHTML = '<div class="placeholder-panel">Buscando en el parte de hoy y en el historial…</div>';
  const esFecha = /\d{1,2}\/\d{1,2}(\/\d{2,4})?/.test(query);
  const q = normalizarTexto(query);

  const bundles = await obtenerTodosLosBundles();
  let resultados = [];
  bundles.forEach(({ datos, etiquetaFecha }) => {
    resultados = resultados.concat(esFecha ? buscarPorFechaEnBundle(datos, etiquetaFecha, query) : buscarPorBuqueEnBundle(datos, etiquetaFecha, q));
  });

  resultadosEl.innerHTML = renderResultadosAsistente(resultados, query);
}

function renderAsistente() {
  return `
    <div style="display:flex; gap:10px;">
      <input type="text" id="asistenteInput" placeholder="Ej: KOETI, o 03/08/2026"
        style="flex:1; padding:10px 12px; border:1px solid var(--gris-300); border-radius:var(--radio); font-size:13px;"
        onkeydown="if(event.key==='Enter') ejecutarBusquedaAsistente()">
      <button class="btn-primario" type="button" onclick="ejecutarBusquedaAsistente()">Buscar</button>
    </div>
    <div id="asistenteResultados" style="margin-top:14px;">
      <div class="placeholder-panel">Escribí el nombre de un buque o una fecha (dd/mm/aaaa) para buscar — busca en el parte de hoy y en todo el historial archivado.</div>
    </div>
  `;
}

// ---------- Panel flotante conversacional (botón lupa en Inicio) ----------
function renderSaludoAsistente() {
  return `
    <div style="text-align:center; padding:6px 0 4px;">
      <p style="font-size:14px; font-weight:700; color:var(--azul-marino); margin:0 0 4px;">¡Hola! 👋</p>
      <p style="font-size:12.5px; color:var(--gris-700); margin:0 0 18px;">¿Qué querés hacer hoy?</p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn-primario" type="button" style="width:100%; padding:11px;" onclick="irAModoAsistente('buscar')">🔍 Buscar información</button>
        <button class="btn-secundario" type="button" style="width:100%; padding:11px;" onclick="irAModoAsistente('estadisticas')">📊 Consultar estadísticas</button>
      </div>
    </div>
  `;
}

function botonVolverAsistente() {
  return `<button type="button" onclick="mostrarSaludoAsistente()" style="background:none; border:none; color:var(--acento); font-size:12px; font-weight:700; margin-bottom:12px; padding:0;">← Volver</button>`;
}

function irAModoAsistente(modo) {
  const cuerpo = document.getElementById('asistenteCuerpo');
  if (modo === 'buscar') {
    cuerpo.innerHTML = botonVolverAsistente() +
      `<p style="font-size:12.5px; color:var(--gris-700); margin-bottom:10px;">Escribí el nombre de un buque o una fecha (dd/mm/aaaa) para buscar.</p>` +
      renderAsistente();
  } else {
    cuerpo.innerHTML = botonVolverAsistente() +
      `<p style="font-size:12.5px; color:var(--gris-700); margin-bottom:10px;">¿De qué querés la estadística?</p>` +
      renderEstadisticas();
  }
}

function mostrarSaludoAsistente() {
  document.getElementById('asistenteCuerpo').innerHTML = renderSaludoAsistente();
}

function abrirPanelAsistente() {
  document.getElementById('panelAsistente').classList.remove('oculto');
  mostrarSaludoAsistente();
}

function cerrarPanelAsistente() {
  const panel = document.getElementById('panelAsistente');
  if (panel) panel.classList.add('oculto');
}
