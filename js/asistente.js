// ============================================================
// ASISTENTE DE BÚSQUEDA — Novedades DPSN
// ============================================================
// Esto es un buscador que cruza lo que ya está cargado en el
// sistema (Inspecciones Extraordinarias, PSC, Casos MAS y SAR),
// no una inteligencia artificial conversacional: eso necesitaría
// un servidor propio con una clave de API, algo que este sitio
// estático en GitHub Pages no tiene. Lo que sí puede hacer: buscar
// por nombre de buque (te tira todas las inspecciones que tuvo,
// con sus deficiencias y fechas) o por fecha.
// ============================================================

function normalizarTexto(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function todasLasInspeccionesExtraordinarias() {
  const out = [];
  ['argentina', 'extranjera'].forEach(bandera => {
    const grupo = D.inspeccionesExtraordinarias[bandera];
    Object.entries(grupo.porDependencia).forEach(([dep, lista]) => {
      lista.forEach(insp => out.push({ origen: 'Inspección Extraordinaria', bandera, dependencia: dep, ...insp }));
    });
  });
  return out;
}

function todasLasInspeccionesPSC() {
  const out = [];
  Object.entries(D.estadoRectorPuerto.porDependencia).forEach(([dep, lista]) => {
    lista.forEach(insp => out.push({ origen: 'Estado Rector de Puerto', dependencia: dep, ...insp }));
  });
  return out;
}

function todosLosCasos(bloque, origen) {
  const out = [];
  Object.entries(bloque.porDependencia).forEach(([dep, lista]) => {
    lista.forEach(c => out.push({ origen, dependencia: dep, ...c }));
  });
  return out;
}

function buscarPorBuque(query) {
  const q = normalizarTexto(query);
  const resultados = [];
  todasLasInspeccionesExtraordinarias().forEach(r => { if (normalizarTexto(r.buque.nombre).includes(q)) resultados.push(r); });
  todasLasInspeccionesPSC().forEach(r => { if (normalizarTexto(r.buque.nombre).includes(q)) resultados.push(r); });
  todosLosCasos(D.casosMAS, 'Caso MAS').forEach(r => {
    if (normalizarTexto(r.titulo).includes(q) || normalizarTexto(r.asunto).includes(q)) resultados.push(r);
  });
  todosLosCasos(D.casosSAR, 'Caso SAR').forEach(r => {
    if (normalizarTexto(r.nombreBuque || '').includes(q) || normalizarTexto(r.titulo).includes(q)) resultados.push(r);
  });
  return resultados;
}

function buscarPorFecha(query) {
  const resultados = [];
  todasLasInspeccionesExtraordinarias().concat(todasLasInspeccionesPSC()).forEach(r => {
    if (r.fechaInspMasDetallada && r.fechaInspMasDetallada.includes(query)) resultados.push(r);
  });
  todosLosCasos(D.casosSAR, 'Caso SAR').forEach(r => {
    if ((r.fechaInicio && r.fechaInicio.includes(query)) || (r.fechaCierre && r.fechaCierre.includes(query))) resultados.push(r);
  });
  return resultados;
}

function renderResultadoAsistente(r) {
  let html = `<div class="item-insp" style="margin-bottom:10px;">
    <div><span class="tag detallada">${esc(r.origen)}</span> <strong>${esc(r.dependencia)}</strong></div>`;
  if (r.buque) {
    const tipoTexto = r.tipo === 'inicial' ? 'Inicial (II)' : (r.tipo === 'detallada' ? 'Más Detallada (ID)' : `IS de ID Fecha ${r.fechaInspMasDetallada || '—'}`);
    html += `<div style="margin-top:4px;">${esc(r.buque.tipo || '')} "${esc(r.buque.nombre || '')}" (${esc(r.buque.matricula || '')}) — B/${esc(r.buque.bandera || '')}</div>`;
    html += `<div style="margin-top:2px; color:var(--gris-700);">Tipo de inspección: ${tipoTexto}</div>`;
    if (r.deficiencias && r.deficiencias.length) {
      html += `<ul style="margin:6px 0 0 18px;">` + r.deficiencias.map(g => `<li>${esc(textoGrupoDeficiencia(g))}</li>`).join('') + `</ul>`;
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
  if (!resultados.length) return `<div class="placeholder-panel">No encontré nada para "${esc(query)}" en los datos cargados.</div>`;
  return `<p style="font-size:12.5px; color:var(--gris-700); margin-bottom:10px;"><strong>${resultados.length}</strong> resultado(s) encontrados</p>` +
    resultados.map(renderResultadoAsistente).join('');
}

function ejecutarBusquedaAsistente() {
  const query = document.getElementById('asistenteInput').value.trim();
  const esFecha = /\d{1,2}\/\d{1,2}(\/\d{2,4})?/.test(query);
  const resultados = query ? (esFecha ? buscarPorFecha(query) : buscarPorBuque(query)) : [];
  document.getElementById('asistenteResultados').innerHTML = renderResultadosAsistente(resultados, query);
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
      <div class="placeholder-panel">Escribí el nombre de un buque o una fecha (dd/mm/aaaa) para buscar.</div>
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
