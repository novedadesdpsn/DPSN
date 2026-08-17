// ============================================================
// ESTADÍSTICAS — Novedades DPSN
// ============================================================
// Filtros funcionan leyendo el valor actual de los <select> en
// el momento del cambio (sin guardar estado aparte) y vuelven a
// pintar solo el contenedor de resultados correspondiente.
// ============================================================

function htmlResultados(filas, columnas) {
  return `
    <p style="font-size:12.5px; color:var(--gris-700); margin-bottom:8px;"><strong>${filas.length}</strong> resultado(s)</p>
    ${filas.length ? renderTablaGenerica(columnas, filas) : '<div class="placeholder-panel">Sin resultados para este filtro.</div>'}
  `;
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
  document.getElementById('resultadosExtraordinarias').innerHTML =
    htmlResultados(filas, ['Dependencia', 'Bandera', 'Buque', 'Tipo', 'Cód. deficiencias']);
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
  document.getElementById('resultadosPSC').innerHTML =
    htmlResultados(filas, ['Dependencia', 'Bandera', 'Buque', 'Cód. deficiencias']);
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
  const dependencia = document.getElementById('filtro' + tipo + 'Dependencia').value;
  const estado = document.getElementById('filtro' + tipo + 'Estado').value;
  const bloque = tipo === 'Mas' ? D.casosMAS : D.casosSAR;
  const filas = calcularResultadosCasos(bloque, dependencia, estado);
  document.getElementById('resultados' + tipo).innerHTML =
    htmlResultados(filas, ['Dependencia', 'Título', 'Estado']);
}

function filtrosDependenciaEstado(tipo, bloque) {
  return `
    <div class="campo" style="margin:0; min-width:160px;">
      <label>Dependencia</label>
      <select id="filtro${tipo}Dependencia" onchange="actualizarEstadCasos('${tipo}')">
        <option value="todas">Todas</option>
        ${opcionesDependencia(bloque).map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}
      </select>
    </div>
    <div class="campo" style="margin:0; min-width:160px;">
      <label>Estado</label>
      <select id="filtro${tipo}Estado" onchange="actualizarEstadCasos('${tipo}')">
        <option value="todos">Todos</option>
        <option value="pendiente">Pendiente</option>
        <option value="cerrado">Cerrado</option>
      </select>
    </div>
  `;
}

// ---------- Panel principal ----------
function renderEstadisticas() {
  return `
    <div class="tarjeta">
      <h2>Inspecciones Extraordinarias</h2>
      <div style="display:flex; gap:14px; flex-wrap:wrap; margin-bottom:14px;">
        <div class="campo" style="margin:0; min-width:160px;">
          <label>Bandera</label>
          <select id="filtroExtraBandera" onchange="actualizarEstadExtraordinarias()">
            <option value="todas">Todas</option>
            <option value="argentina">Argentina</option>
            <option value="extranjera">Extranjera</option>
          </select>
        </div>
        <div class="campo" style="margin:0; min-width:260px;">
          <label>Código de deficiencia</label>
          <select id="filtroExtraCodigo" onchange="actualizarEstadExtraordinarias()">
            <option value="todos">Todos</option>
            ${CODIGOS_MEDIDAS.map(c => `<option value="${c.codigo}">${c.codigo} — ${esc(c.descripcion)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="resultadosExtraordinarias">
        ${htmlResultados(calcularResultadosExtraordinarias('todas', 'todos'), ['Dependencia', 'Bandera', 'Buque', 'Tipo', 'Cód. deficiencias'])}
      </div>
    </div>

    <div class="tarjeta">
      <h2>Estado Rector de Puerto</h2>
      <div style="display:flex; gap:14px; flex-wrap:wrap; margin-bottom:14px;">
        <div class="campo" style="margin:0; min-width:160px;">
          <label>Bandera</label>
          <select id="filtroPscBandera" onchange="actualizarEstadPSC()">
            <option value="todas">Todas</option>
            ${opcionesBanderaPSC().map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('')}
          </select>
        </div>
        <div class="campo" style="margin:0; min-width:260px;">
          <label>Código de deficiencia</label>
          <select id="filtroPscCodigo" onchange="actualizarEstadPSC()">
            <option value="todos">Todos</option>
            ${CODIGOS_MEDIDAS.map(c => `<option value="${c.codigo}">${c.codigo} — ${esc(c.descripcion)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="resultadosPSC">
        ${htmlResultados(calcularResultadosPSC('todas', 'todos'), ['Dependencia', 'Bandera', 'Buque', 'Cód. deficiencias'])}
      </div>
    </div>

    <div class="tarjeta">
      <h2>Casos MAS</h2>
      <div style="display:flex; gap:14px; flex-wrap:wrap; margin-bottom:14px;">
        ${filtrosDependenciaEstado('Mas', D.casosMAS)}
      </div>
      <div id="resultadosMas">
        ${htmlResultados(calcularResultadosCasos(D.casosMAS, 'todas', 'todos'), ['Dependencia', 'Título', 'Estado'])}
      </div>
    </div>

    <div class="tarjeta">
      <h2>Casos SAR</h2>
      <div style="display:flex; gap:14px; flex-wrap:wrap; margin-bottom:14px;">
        ${filtrosDependenciaEstado('Sar', D.casosSAR)}
      </div>
      <div id="resultadosSar">
        ${htmlResultados(calcularResultadosCasos(D.casosSAR, 'todas', 'todos'), ['Dependencia', 'Título', 'Estado'])}
      </div>
    </div>
  `;
}
