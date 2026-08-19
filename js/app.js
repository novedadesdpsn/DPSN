// ============================================================
// APP — Novedades DPSN — render de pestañas y paneles
// ============================================================

const D = DATOS_EJEMPLO; // alias corto
let SOLO_LECTURA_ACTUAL = false;

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
    <div class="inicio-grid">
      <div class="inicio-col inicio-col-mapa">
        <div class="tarjeta mapa-tarjeta">
          <h2>Buques con Detención <span class="contador">${D.buquesDetencionMapa.length}</span></h2>
          <div id="mapaBuquesDetencion" class="mapa-contenedor"></div>
          ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-primario" type="button" style="margin-top:10px; width:100%;" onclick="uiAgregarBuqueDetencionMapa()">+ Agregar nuevo</button>` : ''}
        </div>
      </div>

      <div class="inicio-col inicio-col-resumen">
        <div class="tarjeta">
          <h2>Resumen del parte</h2>
          <div class="grid-resumen">
            <div class="stat acc-1"><div class="valor">${tot.diarioArg}</div><div class="etiqueta">Insp. Extraord. Argentina</div></div>
            <div class="stat acc-2"><div class="valor">${tot.diarioExt}</div><div class="etiqueta">Insp. Extraord. Extranjera</div></div>
            <div class="stat acc-3"><div class="valor">${rp.inspeccionadosDiario}</div><div class="etiqueta">PSC inspeccionados hoy</div></div>
            <div class="stat acc-4"><div class="valor">${contarCasos(D.casosMAS)}</div><div class="etiqueta">Casos MAS pendientes</div></div>
            <div class="stat acc-5"><div class="valor">${contarCasos(D.casosSAR)}</div><div class="etiqueta">Casos SAR pendientes</div></div>
            <div class="stat acc-1"><div class="valor">${contarOtros()}</div><div class="etiqueta">Otras situaciones</div></div>
            <div class="stat acc-2"><div class="valor">${D.buquesDetencionMapa.length}</div><div class="etiqueta">Buques con detención</div></div>
            <div class="stat acc-3"><div class="valor">${contarLicenciasTotal()}</div><div class="etiqueta">Personas de licencia</div></div>
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
          <h2>Guardia</h2>
          <div style="display:flex; gap:40px; flex-wrap:wrap;">
            ${renderGuardiaLista('Saliente', D.guardia.saliente)}
            ${renderGuardiaLista('Entrante', D.guardia.entrante)}
          </div>
        </div>
      </div>

      <div class="inicio-col inicio-col-mapa">
        <div class="tarjeta mapa-tarjeta">
          <h2>Inspectores por Dependencia</h2>
          <iframe src="embeds/mapa-inspectores.html" class="mapa-embed" title="Mapa de inspectores por dependencia"></iframe>
          <button class="btn-secundario" type="button" style="margin-top:10px; width:100%;" onclick="window.open('embeds/tablero-inspectores.html','_blank')">Ver panel</button>
        </div>
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
function renderInspeccionesPorDependencia(bloque, contexto) {
  let html = '';
  Object.entries(bloque.porDependencia).forEach(([dep, lista]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)} (${lista.length})</summary>`;
    lista.forEach((insp, idx) => {
      const esPSC = contexto === 'psc';
      const onclickEliminar = esPSC ? `eliminarInspeccionPSC('${dep}',${idx})` : `eliminarInspeccionExtraordinaria('${contexto}','${dep}',${idx})`;
      const onclickEditar = esPSC ? `uiEditarInspeccionPSC('${dep}',${idx})` : `uiEditarInspeccionExtraordinaria('${contexto}','${dep}',${idx})`;
      html += `<div class="item-insp">
        <div style="display:flex; justify-content:space-between; gap:8px;">
          <div>
            ${insp.tipo === 'seguimiento'
              ? `<span class="tag seguimiento">IS de ID Fecha ${esc(insp.fechaInspMasDetallada || '—')}</span>`
              : tagTipo(insp.tipo)}
            <strong>${esc(insp.buque.tipo)} "${esc(insp.buque.nombre)}"</strong>
            (${esc(insp.buque.matricula)}) — B/${esc(insp.buque.bandera)}
          </div>
          ${!SOLO_LECTURA_ACTUAL ? `<div style="display:flex; gap:4px; flex-shrink:0;">
            <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="${onclickEditar}">Editar</button>
            <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="${onclickEliminar}">✕</button>
          </div>` : ''}
        </div>`;
      if (insp.asunto) html += `<div style="margin-top:4px;">Ref. Caso MAS: ${esc(insp.asunto)}</div>`;
      if (insp.tipo === 'inicial') {
        html += `<div style="margin-top:4px; color:var(--acento); font-weight:600;">Sin registrar deficiencias</div>`;
      }
      if (insp.deficiencias && insp.deficiencias.length) {
        html += `<ul style="margin:6px 0 0 18px; padding:0;">`;
        insp.deficiencias.forEach(g => {
          html += `<li>${esc(textoGrupoDeficiencia(g))}</li>`;
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
        ? renderInspeccionesPorDependencia(arg, 'argentina')
        : '<div class="placeholder-panel">NIL — sin novedades para bandera argentina en este parte.</div>'}
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-secundario" type="button" style="margin-top:10px;" onclick="uiAgregarInspeccionExtraordinaria('argentina')">+ Agregar inspección</button>` : ''}
    </div>
    <div class="tarjeta">
      <h2>Inspecciones Extraordinarias — Bandera Extranjera <span class="contador">${tot.diarioExt} hoy</span></h2>
      ${Object.keys(ext.porDependencia).length
        ? renderInspeccionesPorDependencia(ext, 'extranjera')
        : '<div class="placeholder-panel">NIL — sin novedades para bandera extranjera en este parte.</div>'}
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-secundario" type="button" style="margin-top:10px;" onclick="uiAgregarInspeccionExtraordinaria('extranjera')">+ Agregar inspección</button>` : ''}
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
      ${renderInspeccionesPorDependencia(D.estadoRectorPuerto, 'psc')}
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-secundario" type="button" style="margin-top:10px;" onclick="uiAgregarInspeccionPSC()">+ Agregar inspección</button>` : ''}
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
    casos.forEach((c, idx) => { html += renderTarjetaCaso(c, false, dep, idx); });
    html += `</details>`;
  });
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" onclick="uiAgregarCaso('MAS')">+ Agregar caso</button>`;
  html += `</div>`;
  return html;
}

