// ============================================================
// APP — Novedades DPSN — render de pestañas y paneles
// ============================================================

const D = DATOS_EJEMPLO; // alias corto

function esc(html) {
  const d = document.createElement('div');
  d.textContent = html ?? '';
  return d.innerHTML;
}

function tagTipo(tipo) {
  const nombres = { inicial: 'Inicial', detallada: 'Más detallada', seguimiento: 'Seguimiento' };
  return `<span class="tag ${tipo}">${nombres[tipo] || tipo}</span>`;
}

function tagEstado(estado) {
  const nombres = { abierto: 'Abierto', pendiente: 'Pendiente', cerrado: 'Cerrado' };
  return `<span class="tag ${estado}">${nombres[estado] || estado}</span>`;
}

// ---------- Inicio / resumen del día ----------
function contarInspeccionesGrupo(grupo) {
  let n = 0;
  Object.values(grupo.porDependencia).forEach(lista => { n += lista.length; });
  return n;
}

function calcularTotalesExtraordinarias() {
  const arg = D.inspeccionesExtraordinarias.argentina;
  const ext = D.inspeccionesExtraordinarias.extranjera;
  const diarioArg = contarInspeccionesGrupo(arg);
  const diarioExt = contarInspeccionesGrupo(ext);
  return {
    diarioArg, diarioExt,
    anualArg: arg.acumuladoAnualPrevio + diarioArg,
    anualExt: ext.acumuladoAnualPrevio + diarioExt
  };
}

function calcularResumenCategorias() {
  const cat = { pesquerosOtros: 0, porAveria: 0, cargaPasaje: 0, convoyesExtr: 0, convoyArgentino: 0 };
  [D.inspeccionesExtraordinarias.argentina, D.inspeccionesExtraordinarias.extranjera].forEach(grupo => {
    Object.values(grupo.porDependencia).forEach(lista => {
      lista.forEach(insp => {
        const c = insp.categoria || 'pesquerosOtros';
        if (cat[c] !== undefined) cat[c]++;
      });
    });
  });
  return cat;
}

function contarOtros() {
  let n = 0;
  Object.values(D.otros.porDependencia).forEach(lista => { n += lista.length; });
  return n;
}

function contarLicenciasTotal() {
  const L = D.licencias;
  return L.anuales.length + L.medicas.length + L.tareasAdecuadas.length +
    L.extraordinaria.length + L.comisiones.length + L.noComputables.length;
}

function renderInicio() {
  const tot = calcularTotalesExtraordinarias();
  const rp = D.estadoRectorPuerto.resumen;

  return `
    <div class="tarjeta">
      <h2>Resumen del parte</h2>
      <div class="grid-resumen">
        <div class="stat"><div class="valor">${tot.diarioArg}</div><div class="etiqueta">Insp. Extraord. B. Argentina</div></div>
        <div class="stat"><div class="valor">${tot.diarioExt}</div><div class="etiqueta">Insp. Extraord. B. Extranjera</div></div>
        <div class="stat"><div class="valor">${rp.inspeccionadosDiario}</div><div class="etiqueta">PSC inspeccionados hoy</div></div>
        <div class="stat"><div class="valor">${contarCasos(D.casosMAS)}</div><div class="etiqueta">Casos MAS pendientes</div></div>
        <div class="stat"><div class="valor">${contarCasos(D.casosSAR)}</div><div class="etiqueta">Casos SAR pendientes</div></div>
        <div class="stat"><div class="valor">${contarOtros()}</div><div class="etiqueta">Otras situaciones</div></div>
        <div class="stat"><div class="valor">${D.dragas.length}</div><div class="etiqueta">Dragas operando</div></div>
        <div class="stat"><div class="valor">${D.buquesDetencion.length}</div><div class="etiqueta">Buques con detención</div></div>
        <div class="stat"><div class="valor">${contarLicenciasTotal()}</div><div class="etiqueta">Personas de licencia</div></div>
      </div>
    </div>

    <div class="tarjeta">
      <h2>Altura de Agua y Calados de Navegación</h2>
      ${renderTablaGenerica(['Punto de control', 'Fecha', 'Altura', 'Escala'],
        D.alturaAgua.lecturas.map(a => [a.punto, a.fecha, a.altura, a.escala]))}
      <div style="margin-top:14px;">
        ${renderTablaGenerica(['Tramo', 'Referencia', 'Calado'],
          D.alturaAgua.calados.map(c => [c.tramo, c.referencia, c.calado]))}
      </div>
    </div>

    <div class="tarjeta">
      <h2>Dragas Operando en Jurisdicción <span class="contador">${D.dragas.length}</span></h2>
      ${renderTablaGenerica(['Draga', 'Días operando'],
        D.dragas.map(d => [d.nombre, d.dias]))}
    </div>

    <div class="tarjeta">
      <h2>Guardia</h2>
      <div style="display:flex; gap:40px; flex-wrap:wrap;">
        ${renderGuardiaLista('Saliente', D.guardia.saliente)}
        ${renderGuardiaLista('Entrante', D.guardia.entrante)}
      </div>
    </div>
  `;
}

