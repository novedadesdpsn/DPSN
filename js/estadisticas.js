// ============================================================
// ESTADÍSTICAS — Novedades DPSN
// ============================================================
// Primero se elige QUÉ consultar (Extraordinarias / PSC / Casos
// MAS / Casos SAR); recién ahí aparecen los filtros de esa
// categoría. Las opciones de los filtros (dependencias, banderas)
// se arman en el momento a partir de los datos cargados, así que
// un caso nuevo (ej. de una dependencia RAWS) ya aparece como
// criterio apenas se carga. El último resultado filtrado se puede
// exportar a PDF.
// ============================================================

let ULTIMO_RESULTADO_ESTADISTICA = null; // { titulo, columnas, filas }

function htmlResultados(filas, columnas, tituloExportar) {
  ULTIMO_RESULTADO_ESTADISTICA = { titulo: tituloExportar, columnas, filas };
  return `
    <p style="font-size:12.5px; color:var(--gris-700); margin:12px 0 8px;"><strong>${filas.length}</strong> resultado(s)</p>
    ${filas.length ? renderTablaGenerica(columnas, filas) : '<div class="placeholder-panel">Sin resultados para este filtro.</div>'}
    ${filas.length ? `<button class="btn-primario" type="button" style="margin-top:12px;" onclick="exportarResultadoEstadistica()">Exportar PDF</button>` : ''}
  `;
}

function exportarResultadoEstadistica() {
  if (!ULTIMO_RESULTADO_ESTADISTICA || !ULTIMO_RESULTADO_ESTADISTICA.filas.length) return;
  const { titulo, columnas, filas } = ULTIMO_RESULTADO_ESTADISTICA;
  generarPDF(
    `Estadistica ${titulo} ${fechaHoy()}.pdf`,
    'RESUMEN DE NOVEDADES — ESTADÍSTICA',
    `${titulo} — ${fechaHoy()}`,
    [{ titulo, contenido: { tablas: [{ columnas, filas }] } }]
  );
}

// ---------- Inspecciones Extraordinarias ----------
function calcularResultadosExtraordinarias(bandera, codigo) {
  const grupos = [];
  if (bandera === 'todas' || bandera === 'argentina') grupos.push(['Argentina', D.inspeccionesExtraordinarias.argentina]);
  if (bandera === 'todas' || bandera === 'extranjera') grupos.push(['Extranjera', D.inspeccionesExtraordinarias.extranjera]);
  const filas = [];
  grupos.forEach(([nombreBandera, grupo]) => {
    Object.entries(grupo.porDependencia).forEach(([dep, lista]) => {
      lista.forEach(insp => {
        const coincideCodigo = codigo === 'todos' || (insp.deficiencias || []).some(g => codigosDeGrupo(g).includes(codigo));
        if (coincideCodigo) {
          filas.push([
            dep, nombreBandera,
            `${insp.buque.tipo} "${insp.buque.nombre}"`,
            insp.tipo === 'inicial' ? 'Inicial' : (insp.tipo === 'detallada' ? 'Más detallada' : 'Seguimiento'),
            (insp.deficiencias || []).flatMap(codigosDeGrupo).join(', ') || '—'
          ]);
        }
      });
    });
  });
  return filas;
}

function actualizarEstadExtraordinarias() {
  const bandera = document.getElementById('filtroExtraBandera').value;
  const codigo = document.getElementById('filtroExtraCodigo').value;
  const filas = calcularResultadosExtraordinarias(bandera, codigo);
  document.getElementById('resultadosEstadistica').innerHTML =
    htmlResultados(filas, ['Dependencia', 'Bandera', 'Buque', 'Tipo', 'Cód. deficiencias'], 'Inspecciones Extraordinarias');
}

// ---------- Estado Rector de Puerto ----------
function opcionesBanderaPSC() {
  const set = new Set();
  Object.values(D.estadoRectorPuerto.porDependencia).forEach(l => l.forEach(i => set.add(i.buque.bandera)));
  return [...set];
}

function calcularResultadosPSC(bandera, codigo) {
  const filas = [];
  Object.entries(D.estadoRectorPuerto.porDependencia).forEach(([dep, lista]) => {
    lista.forEach(insp => {
      const coincideBandera = bandera === 'todas' || insp.buque.bandera === bandera;
      const coincideCodigo = codigo === 'todos' || (insp.deficiencias || []).some(g => codigosDeGrupo(g).includes(codigo));
      if (coincideBandera && coincideCodigo) {
        filas.push([dep, insp.buque.bandera, `${insp.buque.tipo} "${insp.buque.nombre}"`, (insp.deficiencias || []).flatMap(codigosDeGrupo).join(', ') || '—']);
      }
    });
  });
  return filas;
}