function renderCasosSAR() {
  let html = `<div class="tarjeta"><h2>Casos SAR</h2>`;
  Object.entries(D.casosSAR.porDependencia).forEach(([dep, casos]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    casos.forEach((c, idx) => { html += renderTarjetaCaso(c, true, dep, idx); });
    html += `</details>`;
  });
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" onclick="uiAgregarCaso('SAR')">+ Agregar caso</button>`;
  html += `</div>`;
  return html;
}

function renderTarjetaCaso(c, esSAR, dependencia, indice) {
  const tipo = esSAR ? 'SAR' : 'MAS';
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
      ${!SOLO_LECTURA_ACTUAL ? `
      <div style="margin-top:8px; display:flex; gap:8px;">
        <button class="btn-secundario" type="button" onclick="uiEditarCaso('${tipo}','${dependencia}',${indice})">Editar</button>
        <button class="btn-secundario" type="button" onclick="eliminarCaso('${tipo}','${dependencia}',${indice})">Eliminar</button>
      </div>` : ''}
    </div>
  `;
}

// ---------- Otros ----------
function renderOtros() {
  let html = `<div class="tarjeta"><h2>Otros</h2>`;
  Object.entries(D.otros.porDependencia).forEach(([dep, bloques]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    bloques.forEach((b, idx) => {
      const btnEliminar = !SOLO_LECTURA_ACTUAL ? `<button type="button" class="btn-secundario" style="padding:2px 8px; float:right;" onclick="eliminarOtro('${dep}',${idx})">✕</button>` : '';
      if (b.tipoBloque === 'texto') {
        html += `<div class="item-insp">${btnEliminar}<strong>${esc(b.titulo)}</strong><p style="margin:6px 0 0;">${esc(b.contenido)}</p></div>`;
      } else if (b.tipoBloque === 'tabla') {
        html += `<div class="item-insp">${btnEliminar}<strong>${esc(b.titulo)}</strong>${renderTablaGenerica(b.columnas, b.filas)}</div>`;
      }
    });
    html += `</details>`;
  });
  if (!SOLO_LECTURA_ACTUAL) {
    html += `
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn-secundario" type="button" onclick="uiAgregarOtroTexto()">+ Agregar bloque de texto</button>
        <button class="btn-secundario" type="button" onclick="uiAgregarOtroTabla()">+ Agregar bloque de tabla</button>
      </div>`;
  }
  html += `</div>`;
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
  let html = `<div class="tarjeta"><h2>Buques con Detención <span class="contador">${D.buquesDetencion.length}</span></h2>`;
  html += `<table class="tabla-datos"><thead><tr>
    <th>N.º</th><th>Dependencia</th><th>Buque</th><th>Fecha</th><th>Tipo Insp.</th><th>Deficiencias</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}
  </tr></thead><tbody>`;
  D.buquesDetencion.forEach((b, idx) => {
    html += `<tr>
      <td>${esc(b.numero)}</td><td>${esc(b.dependencia)}</td><td>${esc(b.buque)}</td>
      <td>${esc(b.fecha)}</td><td>${esc(b.tipoInsp)}</td><td>${esc(b.deficiencias)}</td>
      ${!SOLO_LECTURA_ACTUAL ? `<td><button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarBuqueDetencionTabla(${idx})">✕</button></td>` : ''}
    </tr>`;
  });
  html += `</tbody></table>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" style="margin-top:12px;" onclick="uiAgregarBuqueDetencionTabla()">+ Agregar buque</button>`;
  html += `</div>`;
  return html;
}