function contarCasos(bloque) {
  let n = 0;
  Object.values(bloque.porDependencia).forEach(lista => {
    n += lista.filter(c => c.estado === 'pendiente' || c.estado === 'abierto').length;
  });
  return n;
}

// ---------- Inspecciones extraordinarias / Estado Rector de Puerto ----------
function renderInspeccionesPorDependencia(bloque, tituloResumen) {
  let html = '';
  Object.entries(bloque.porDependencia).forEach(([dep, lista]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)} (${lista.length})</summary>`;
    lista.forEach(insp => {
      html += `<div class="item-insp">
        ${tagTipo(insp.tipo)}
        <strong>${esc(insp.buque.tipo)} "${esc(insp.buque.nombre)}"</strong>
        (${esc(insp.buque.matricula)}) — B/${esc(insp.buque.bandera)}`;
      if (insp.tipo === 'seguimiento' && insp.fechaInspMasDetallada) {
        html += ` <span style="color:var(--gris-500)">— ID previa: ${esc(insp.fechaInspMasDetallada)}</span>`;
      }
      if (insp.asunto) html += `<div style="margin-top:4px;">${esc(insp.asunto)}</div>`;
      if (insp.tipo === 'inicial') {
        html += `<div style="margin-top:4px; color:var(--verde); font-weight:600;">Sin registrar deficiencias</div>`;
      }
      if (insp.deficiencias && insp.deficiencias.length) {
        html += `<ul style="margin:6px 0 0 18px; padding:0;">`;
        insp.deficiencias.forEach(d => {
          html += `<li><strong>Cód. ${esc(d.codigo)}</strong> — ${esc(d.descripcion)}</li>`;
        });
        html += `</ul>`;
      }
      if (insp.nota) html += `<div style="margin-top:4px; font-style:italic; color:var(--gris-700);">Nota: ${esc(insp.nota)}</div>`;
      html += `</div>`;
    });
    html += `</details>`;
  });
  return html;
}

function renderExtraordinarias() {
  const tot = calcularTotalesExtraordinarias();
  const cat = calcularResumenCategorias();
  const arg = D.inspeccionesExtraordinarias.argentina;
  const ext = D.inspeccionesExtraordinarias.extranjera;

  return `
    <div class="tarjeta">
      <h2>Inspecciones Extraordinarias — Bandera Argentina <span class="contador">${tot.diarioArg} hoy</span></h2>
      ${Object.keys(arg.porDependencia).length
        ? renderInspeccionesPorDependencia(arg)
        : '<div class="placeholder-panel">NIL — sin novedades para bandera argentina en este parte.</div>'}
    </div>
    <div class="tarjeta">
      <h2>Inspecciones Extraordinarias — Bandera Extranjera <span class="contador">${tot.diarioExt} hoy</span></h2>
      ${Object.keys(ext.porDependencia).length
        ? renderInspeccionesPorDependencia(ext)
        : '<div class="placeholder-panel">NIL — sin novedades para bandera extranjera en este parte.</div>'}
    </div>
    <div class="tarjeta">
      <h2>Resumen de inspecciones <span style="font-size:10px; font-weight:400; text-transform:none; color:var(--gris-500);">(cálculo automático)</span></h2>
      <div class="grid-resumen">
        <div class="stat"><div class="valor">${cat.pesquerosOtros}</div><div class="etiqueta">Pesqueros/otros</div></div>
        <div class="stat"><div class="valor">${cat.porAveria}</div><div class="etiqueta">Por avería</div></div>
        <div class="stat"><div class="valor">${cat.cargaPasaje}</div><div class="etiqueta">Carga/Pasaje</div></div>
        <div class="stat"><div class="valor">${cat.convoyesExtr}</div><div class="etiqueta">Convoyes/buq. extr.</div></div>
        <div class="stat"><div class="valor">${cat.convoyArgentino}</div><div class="etiqueta">Convoy B/ARG</div></div>
        <div class="stat"><div class="valor">${tot.diarioArg + tot.diarioExt}</div><div class="etiqueta">Total diario</div></div>
        <div class="stat"><div class="valor">${tot.anualArg + tot.anualExt}</div><div class="etiqueta">Total anual</div></div>
      </div>
      <p style="font-size:11.5px; color:var(--gris-500); margin-top:10px;">
        El total diario y el total anual se calculan solos a partir de las inspecciones cargadas — no se ingresan a mano.
        El diario se reinicia cada día; el anual es correlativo (suma lo acumulado + lo cargado hoy).
      </p>
    </div>
  `;
}

function renderEstadoRectorPuerto() {
  const rp = D.estadoRectorPuerto.resumen;
  const pctDiario = rp.factiblesDiario ? ((rp.inspeccionadosDiario / rp.factiblesDiario) * 100).toFixed(2) : '0.00';
  const pctAnual = rp.factiblesAnual ? ((rp.inspeccionadosAnual / rp.factiblesAnual) * 100).toFixed(2) : '0.00';
  return `
    <div class="tarjeta">
      <h2>Inspecciones por Estado Rector del Puerto</h2>
      ${renderInspeccionesPorDependencia(D.estadoRectorPuerto)}
    </div>
    <div class="tarjeta">
      <h2>Resumen PSC (Port State Control)</h2>
      <div class="grid-resumen">
        <div class="stat"><div class="valor">${rp.buquesIngresados}</div><div class="etiqueta">Buques extr. ingresados</div></div>
        <div class="stat"><div class="valor">${rp.factiblesDiario}</div><div class="etiqueta">Factibles (hoy)</div></div>
        <div class="stat"><div class="valor">${rp.inspeccionadosDiario}</div><div class="etiqueta">Inspeccionados (hoy)</div></div>
        <div class="stat"><div class="valor">${pctDiario}%</div><div class="etiqueta">Total % (hoy)</div></div>
        <div class="stat"><div class="valor">${rp.factiblesAnual}</div><div class="etiqueta">Factibles (anual)</div></div>
        <div class="stat"><div class="valor">${rp.inspeccionadosAnual}</div><div class="etiqueta">Inspeccionados (anual)</div></div>
        <div class="stat"><div class="valor">${pctAnual}%</div><div class="etiqueta">Total % (anual)</div></div>
      </div>
      <p style="font-size:11.5px; color:var(--gris-500); margin-top:10px;">
        % calculado por regla de tres simple entre buques factibles de inspección e inspeccionados.
      </p>
    </div>
  `;
}

// ---------- Casos MAS / SAR ----------
function renderCasosMAS() {
  let html = `<div class="tarjeta"><h2>Casos MAS</h2>`;
  Object.entries(D.casosMAS.porDependencia).forEach(([dep, casos]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    casos.forEach(c => { html += renderTarjetaCaso(c, false); });
    html += `</details>`;
  });
  html += `<button class="btn-primario" type="button" disabled title="Se habilita al conectar Firestore">+ Agregar caso</button></div>`;
  return html;
}

function renderCasosSAR() {
  let html = `<div class="tarjeta"><h2>Casos SAR</h2>`;
  Object.entries(D.casosSAR.porDependencia).forEach(([dep, casos]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    casos.forEach(c => { html += renderTarjetaCaso(c, true); });
    html += `</details>`;
  });
  html += `<button class="btn-primario" type="button" disabled title="Se habilita al conectar Firestore">+ Agregar caso</button></div>`;
  return html;
}

function renderTarjetaCaso(c, esSAR) {
  return `
    <div class="tarjeta" style="margin-bottom:12px; background:var(--gris-100);">
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:6px;">
        <strong style="color:var(--azul-marino); font-size:14px;">${esc(c.titulo)}</strong>
        ${tagEstado(c.estado)}
      </div>
      ${esSAR ? `<div style="font-size:11.5px; color:var(--gris-500); margin-top:2px;">
        N.º de caso: ${esc(c.numeroCaso)} · Subcentro (VTS): ${esc(c.subcentroVTS)} ·
        Inicio: ${esc(c.fechaInicio)} ${c.fechaCierre ? '· Cierre: ' + esc(c.fechaCierre) : ''}
      </div>` : ''}
      <div style="margin-top:8px; font-size:13px;"><strong>Asunto:</strong> ${esc(c.asunto || c.titulo)}</div>
      <div style="margin-top:4px; font-size:13px;"><strong>Posición:</strong> ${esc(c.posicion)}</div>
      <div style="margin-top:4px; font-size:13px; color:var(--rojo);"><strong>Novedad:</strong> ${esc(c.novedad)}</div>
      <div style="margin-top:4px; font-size:13px;"><strong>Características:</strong> ${esc(c.caracteristicas)}</div>
      <div style="margin-top:4px; font-size:13px;"><strong>Situación:</strong> ${esc(c.situacion)}</div>
      <div style="margin-top:8px;"><button class="btn-secundario" type="button" disabled>Editar</button></div>
    </div>
  `;
}

// ---------- Otros ----------
function renderOtros() {
  let html = `<div class="tarjeta"><h2>Otros</h2>`;
  Object.entries(D.otros.porDependencia).forEach(([dep, bloques]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    bloques.forEach(b => {
      if (b.tipoBloque === 'texto') {
        html += `<div class="item-insp"><strong>${esc(b.titulo)}</strong><p style="margin:6px 0 0;">${esc(b.contenido)}</p></div>`;
      } else if (b.tipoBloque === 'tabla') {
        html += `<div class="item-insp"><strong>${esc(b.titulo)}</strong>${renderTablaGenerica(b.columnas, b.filas)}</div>`;
      }
    });
    html += `</details>`;
  });
  html += `
    <div style="display:flex; gap:10px; margin-top:10px;">
      <button class="btn-secundario" type="button" disabled>+ Agregar bloque de texto</button>
      <button class="btn-secundario" type="button" disabled>+ Agregar bloque de tabla</button>
    </div>
  </div>`;
  return html;
}

// ---------- Tablas genéricas ----------
function renderTablaGenerica(columnas, filas) {
  let html = `<table class="tabla-datos"><thead><tr>`;
  columnas.forEach(c => html += `<th>${esc(c)}</th>`);
  html += `</tr></thead><tbody>`;
  filas.forEach(fila => {
    html += `<tr>`;
    fila.forEach(celda => html += `<td>${esc(celda)}</td>`);
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function renderBuquesDetencion() {
  const filas = D.buquesDetencion.map(b => [b.numero, b.dependencia, b.buque, b.fecha, b.tipoInsp, b.deficiencias]);
  return `<div class="tarjeta"><h2>Buques con Detención</h2>${renderTablaGenerica(['N.º', 'Dependencia', 'Buque', 'Fecha', 'Tipo Insp.', 'Deficiencias'], filas)}</div>`;
}

function renderInspeccionesTecnicas() {
  let html = `<div class="tarjeta"><h2>Inspecciones Técnicas</h2><table class="tabla-datos"><thead><tr>
    <th>Especialidad</th><th>Embarcación/Empresa</th><th>Requerimiento</th><th>Lugar</th><th>Inspector/MOI</th>
  </tr></thead><tbody>`;
  D.inspeccionesTecnicas.forEach(i => {
    html += `<tr>
      <td>${esc(i.especialidad)}</td>
      <td>${esc(i.embarcacion)}</td>
      <td>${esc(i.requerimiento)}</td>
      <td>${esc(i.lugar)}</td>
      <td>
        ${esc(i.inspector)}
        ${i.extranjero ? '<span class="tag detallada" style="margin-left:6px;">Extranjero</span>' : ''}
        ${i.salida && i.salida.fechaHora ? `<div style="font-size:11px; color:var(--gris-700); margin-top:4px;">
          Salida: ${esc(i.salida.fechaHora)} · Vuelo ${esc(i.salida.vuelo)} · ${esc(i.salida.destino)}<br>
          Regreso: ${esc(i.regreso.fechaHora)} · Vuelo ${esc(i.regreso.vuelo)} · ${esc(i.regreso.destino)}
        </div>` : ''}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function renderDivisionControlGestion() {
  const filas = D.divisionControlGestion.map(a => [a.tipoAuditoria, a.embarcacion, a.alcance, a.lugar, a.auditor]);
  return `<div class="tarjeta"><h2>División Control de Gestión</h2>${renderTablaGenerica(['Tipo de auditoría', 'Embarcación/Empresa', 'Alcance', 'Lugar', 'Auditor'], filas)}</div>`;
}

function renderLicencias() {
  const secciones = [
    ['Licencia Anual', D.licencias.anuales],
    ['Licencia Médica', D.licencias.medicas],
    ['Tareas Adecuadas', D.licencias.tareasAdecuadas],
    ['Licencia Extraordinaria', D.licencias.extraordinaria],
    ['Comisiones', D.licencias.comisiones],
    ['Licencias No Computables', D.licencias.noComputables]
  ];
  let html = '';
  secciones.forEach(([titulo, lista]) => {
    const filas = lista.map(l => [l.jerarquia, l.nombre, l.inicia, l.vence]);
    html += `<div class="tarjeta"><h2>${esc(titulo)} <span class="contador">${lista.length}</span></h2>
      ${lista.length ? renderTablaGenerica(['Jerarquía', 'Apellido y Nombre', 'Inicia', 'Vence'], filas) : '<div class="placeholder-panel">Sin registros</div>'}
    </div>`;
  });
  return html;
}

function renderGuardiaLista(titulo, lista) {
  return `
    <div style="min-width:220px;">
      <h3 style="font-size:12.5px; text-transform:uppercase; color:var(--gris-700); margin-bottom:8px;">${esc(titulo)}</h3>
      ${lista.map(g => `<div style="margin-bottom:6px; font-size:13px;"><strong>${esc(g.rol)}:</strong> ${esc(g.nombre)}</div>`).join('')}
    </div>
  `;
}

function renderGuardia() {
  return `
    <div class="tarjeta">
      <h2>Relevo de Guardia</h2>
      <div style="display:flex; gap:50px; flex-wrap:wrap;">
        ${renderGuardiaLista('Guardia Saliente', D.guardia.saliente)}
        ${renderGuardiaLista('Guardia Entrante', D.guardia.entrante)}
      </div>
    </div>
  `;
}

// ---------- Registro de pestañas ----------
const PESTANAS = [
  { id: 'inicio', grupo: 'Parte diario', etiqueta: 'Inicio', render: renderInicio },
  { id: 'insp-extraordinarias', grupo: 'Parte diario', etiqueta: 'Insp. Extraordinarias', render: renderExtraordinarias },
  { id: 'insp-psc', grupo: 'Parte diario', etiqueta: 'Estado Rector de Puerto', render: renderEstadoRectorPuerto },
  { id: 'casos-mas', grupo: 'Parte diario', etiqueta: 'Casos MAS', render: renderCasosMAS },
  { id: 'casos-sar', grupo: 'Parte diario', etiqueta: 'Casos SAR', render: renderCasosSAR },
  { id: 'otros', grupo: 'Parte diario', etiqueta: 'Otros', render: renderOtros },
  { id: 'estadisticas', grupo: 'Análisis', etiqueta: 'Estadísticas', render: renderEstadisticas },
  { id: 'buques-detencion', grupo: 'Gestión', etiqueta: 'Buques con Detención', render: renderBuquesDetencion },
  { id: 'insp-tecnicas', grupo: 'Gestión', etiqueta: 'Inspecciones Técnicas', render: renderInspeccionesTecnicas },
  { id: 'control-gestion', grupo: 'Gestión', etiqueta: 'Div. Control de Gestión', render: renderDivisionControlGestion },
  { id: 'licencias', grupo: 'Gestión', etiqueta: 'Licencias', render: renderLicencias },
  { id: 'guardia', grupo: 'Gestión', etiqueta: 'Relevo de Guardia', render: renderGuardia }
];

let PESTANAS_ACTUALES = [];

function iniciarDashboard() {
  const usuario = requerirSesion();
  if (!usuario) return;

  const modulo = sessionStorage.getItem('novedades_dpsn_modulo');
  if (!modulo || !puedeVer(usuario, modulo)) {
    window.location.href = 'seleccion.html';
    return;
  }
  const soloLectura = !puedeEditar(usuario, modulo);

  document.getElementById('nombreUsuario').textContent =
    (usuario.jerarquia ? usuario.jerarquia + ' ' : '') + (usuario.nombre || usuario.email);
  document.getElementById('rolPill').textContent = soloLectura ? 'Solo lectura' : 'Administrador';
  document.getElementById('moduloActual').textContent =
    modulo === 'oficinas' ? 'Oficinas DPSN' : 'Guardias DPSN';
  document.getElementById('fechaParte').textContent = D.fechaParte;
  document.body.classList.toggle('modo-lectura', soloLectura);

  // Botón de exportación global: solo tiene sentido en Guardias
  // (el parte diario completo). En Oficinas, cada oficina exporta
  // su propio contenido desde su panel.
  const btnExportar = document.getElementById('btnExportarGlobal');
  if (modulo === 'guardias') {
    btnExportar.classList.remove('oculto');
    btnExportar.onclick = abrirModalExportarGuardia;
  } else {
    btnExportar.classList.add('oculto');
  }

  PESTANAS_ACTUALES = modulo === 'oficinas'
    ? OFICINAS_LIST.map(of => ({
        id: of.id, grupo: 'Oficinas DPSN', etiqueta: of.nombre,
        render: () => renderOficina(of, soloLectura)
      }))
    : PESTANAS;

  // Armar sidebar agrupado
  const grupos = {};
  PESTANAS_ACTUALES.forEach(p => { (grupos[p.grupo] = grupos[p.grupo] || []).push(p); });
  const sidebar = document.getElementById('sidebarTabs');
  sidebar.innerHTML = '';
  Object.entries(grupos).forEach(([grupo, tabs]) => {
    sidebar.innerHTML += `<div class="grupo-titulo">${esc(grupo)}</div>`;
    tabs.forEach(t => {
      sidebar.innerHTML += `<button class="tab-link" data-id="${t.id}">${esc(t.etiqueta)}</button>`;
    });
  });

  sidebar.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => mostrarPestana(btn.dataset.id));
  });

  mostrarPestana(PESTANAS_ACTUALES[0].id);
  document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);
  document.getElementById('btnVolverModulos').addEventListener('click', () => {
    window.location.href = 'seleccion.html';
  });
}

function mostrarPestana(id) {
  const pestana = PESTANAS_ACTUALES.find(p => p.id === id);
  if (!pestana) return;

  sessionStorage.setItem('novedades_dpsn_tab_actual', id);
  document.querySelectorAll('.tab-link').forEach(b => b.classList.toggle('activo', b.dataset.id === id));
  document.getElementById('tituloPanel').textContent = pestana.etiqueta;
  document.getElementById('contenidoPanel').innerHTML = pestana.render();
}