function actualizarEstadPSC() {
  const bandera = document.getElementById('filtroPscBandera').value;
  const codigo = document.getElementById('filtroPscCodigo').value;
  const filas = calcularResultadosPSC(bandera, codigo);
  document.getElementById('resultadosEstadistica').innerHTML =
    htmlResultados(filas, ['Dependencia', 'Bandera', 'Buque', 'Cód. deficiencias'], 'Estado Rector de Puerto');
}

// ---------- Casos MAS / SAR ----------
function opcionesDependencia(bloque) { return Object.keys(bloque.porDependencia); }

function calcularResultadosCasos(bloque, dependencia, estado) {
  const filas = [];
  Object.entries(bloque.porDependencia).forEach(([dep, lista]) => {
    if (dependencia !== 'todas' && dep !== dependencia) return;
    lista.forEach(c => {
      if (estado !== 'todos' && c.estado !== estado) return;
      filas.push([dep, c.titulo, c.estado === 'pendiente' ? 'Pendiente' : 'Cerrado']);
    });
  });
  return filas;
}

function actualizarEstadCasos(tipo) {
  const dependencia = document.getElementById('filtroCasoDependencia').value;
  const estado = document.getElementById('filtroCasoEstado').value;
  const bloque = tipo === 'mas' ? D.casosMAS : D.casosSAR;
  const filas = calcularResultadosCasos(bloque, dependencia, estado);
  document.getElementById('resultadosEstadistica').innerHTML =
    htmlResultados(filas, ['Dependencia', 'Título', 'Estado'], tipo === 'mas' ? 'Casos MAS' : 'Casos SAR');
}

// ---------- Selector de categoría (primero elegís qué consultar) ----------
function filtrosPorCategoria(categoria) {
  if (categoria === 'extraordinarias') {
    return `
      <div class="fila-doble">
        <div class="campo">
          <label>Bandera</label>
          <select id="filtroExtraBandera" onchange="actualizarEstadExtraordinarias()">
            <option value="todas">Todas</option>
            <option value="argentina">Argentina</option>
            <option value="extranjera">Extranjera</option>
          </select>
        </div>
        <div class="campo">
          <label>Código de deficiencia</label>
          <select id="filtroExtraCodigo" onchange="actualizarEstadExtraordinarias()">
            <option value="todos">Todos</option>
            ${CODIGOS_MEDIDAS.map(c => `<option value="${c.codigo}">${c.codigo} — ${esc(c.descripcion)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="resultadosEstadistica"></div>
    `;
  }
  if (categoria === 'psc') {
    return `
      <div class="fila-doble">
        <div class="campo">
          <label>Bandera</label>
          <select id="filtroPscBandera" onchange="actualizarEstadPSC()">
            <option value="todas">Todas</option>
            ${opcionesBanderaPSC().map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Código de deficiencia</label>
          <select id="filtroPscCodigo" onchange="actualizarEstadPSC()">
            <option value="todos">Todos</option>
            ${CODIGOS_MEDIDAS.map(c => `<option value="${c.codigo}">${c.codigo} — ${esc(c.descripcion)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="resultadosEstadistica"></div>
    `;
  }
  // 'mas' o 'sar'
  const bloque = categoria === 'mas' ? D.casosMAS : D.casosSAR;
  return `
    <div class="fila-doble">
      <div class="campo">
        <label>Dependencia</label>
        <select id="filtroCasoDependencia" onchange="actualizarEstadCasos('${categoria}')">
          <option value="todas">Todas</option>
          ${opcionesDependencia(bloque).map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}
        </select>
      </div>
      <div class="campo">
        <label>Estado</label>
        <select id="filtroCasoEstado" onchange="actualizarEstadCasos('${categoria}')">
          <option value="todos">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>
    </div>
    <div id="resultadosEstadistica"></div>
  `;
}

function cambiarCategoriaEstadistica() {
  const categoria = document.getElementById('statCategoria').value;
  const cont = document.getElementById('statFiltrosContenedor');
  if (!categoria) { cont.innerHTML = ''; ULTIMO_RESULTADO_ESTADISTICA = null; return; }
  cont.innerHTML = filtrosPorCategoria(categoria);
  if (categoria === 'extraordinarias') actualizarEstadExtraordinarias();
  else if (categoria === 'psc') actualizarEstadPSC();
  else actualizarEstadCasos(categoria);
}

// ---------- Panel principal ----------
function renderEstadisticas() {
  return `
    <div class="campo">
      <label>¿Qué querés consultar?</label>
      <select id="statCategoria" onchange="cambiarCategoriaEstadistica()">
        <option value="">Elegí una opción...</option>
        <option value="extraordinarias">Inspecciones Extraordinarias</option>
        <option value="psc">Inspecciones Estado Rector de Puerto</option>
        <option value="mas">Casos MAS</option>
        <option value="sar">Casos SAR</option>
      </select>
    </div>
    <div id="statFiltrosContenedor"></div>
  `;
}