function renderInspeccionesTecnicas() {
  let html = `<div class="tarjeta"><h2>Inspecciones Técnicas <span class="contador">${D.inspeccionesTecnicas.length}</span></h2><table class="tabla-datos"><thead><tr>
    <th>Especialidad</th><th>Embarcación/Empresa</th><th>Requerimiento</th><th>Lugar</th><th>Inspector/MOI</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}
  </tr></thead><tbody>`;
  D.inspeccionesTecnicas.forEach((i, idx) => {
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
      ${!SOLO_LECTURA_ACTUAL ? `<td><button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarInspeccionTecnica(${idx})">✕</button></td>` : ''}
    </tr>`;
  });
  html += `</tbody></table>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" style="margin-top:12px;" onclick="uiAgregarInspeccionTecnica()">+ Agregar inspección prevista</button>`;
  html += `</div>`;
  return html;
}

function renderDivisionControlGestion() {
  let html = `<div class="tarjeta"><h2>División Control de Gestión <span class="contador">${D.divisionControlGestion.length}</span></h2>`;
  html += `<table class="tabla-datos"><thead><tr>
    <th>Tipo de auditoría</th><th>Embarcación/Empresa</th><th>Alcance</th><th>Lugar</th><th>Auditor</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}
  </tr></thead><tbody>`;
  D.divisionControlGestion.forEach((a, idx) => {
    html += `<tr>
      <td>${esc(a.tipoAuditoria)}</td><td>${esc(a.embarcacion)}</td><td>${esc(a.alcance)}</td><td>${esc(a.lugar)}</td><td>${esc(a.auditor)}</td>
      ${!SOLO_LECTURA_ACTUAL ? `<td><button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarAuditoria(${idx})">✕</button></td>` : ''}
    </tr>`;
  });
  html += `</tbody></table>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" style="margin-top:12px;" onclick="uiAgregarAuditoria()">+ Agregar auditoría</button>`;
  html += `</div>`;
  return html;
}

function renderLicencias() {
  const secciones = [
    ['Licencia Anual', D.licencias.anuales, 'anuales'],
    ['Licencia Médica', D.licencias.medicas, 'medicas'],
    ['Tareas Adecuadas', D.licencias.tareasAdecuadas, 'tareasAdecuadas'],
    ['Licencia Extraordinaria', D.licencias.extraordinaria, 'extraordinaria'],
    ['Comisiones', D.licencias.comisiones, 'comisiones'],
    ['Licencias No Computables', D.licencias.noComputables, 'noComputables']
  ];
  let html = '';
  secciones.forEach(([titulo, lista, clave]) => {
    html += `<div class="tarjeta"><h2>${esc(titulo)} <span class="contador">${lista.length}</span></h2>`;
    if (lista.length) {
      html += `<table class="tabla-datos"><thead><tr><th>Jerarquía</th><th>Apellido y Nombre</th><th>Inicia</th><th>Vence</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}</tr></thead><tbody>`;
      lista.forEach((l, idx) => {
        html += `<tr>
          <td>${esc(l.jerarquia)}</td><td>${esc(l.nombre)}</td><td>${esc(l.inicia)}</td><td>${esc(l.vence)}</td>
          ${!SOLO_LECTURA_ACTUAL ? `<td><button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarLicencia('${clave}',${idx})">✕</button></td>` : ''}
        </tr>`;
      });
      html += `</tbody></table>`;
    } else {
      html += '<div class="placeholder-panel">Sin registros</div>';
    }
    html += `</div>`;
  });
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" onclick="uiAgregarLicencia()">+ Agregar licencia</button>`;
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

// ---------- Registro de pestañas ----------
const PESTANAS = [
  { id: 'inicio', grupo: 'Parte diario', etiqueta: 'Inicio', render: renderInicio },
  { id: 'insp-extraordinarias', grupo: 'Parte diario', etiqueta: 'Insp. Extraordinarias', render: renderExtraordinarias },
  { id: 'insp-psc', grupo: 'Parte diario', etiqueta: 'Estado Rector de Puerto', render: renderEstadoRectorPuerto },
  { id: 'casos-mas', grupo: 'Parte diario', etiqueta: 'Casos MAS', render: renderCasosMAS },
  { id: 'casos-sar', grupo: 'Parte diario', etiqueta: 'Casos SAR', render: renderCasosSAR },
  { id: 'otros', grupo: 'Parte diario', etiqueta: 'Otros', render: renderOtros },
  { id: 'buques-detencion', grupo: 'Gestión', etiqueta: 'Buques con Detención', render: renderBuquesDetencion },
  { id: 'insp-tecnicas', grupo: 'Gestión', etiqueta: 'Inspecciones Técnicas', render: renderInspeccionesTecnicas },
  { id: 'control-gestion', grupo: 'Gestión', etiqueta: 'Div. Control de Gestión', render: renderDivisionControlGestion },
  { id: 'licencias', grupo: 'Gestión', etiqueta: 'Licencias', render: renderLicencias }
];

function iniciarDashboard() {
  const usuario = requerirSesion();
  if (!usuario) return;

  if (!puedeVer(usuario)) {
    alert('Tu usuario no tiene acceso al sistema. Contactá al administrador.');
    cerrarSesion();
    return;
  }
  const soloLectura = !puedeEditar(usuario);
  SOLO_LECTURA_ACTUAL = soloLectura;

  document.getElementById('nombreUsuario').textContent =
    (usuario.jerarquia ? usuario.jerarquia + ' ' : '') + (usuario.nombre || usuario.dni);
  document.getElementById('rolPill').textContent = soloLectura ? 'Solo lectura' : 'Administrador';
  document.body.classList.toggle('modo-lectura', soloLectura);

  document.getElementById('btnExportarGlobal').onclick = abrirModalExportarGuardia;

  // Armar la barra de pestañas superior
  const nav = document.getElementById('tabsNav');
  nav.innerHTML = PESTANAS.map(t =>
    `<button class="tab-link" data-id="${t.id}">${esc(t.etiqueta)}</button>`
  ).join('');
  nav.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => mostrarPestana(btn.dataset.id));
  });

  mostrarPestana(PESTANAS[0].id);
  document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);
}

function mostrarPestana(id) {
  const pestana = PESTANAS.find(p => p.id === id);
  if (!pestana) return;

  sessionStorage.setItem('novedades_dpsn_tab_actual', id);
  document.querySelectorAll('.tab-link').forEach(b => b.classList.toggle('activo', b.dataset.id === id));
  document.getElementById('contenidoPanel').innerHTML = pestana.render();

  if (id === 'inicio') inicializarMapaBuquesDetencion();

  const fab = document.getElementById('fabAsistente');
  if (fab) fab.classList.toggle('oculto', id !== 'inicio');
  if (id !== 'inicio') cerrarPanelAsistente();
}

function refrescarPestanaActual() {
  const idActual = sessionStorage.getItem('novedades_dpsn_tab_actual');
  if (idActual) mostrarPestana(idActual);
}
