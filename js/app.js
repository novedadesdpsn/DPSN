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

function renderLineasDescripcionHtml(g) {
  const { items, extra } = paresDeficiencia(g);
  let html = '';
  if (items.length) {
    html += `<ol style="margin:4px 0 0 20px; padding:0; list-style:decimal;">` + items.map(it => `<li>${esc(it.texto)}${it.subsano ? ` <strong>${esc(subsanoEntreParentesis(it.subsano))}</strong>` : ''}</li>`).join('') + `</ol>`;
  }
  if (extra.length) {
    html += `<div style="margin-top:3px; font-weight:700;">${extra.map(esc).join('<br>')}</div>`;
  }
  return html;
}

function tagTipo(tipo) {
  const nombres = { inicial: 'Inicial', detallada: 'Más detallada', averia: 'Por avería (IA)', seguimiento: 'Seguimiento' };
  return `<span class="tag ${tipo}">${nombres[tipo] || tipo}</span>`;
}

function tagEstado(estado) {
  const nombres = { abierto: 'Abierto', pendiente: 'Pendiente', cerrado: 'Cerrado' };
  return `<span class="tag ${estado}">${nombres[estado] || estado}</span>`;
}

// ---------- Inicio / resumen del día ----------
// Las inspecciones de seguimiento (IS) no computan: se realizan, pero no son una inspección nueva.
function contarInspeccionesGrupo(grupo) {
  let n = 0;
  Object.values(grupo.porDependencia).forEach(lista => { n += lista.filter(i => i.tipo !== 'seguimiento').length; });
  return n;
}

/** Cuántas inspecciones PSC de hoy tienen tildado "¿Se hizo CIC?". */
function contarCIC(grupo) {
  let n = 0;
  Object.values(grupo.porDependencia).forEach(lista => { lista.forEach(i => { if (i.cic) n++; }); });
  return n;
}

function calcularTotalesExtraordinarias() {
  const arg = D.inspeccionesExtraordinarias.argentina;
  const ext = D.inspeccionesExtraordinarias.extranjera;
  const diarioArg = contarInspeccionesGrupo(arg);
  const diarioExt = contarInspeccionesGrupo(ext);
  return {
    diarioArg, diarioExt,
    anualArg: (arg.acumuladoAnualPrevio || 0) + diarioArg,
    anualExt: (ext.acumuladoAnualPrevio || 0) + diarioExt
  };
}

function calcularResumenCategorias() {
  const cat = { pesquerosOtros: 0, porAveria: 0, cargaPasaje: 0, convoyesExtr: 0, convoyArgentino: 0 };
  [D.inspeccionesExtraordinarias.argentina, D.inspeccionesExtraordinarias.extranjera].forEach(grupo => {
    Object.values(grupo.porDependencia).forEach(lista => {
      lista.forEach(insp => {
        if (insp.tipo === 'seguimiento') return;
        // "Por avería" se decide por el tipo de inspección, no por el tipo de buque elegido en
        // "categoría": así un convoy (o cualquier otro) inspeccionado por avería cuenta como avería,
        // y la categoría elegida queda intacta para lo demás (texto de convoy, barcazas, etc.).
        const c = insp.tipo === 'averia' ? 'porAveria' : (insp.categoria || 'pesquerosOtros');
        if (cat[c] !== undefined) cat[c]++;
      });
    });
  });
  // Valores corregidos a mano (si los hay) reemplazan al cálculo automático.
  const man = D.inspeccionesExtraordinarias.resumenManual || {};
  Object.keys(cat).forEach(k => {
    if (man[k] !== undefined && man[k] !== null && man[k] !== '') cat[k] = parseInt(man[k], 10) || 0;
  });
  return cat;
}

/** Inspeccionados PSC: se cuenta solo (IISD + IICD), igual que las extraordinarias; IS no computa.
 *  Si hay una corrección manual cargada, esa gana por sobre el cálculo automático. */
function calcularInspeccionadosPSC() {
  const rp = D.estadoRectorPuerto.resumen;
  const auto = contarInspeccionesGrupo(D.estadoRectorPuerto);
  const man = rp.inspeccionadosManual;
  return (man !== undefined && man !== null && man !== '') ? (parseInt(man, 10) || 0) : auto;
}

function contarOtros() {
  let n = 0;
  Object.values(D.otros.porDependencia).forEach(lista => { n += lista.length; });
  return n;
}

function contarLicenciasTotal() {
  return todasLasCategoriasLicencia().reduce((n, c) => n + (D.licencias[c.clave] || []).length, 0);
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
            <div class="stat acc-1 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('insp-extraordinarias')"><div class="valor">${tot.diarioArg}</div><div class="etiqueta">Insp. Extraord. Argentina</div></div>
            <div class="stat acc-2 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('insp-extraordinarias')"><div class="valor">${tot.diarioExt}</div><div class="etiqueta">Insp. Extraord. Extranjera</div></div>
            <div class="stat acc-3 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('insp-psc')"><div class="valor">${calcularInspeccionadosPSC()}</div><div class="etiqueta">PSC inspeccionados hoy</div></div>
            <div class="stat acc-4 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('casos-mas')"><div class="valor">${contarCasos(D.casosMAS)}</div><div class="etiqueta">Casos MAS pendientes</div></div>
            <div class="stat acc-5 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('casos-sar')"><div class="valor">${contarCasos(D.casosSAR)}</div><div class="etiqueta">Casos SAR pendientes</div></div>
            <div class="stat acc-1 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('otros')"><div class="valor">${contarOtros()}</div><div class="etiqueta">Otras situaciones</div></div>
            <div class="stat acc-2 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('buques-detencion')"><div class="valor">${D.buquesDetencionMapa.length}</div><div class="etiqueta">Buques con detención</div></div>
            <div class="stat acc-3 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('licencias')"><div class="valor">${contarLicenciasTotal()}</div><div class="etiqueta">Personas de licencia</div></div>
            <div class="stat acc-4 stat-link" role="button" tabindex="0" title="Ir a la pestaña" onclick="mostrarPestana('cursos')"><div class="valor">${D.cursos.length}</div><div class="etiqueta">Cursos / Comisiones</div></div>
          </div>
        </div>

        <div class="tarjeta">
          <h2>Guardia</h2>
          <div style="display:flex; gap:40px; flex-wrap:wrap;">
            ${renderGuardiaLista('Saliente', D.guardia.saliente)}
            ${renderGuardiaLista('Entrante', D.guardia.entrante)}
          </div>
          ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-secundario" type="button" style="margin-top:10px;" onclick="uiEditarGuardia()">Editar</button> <button class="btn-primario" type="button" style="margin-top:10px; background:var(--coral,#dc4a3f);" onclick="uiFinalizarGuardia()">Finalizar Guardia</button>` : ''}
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
            ${insp.cic ? '<span class="tag cic">CIC</span>' : ''}
            <strong>${esc(insp.buque.tipo)} "${esc(insp.buque.nombre)}"</strong>
            (${esc(insp.buque.matricula)}) — B/${esc(insp.buque.bandera)}
          </div>
          ${!SOLO_LECTURA_ACTUAL ? `<div style="display:flex; gap:4px; flex-shrink:0;">
            <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="${onclickEditar}">Editar</button>
            <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="${onclickEliminar}">✕</button>
          </div>` : ''}
        </div>`;
      if (insp.asunto) html += `<div style="margin-top:4px;">Ref. Caso MAS: ${esc(insp.asunto)}</div>`;
      if (insp.proximoPuerto) html += `<div style="margin-top:2px;">Próx. puerto: ${esc(insp.proximoPuerto)}</div>`;
      if (insp.caracteristicasConvoy) {
        html += `<div style="margin-top:4px; font-size:12px; color:var(--gris-700);">${insp.caracteristicasConvoy.split('\n').filter(l => l.trim()).map(l => esc(l.trim())).join('<br>')}</div>`;
      }
      if (insp.tipo === 'inicial') {
        html += `<div style="margin-top:4px; color:var(--acento); font-weight:600;">Sin registrar deficiencias</div>`;
      }
      if (insp.deficiencias && insp.deficiencias.length) {
        html += `<ul style="margin:6px 0 0 0; padding:0; list-style:none;">`;
        insp.deficiencias.forEach(g => {
          html += `<li>${esc(textoGrupoDeficiencia(g, esPSC ? CODIGOS_MEDIDAS_PSC : CODIGOS_MEDIDAS))}${renderLineasDescripcionHtml(g)}</li>`;
        });
        html += `</ul>`;
      }
      if (insp.nota) html += `<div style="margin-top:4px; font-style:italic; color:var(--gris-700);">Nota: ${esc(insp.nota)}</div>`;
      if (insp.barcazas && insp.barcazas.length) {
        html += `<div style="margin-top:8px;"><strong>Barcazas</strong></div>`;
        insp.barcazas.forEach(b => {
          html += `<div style="margin:4px 0 0 12px; padding-left:8px; border-left:2px solid var(--gris-300);">
            ${b.tipo === 'seguimiento' ? `<span class="tag seguimiento">IS de ID Fecha ${esc(b.fechaInspMasDetallada || '—')}</span>` : tagTipo(b.tipo)}
            <strong>"${esc(b.buque.nombre)}"</strong> (${esc(b.buque.matricula)}) — B/${esc(b.buque.bandera)}`;
          if (b.deficiencias && b.deficiencias.length) {
            html += `<ul style="margin:4px 0 0 0; padding:0; list-style:none;">${b.deficiencias.map(g => `<li>${esc(textoGrupoDeficiencia(g, CODIGOS_MEDIDAS))}${renderLineasDescripcionHtml(g)}</li>`).join('')}</ul>`;
          }
          if (b.nota) html += `<div style="font-style:italic; color:var(--gris-700);">Nota: ${esc(b.nota)}</div>`;
          html += `</div>`;
        });
      }
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
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-primario" type="button" style="margin-bottom:12px;" onclick="uiAgregarInspeccionExtraordinaria('argentina')">+ Agregar inspección</button>` : ''}
      ${Object.keys(arg.porDependencia).length
        ? renderInspeccionesPorDependencia(arg, 'argentina')
        : '<div class="placeholder-panel">NIL — sin novedades para bandera argentina en este parte.</div>'}
    </div>
    <div class="tarjeta">
      <h2>Inspecciones Extraordinarias — Bandera Extranjera <span class="contador">${tot.diarioExt} hoy</span></h2>
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-primario" type="button" style="margin-bottom:12px;" onclick="uiAgregarInspeccionExtraordinaria('extranjera')">+ Agregar inspección</button>` : ''}
      ${Object.keys(ext.porDependencia).length
        ? renderInspeccionesPorDependencia(ext, 'extranjera')
        : '<div class="placeholder-panel">NIL — sin novedades para bandera extranjera en este parte.</div>'}
    </div>
    <div class="tarjeta">
      <h2>Resumen de inspecciones <span style="font-size:10px; font-weight:400; text-transform:none; color:var(--gris-500);">(cálculo automático, editable)</span></h2>
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
        El diario se reinicia cada día; el anual es correlativo (suma lo acumulado + lo cargado hoy). Computan las iniciales, las más detalladas y las por avería (IA); las de seguimiento (IS) no.
      </p>
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-secundario" type="button" style="margin-top:6px;" onclick="uiEditarResumenExtraordinarias()">Editar resumen</button>` : ''}
    </div>
  `;
}

function renderEstadoRectorPuerto() {
  normalizarResumenPSC();
  const rp = D.estadoRectorPuerto.resumen;
  normalizarCIC();
  const cic = D.estadoRectorPuerto.cic;
  const cicDiario = contarCIC(D.estadoRectorPuerto);
  const inspeccionadosDiario = calcularInspeccionadosPSC();
  const buquesIngresadosTotal = (rp.buquesIngresadosAnualPrevio || 0) + (rp.buquesIngresadosDiario || 0);
  const factiblesAnual = (rp.factiblesAnualPrevio || 0) + (rp.factiblesDiario || 0);
  const inspeccionadosAnual = (rp.inspeccionadosAnualPrevio || 0) + inspeccionadosDiario;
  const pctAnual = factiblesAnual ? ((inspeccionadosAnual / factiblesAnual) * 100).toFixed(2) : '0.00';
  return `
    <div class="tarjeta">
      <h2>Inspecciones por Estado Rector del Puerto</h2>
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-primario" type="button" style="margin-bottom:12px;" onclick="uiAgregarInspeccionPSC()">+ Agregar inspección</button>` : ''}
      ${renderInspeccionesPorDependencia(D.estadoRectorPuerto, 'psc')}
    </div>
    <div class="tarjeta">
      <h2 style="text-align:center; text-transform:uppercase; font-size:13px;">${esc(cic.titulo)}</h2>
      <p style="text-align:center; font-weight:600; margin-top:-6px; margin-bottom:12px;">${esc(cic.vigencia)}</p>
      <table class="tabla-datos">
        <thead><tr><th>Diario</th><th>Total</th></tr></thead>
        <tbody><tr><td>${cicDiario || '--'}</td><td>${(cic.totalPrevio || 0) + cicDiario}</td></tr></tbody>
      </table>
      <p style="font-size:11.5px; color:var(--gris-500); margin-top:10px;">
        "Diario" se suma solo con cada inspección de hoy que tenga tildado "¿Se hizo CIC?". El "Total" se calcula solo (acumulado previo + lo de hoy) y pasa a formar parte del acumulado al Finalizar Guardia.
      </p>
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-secundario" type="button" style="margin-top:10px;" onclick="uiEditarCIC()">Editar</button>` : ''}
    </div>
    <div class="tarjeta">
      <h2>Resumen PSC (Port State Control)</h2>
      <div class="grid-resumen">
        <div class="stat"><div class="valor">${inspeccionadosDiario}</div><div class="etiqueta">Inspecciones del día</div></div>
        <div class="stat"><div class="valor">${buquesIngresadosTotal}</div><div class="etiqueta">Total buques ingresados</div></div>
        <div class="stat"><div class="valor">${factiblesAnual}</div><div class="etiqueta">Total factibles</div></div>
        <div class="stat"><div class="valor">${inspeccionadosAnual}</div><div class="etiqueta">Total inspeccionados</div></div>
        <div class="stat"><div class="valor">${pctAnual}%</div><div class="etiqueta">% parcial anual</div></div>
      </div>
      <p style="font-size:11.5px; color:var(--gris-500); margin-top:10px;">
        "Inspecciones del día" se suma solo a partir de las inspecciones cargadas arriba (inicial sin deficiencias + inicial con deficiencia); las de seguimiento no computan. "% parcial anual" se calcula solo (inspeccionados anual sobre factibles anual). Los totales de buques ingresados, factibles e inspeccionados se arman sumando el acumulado previo + lo de hoy — no hace falta tipearlos enteros cada vez.
      </p>
      ${!SOLO_LECTURA_ACTUAL ? `<button class="btn-secundario" type="button" style="margin-top:10px;" onclick="uiEditarResumenPSC()">Editar</button>` : ''}
    </div>
  `;
}

// ---------- Casos MAS / SAR ----------
function renderCasosMAS() {
  let html = `<div class="tarjeta"><h2>Casos MAS</h2>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" style="margin-bottom:12px;" onclick="uiAgregarCaso('MAS')">+ Agregar caso</button>`;
  Object.entries(D.casosMAS.porDependencia).forEach(([dep, casos]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    casos.forEach((c, idx) => { html += renderTarjetaCaso(c, false, dep, idx); });
    html += `</details>`;
  });
  html += `</div>`;
  return html;
}

function renderCasosSAR() {
  let html = `<div class="tarjeta"><h2>Casos SAR</h2>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" style="margin-bottom:12px;" onclick="uiAgregarCaso('SAR')">+ Agregar caso</button>`;
  Object.entries(D.casosSAR.porDependencia).forEach(([dep, casos]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    casos.forEach((c, idx) => { html += renderTarjetaCaso(c, true, dep, idx); });
    html += `</details>`;
  });
  html += `</div>`;
  return html;
}

function renderTarjetaCaso(c, esSAR, dependencia, indice) {
  const tipo = esSAR ? 'SAR' : 'MAS';
  return `
    <div class="tarjeta" style="margin-bottom:12px; background:var(--gris-100);">
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:6px;">
        <strong style="color:var(--azul-marino); font-size:14px;">${esc(tituloCompletoCaso(c, esSAR))}</strong>
        <div style="display:flex; gap:6px;">
          ${!esSAR && c.requiereInspeccion === 'si' ? '<span class="tag detallada">Requiere Inspección</span>' : ''}
          ${tagEstado(c.estado)}
        </div>
      </div>
      ${esSAR ? `<div style="font-size:11.5px; color:var(--gris-500); margin-top:2px;">
        Inicio: ${esc(c.fechaInicio)} ${c.fechaCierre ? '· Cierre: ' + esc(c.fechaCierre) : ''}
      </div>` : ''}
      <div class="texto-justificado" style="margin-top:8px; font-size:13px;"><strong>Posición:</strong> ${esc(c.posicion)}</div>
      <div class="texto-justificado" style="margin-top:4px; font-size:13px;"><strong>Características:</strong> ${esc(c.caracteristicas)}</div>
      <div class="texto-justificado" style="margin-top:4px; font-size:13px; color:var(--rojo);"><strong>Novedad:</strong> ${esc(c.novedad)}</div>
      <div class="texto-justificado" style="margin-top:4px; font-size:13px;"><strong>Situación:</strong> ${esc(c.situacion)}</div>
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
  if (!SOLO_LECTURA_ACTUAL) {
    html += `
      <div style="display:flex; gap:10px; margin-bottom:12px;">
        <button class="btn-primario" type="button" onclick="uiAgregarOtroTexto()">+ Agregar bloque de texto</button>
        <button class="btn-primario" type="button" onclick="uiAgregarOtroTabla()">+ Agregar bloque de tabla</button>
      </div>`;
  }
  Object.entries(D.otros.porDependencia).forEach(([dep, bloques]) => {
    html += `<details class="dependencia-bloque" open><summary>${esc(dep)}</summary>`;
    bloques.forEach((b, idx) => {
      const btnAcciones = !SOLO_LECTURA_ACTUAL ? `
        <span style="float:right; display:flex; gap:4px;">
          <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="uiEditarOtro('${dep}',${idx})">Editar</button>
          <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarOtro('${dep}',${idx})">✕</button>
        </span>` : '';
      if (b.tipoBloque === 'texto') {
        html += `<div class="item-insp">${btnAcciones}<strong>${esc(b.titulo)}</strong><p style="margin:6px 0 0;" class="texto-justificado">${esc(b.contenido)}</p></div>`;
      } else if (b.tipoBloque === 'tabla') {
        html += `<div class="item-insp">${btnAcciones}<strong>${esc(b.titulo)}</strong>${renderTablaGenerica(b.columnas, b.filas)}</div>`;
      }
    });
    html += `</details>`;
  });
  html += `</div>`;
  return html;
}

// ---------- Oficinas ----------
// Tabla genérica de filas (global: también la usa el importador de Excel
// para mostrar la vista previa antes de confirmar la importación).
// opts: { onEditar: idx => 'onclick...', anchos: ['12%','28%','60%'] }
function tablaConFilas(columnas, camposFila, filas, onEliminar, opts) {
  opts = opts || {};
  const mostrarAcciones = !SOLO_LECTURA_ACTUAL && typeof onEliminar === 'function';
  const colgroup = opts.anchos
    ? `<colgroup>${opts.anchos.map(a => `<col style="width:${a}">`).join('')}${mostrarAcciones ? '<col style="width:66px">' : ''}</colgroup>`
    : '';
  let html = `<table class="tabla-datos"${opts.anchos ? ' style="table-layout:fixed;"' : ''}>${colgroup}<thead><tr>${columnas.map(c => `<th>${esc(c)}</th>`).join('')}${mostrarAcciones ? '<th></th>' : ''}</tr></thead><tbody>`;
  filas.forEach((fila, idx) => {
    html += `<tr>${camposFila.map(campo => `<td>${esc(fila[campo] || '')}</td>`).join('')}`;
    if (mostrarAcciones) {
      html += `<td class="no-imprimir" style="white-space:nowrap;">`;
      if (opts.onEditar) html += `<button type="button" class="btn-secundario" style="padding:2px 7px;margin-right:4px;" onclick="${opts.onEditar(idx)}" title="Editar">✎</button>`;
      html += `<button type="button" class="btn-secundario" style="padding:2px 7px;" onclick="${onEliminar(idx)}" title="Eliminar">✕</button>`;
      html += `</td>`;
    }
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function renderOficinas() {
  // Documentación
  const doc = D.oficinas.documentacion;
  const botonesIngreso = (onclickManual) => !SOLO_LECTURA_ACTUAL
    ? `<button class="btn-secundario no-imprimir" type="button" style="margin:8px 0;" onclick="${onclickManual}">+ Ingreso manual</button>`
    : '';
  let bloqueDocumentacion = `
    <div class="tarjeta" id="bloqueDocumentacion">
      <h2>Documentación <button class="btn-secundario no-imprimir" type="button" onclick="imprimirBloqueOficina('bloqueDocumentacion')">Imprimir</button></h2>
      ${!SOLO_LECTURA_ACTUAL ? `<div class="no-imprimir" style="margin-bottom:6px;"><button class="btn-secundario" type="button" onclick="uiAbrirImportarExcelDocumentacion()">⇪ Importar Excel</button></div>` : ''}

      <h3 style="font-size:13px; color:var(--azul-marino); margin:14px 0 4px;">Trámites en Análisis — ${esc(fechaHoy())}</h3>
      ${botonesIngreso('uiAgregarTramiteAnalisis()')}
      ${doc.tramitesAnalisis.length
        ? tablaConFilas(['N.º', 'Vuelve', 'Ingreso PROGEBU', 'Usuario Sol.', 'Vto. CNSN/Prórroga', 'Trámite', 'Servicio', 'Nombre', 'Especialidades', 'Solicita', 'Observación'],
            ['numero', 'vuelve', 'ingresoProgebu', 'usuarioSolicitante', 'vtoCnsn', 'tramite', 'servicio', 'nombre', 'especialidades', 'solicita', 'observacion'],
            doc.tramitesAnalisis, idx => `eliminarFilaDocumentacion('tramitesAnalisis',${idx})`,
            { onEditar: idx => `uiEditarTramiteAnalisis(${idx})` })
        : '<div class="placeholder-panel">Sin trámites cargados.</div>'}

      <h3 style="font-size:13px; color:var(--azul-marino); margin:20px 0 4px;">Solicitudes Certificados de Arqueo</h3>
      ${botonesIngreso('uiAgregarCertificadoArqueo()')}
      ${doc.certificadosArqueo.length
        ? tablaConFilas(['N.º Ingreso', 'Usuario Sol.', 'Servicio', 'Nombre', 'Solicita'],
            ['numeroIngreso', 'usuarioSolicitante', 'servicio', 'nombre', 'solicita'],
            doc.certificadosArqueo, idx => `eliminarFilaDocumentacion('certificadosArqueo',${idx})`,
            { onEditar: idx => `uiEditarCertificadoArqueo(${idx})` })
        : '<div class="placeholder-panel">Sin solicitudes cargadas.</div>'}

      <h3 style="font-size:13px; color:var(--azul-marino); margin:20px 0 4px;">Girados a TNAV</h3>
      ${botonesIngreso('uiAgregarGiradoTNAV()')}
      ${doc.giradosTNAV.length
        ? tablaConFilas(['N.º', 'Fecha', 'Usuario', 'Servicio', 'Nombre y Matrícula', 'Solicita'],
            ['numero', 'fecha', 'usuario', 'servicio', 'nombreMatricula', 'solicita'],
            doc.giradosTNAV, idx => `eliminarFilaDocumentacion('giradosTNAV',${idx})`,
            { onEditar: idx => `uiEditarGiradoTNAV(${idx})` })
        : '<div class="placeholder-panel">Sin registros.</div>'}
    </div>`;

  const bloqueSimple = (clave, idBloque, titulo) => `
    <div class="tarjeta" id="${idBloque}">
      <h2>${esc(titulo)} <button class="btn-secundario no-imprimir" type="button" onclick="imprimirBloqueOficina('${idBloque}')">Imprimir</button></h2>
      ${!SOLO_LECTURA_ACTUAL ? `
        <div class="no-imprimir" style="display:flex; gap:8px; margin-bottom:12px;">
          <button class="btn-secundario" type="button" onclick="uiAgregarFilaSimple('${clave}','Ingreso manual — ${esc(titulo)}')">+ Ingreso manual</button>
          <button class="btn-secundario" type="button" onclick="uiAbrirImportarExcelSimple('${clave}','${esc(titulo)}')">⇪ Importar Excel</button>
        </div>` : ''}
      ${D.oficinas[clave].filas.length
        ? tablaConFilas(['Fecha', 'GDE', 'Detalle del trámite'], ['fecha', 'gde', 'expediente'], D.oficinas[clave].filas,
            idx => `eliminarFilaSimple('${clave}',${idx})`,
            { onEditar: idx => `uiEditarFilaSimple('${clave}',${idx},'Editar — ${esc(titulo)}')`, anchos: ['13%', '27%', '60%'] })
        : '<div class="placeholder-panel">Sin expedientes cargados.</div>'}
    </div>`;

  // Registro Nacional de Buques — tabla editable + referencias + gráfico de sectores
  const rnbu = D.oficinas.registroNacionalBuques.filas;
  const filasRNBU = [
    ['buscarBuque', 'Buscar Buque'],
    ['ingresarGde', 'Ingresar GDE/CUDAP'],
    ['verificar', 'Verificar Datos / Normalizar'],
    ['aprobarFolio', 'Aprobar Folio'],
    ['corregirDatosSib', 'Corregir Datos SIB'],
    ['darSalida', 'Dar Salida']
  ];
  const columnasRNBU = [['matr', 'MATR'], ['tran', 'TRAN'], ['vent', 'VENT'], ['medJud', 'MED. JUD.'], ['cbioMotor', 'CBIO MOTOR'], ['otros', 'OTROS']];
  const sumaFila = (f) => columnasRNBU.reduce((a, [k]) => a + (f[k] || 0), 0);
  const totalesColumna = {};
  columnasRNBU.forEach(([k]) => { totalesColumna[k] = filasRNBU.reduce((a, [fk]) => a + (rnbu[fk][k] || 0), 0); });
  const totalGeneral = columnasRNBU.reduce((a, [k]) => a + totalesColumna[k], 0);

  const coloresRNBU = { tran: '#1e2a78', otros: '#d03a35', cbioMotor: '#6b8be0', matr: '#1f5f6e', medJud: '#e8a23a', vent: '#8a3fa0' };
  const referencias = [['tran', 'TRAN'], ['otros', 'OTROS'], ['cbioMotor', 'CBIO MOTOR'], ['matr', 'MATR'], ['medJud', 'MED. JUD.'], ['vent', 'VENT']]
    .sort((a, b) => totalesColumna[b[0]] - totalesColumna[a[0]]);

  // Gráfico de sectores con conic-gradient (se arma solo con los totales)
  let acumulado = 0;
  const tramos = referencias.map(([k]) => {
    const pct = totalGeneral ? (totalesColumna[k] / totalGeneral) * 100 : 0;
    const desde = acumulado;
    acumulado += pct;
    return `${coloresRNBU[k]} ${desde}% ${acumulado}%`;
  });
  const fondoTorta = totalGeneral ? `conic-gradient(${tramos.join(', ')})` : 'var(--gris-300)';

  const celdaInput = (filaClave, col) => SOLO_LECTURA_ACTUAL
    ? `<td style="text-align:center;">${rnbu[filaClave][col]}</td>`
    : `<td style="text-align:center;"><input type="number" min="0" value="${rnbu[filaClave][col]}" style="width:64px; text-align:center; padding:4px; border:1px solid var(--gris-300); border-radius:4px;" onchange="actualizarCeldaRNBU('${filaClave}','${col}',this.value)"></td>`;

  const bloqueRNBU = `
    <div class="tarjeta" id="bloqueRNBU">
      <h2>Registro Nacional de Buques <button class="btn-secundario no-imprimir" type="button" onclick="imprimirBloqueOficina('bloqueRNBU')">Imprimir</button></h2>
      <table class="tabla-datos">
        <thead>
          <tr><th>Nro. Orden</th><th>Pantalla Actual</th>${columnasRNBU.map(([, et]) => `<th style="text-align:center;">${et}</th>`).join('')}<th style="text-align:center;">Trámites Vigentes</th></tr>
        </thead>
        <tbody>
          ${filasRNBU.map(([fk, etiqueta]) => `
            <tr>
              <td style="text-align:center;">${rnbu[fk].nroOrden}</td>
              <td><strong>${esc(etiqueta.toUpperCase())}</strong></td>
              ${columnasRNBU.map(([col]) => celdaInput(fk, col)).join('')}
              <td style="text-align:center; font-weight:700;">${sumaFila(rnbu[fk])}</td>
            </tr>`).join('')}
          <tr style="background:var(--gris-100); font-weight:700;">
            <td></td><td style="text-align:right;">Suma Total</td>
            ${columnasRNBU.map(([k]) => `<td style="text-align:center;">${totalesColumna[k]}</td>`).join('')}
            <td style="text-align:center;">${totalGeneral}</td>
          </tr>
        </tbody>
      </table>

      <div style="display:flex; gap:30px; flex-wrap:wrap; align-items:center; margin-top:20px;">
        <table class="tabla-datos" style="width:auto; min-width:200px;">
          <thead><tr><th>Tipo Trámite</th><th style="text-align:center;">Trámites Vigentes</th></tr></thead>
          <tbody>
            ${referencias.map(([k, et]) => `<tr><td><span style="display:inline-block; width:10px; height:10px; background:${coloresRNBU[k]}; border-radius:2px; margin-right:6px;"></span><strong>${et}</strong></td><td style="text-align:center;">${totalesColumna[k]}</td></tr>`).join('')}
            <tr style="background:var(--gris-100); font-weight:700;"><td>Suma Total</td><td style="text-align:center;">${totalGeneral}</td></tr>
          </tbody>
        </table>

        <div style="display:flex; align-items:center; gap:20px;">
          <div style="width:200px; height:200px; border-radius:50%; background:${fondoTorta}; border:1px solid var(--gris-300);" title="Trámites vigentes por tipo"></div>
          <div style="font-size:12px;">
            ${referencias.map(([k, et]) => {
              const pct = totalGeneral ? Math.round((totalesColumna[k] / totalGeneral) * 100) : 0;
              return `<div style="margin-bottom:4px;"><span style="display:inline-block; width:10px; height:10px; background:${coloresRNBU[k]}; border-radius:2px; margin-right:6px;"></span>${et}, ${pct}%</div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;

  const bloqueSinDefinir = (idBloque, titulo) => `
    <div class="tarjeta" id="${idBloque}">
      <h2>${esc(titulo)}</h2>
      <div class="placeholder-panel">Estructura pendiente de definir — avisen qué necesitan cargar acá y la armamos.</div>
    </div>`;

  return bloqueDocumentacion +
    bloqueSimple('controlGestion', 'bloqueControlGestion', 'Control de Gestión') +
    bloqueSimple('divisionNavegacion', 'bloqueDivisionNavegacion', 'División Navegación') +
    bloqueRNBU +
    bloqueSinDefinir('bloqueSinDefinir1', 'Sin Definir');
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
  // Esta pestaña es solo de consulta: los buques se cargan y editan desde el mapa del Inicio.
  html += `<table class="tabla-datos"><thead><tr>
    <th>N.º</th><th>Dependencia</th><th>Buque</th><th>Fecha</th><th>Tipo Insp.</th><th>Deficiencias</th>
  </tr></thead><tbody>`;
  D.buquesDetencion.forEach((b, idx) => {
    html += `<tr>
      <td>${esc(b.numero)}</td><td>${esc(b.dependencia)}</td><td>${esc(b.buque)}</td>
      <td>${esc(b.fecha)}</td><td>${esc(b.tipoInsp)}</td>
      <td>${(b.deficienciasLista || []).length ? `<ul style="margin:0 0 0 14px; padding:0;">${b.deficienciasLista.map(d => `<li>Cód. ${esc(d.codigo)} (${String(d.cantidad).padStart(2,'0')})</li>`).join('')}</ul>` : esc(b.deficiencias || '')}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  html += `<p style="font-size:11.5px; color:var(--gris-500); margin-top:10px;">Los buques con detención se cargan y se editan desde el mapa del Inicio ("+ Agregar nuevo" y "Editar" en el cuadro de cada buque); acá se listan automáticamente.</p>`;
  html += `</div>`;
  return html;
}

/** Disposición + vuelos (GFH), para Inspecciones Técnicas y Control de Gestión en el extranjero o por vía aérea. */
function htmlDatosExterior(i) {
  if (!i.extranjero && !i.viaAerea) return '';
  const s = i.salida || {}, r = i.regreso || {};
  const lineas = [];
  if (i.extranjero && i.disposicion) lineas.push(`Disposición N.º ${esc(i.disposicion)}`);
  if (s.fechaHora || s.vuelo || s.destino) lineas.push(`Salida: ${esc(s.fechaHora || '—')} · Vuelo ${esc(s.vuelo || '—')} · ${esc(s.destino || '')}`);
  if (r.fechaHora || r.vuelo || r.destino) lineas.push(`Retorno: ${esc(r.fechaHora || '—')} · Vuelo ${esc(r.vuelo || '—')} · ${esc(r.destino || '')}`);
  return lineas.length ? `<div style="font-size:11px; color:var(--gris-700); margin-top:4px;">${lineas.join('<br>')}</div>` : '';
}

function tagsViaje(i) {
  return `${i.extranjero ? '<span class="tag detallada" style="margin-left:6px;">Extranjero</span>' : ''}${i.viaAerea ? '<span class="tag inicial" style="margin-left:6px;">Vía aérea</span>' : ''}`;
}

function renderInspeccionesTecnicas() {
  let html = `<div class="tarjeta"><h2>Inspecciones Técnicas <span class="contador">${D.inspeccionesTecnicas.length}</span></h2>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;"><button class="btn-primario" type="button" onclick="uiAgregarInspeccionTecnica()">+ Agregar inspección prevista</button><button class="btn-secundario" type="button" title="Se guarda aparte y no figura en el parte hasta confirmarla" onclick="uiPrecargar('inspeccionesTecnicas')">+ Precargar</button></div>`;
  html += precargasHtml('inspeccionesTecnicas');
  html += `<table class="tabla-datos"><thead><tr>
    <th>Especialidad</th><th>Embarcación/Empresa</th><th>Requerimiento</th><th>Lugar</th><th>Inspector/MOI</th><th>Desde</th><th>Hasta</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}
  </tr></thead><tbody>`;
  D.inspeccionesTecnicas.forEach((i, idx) => {
    html += `<tr>
      <td>${esc(i.especialidad)}</td>
      <td>${esc(i.embarcacion)}</td>
      <td>${esc(i.requerimiento)}</td>
      <td>${esc(i.lugar)}</td>
      <td>
        ${esc(i.inspector)}
        ${tagsViaje(i)}
        ${htmlDatosExterior(i)}
      </td>
      <td>${esc(fechaISOaCorta(i.desde))}</td>
      <td>${esc(fechaISOaCorta(i.hasta))}</td>
      ${!SOLO_LECTURA_ACTUAL ? `<td style="display:flex; gap:4px;">
        <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="uiEditarInspeccionTecnica(${idx})">Editar</button>
        <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarInspeccionTecnica(${idx})">✕</button>
      </td>` : ''}
    </tr>`;
  });
  html += `</tbody></table>`;
  html += `</div>`;
  return html;
}

function renderDivisionControlGestion() {
  let html = `<div class="tarjeta"><h2>División Control de Gestión <span class="contador">${D.divisionControlGestion.length}</span></h2>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;"><button class="btn-primario" type="button" onclick="uiAgregarAuditoria()">+ Agregar auditoría</button><button class="btn-secundario" type="button" title="Se guarda aparte, solo para vos, y no figura en el parte hasta confirmarla" onclick="uiPrecargar('divisionControlGestion')">+ Precargar</button></div>`;
  html += precargasHtml('divisionControlGestion');
  html += `<table class="tabla-datos"><thead><tr>
    <th>Tipo de auditoría</th><th>Embarcación/Empresa</th><th>Alcance</th><th>Lugar</th><th>Auditor</th><th>Desde</th><th>Hasta</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}
  </tr></thead><tbody>`;
  D.divisionControlGestion.forEach((a, idx) => {
    html += `<tr>
      <td>${esc(a.tipoAuditoria)}</td><td>${esc(a.embarcacion)}</td><td>${esc(a.alcance)}</td><td>${esc(a.lugar)}</td><td>${esc(a.auditor)}${tagsViaje(a)}${htmlDatosExterior(a)}</td><td>${esc(fechaISOaCorta(a.desde))}</td><td>${esc(fechaISOaCorta(a.hasta))}</td>
      ${!SOLO_LECTURA_ACTUAL ? `<td style="display:flex; gap:4px;">
        <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="uiEditarAuditoria(${idx})">Editar</button>
        <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarAuditoria(${idx})">✕</button>
      </td>` : ''}
    </tr>`;
  });
  html += `</tbody></table>`;
  html += `</div>`;
  return html;
}

function textoPersonalCurso(personal) {
  if (!personal || !personal.length) return '—';
  return personal.map(p =>
    `<div class="fila-persona-curso">${esc(p.jerarquia ? `${p.jerarquia} ${p.nombre}`.trim() : p.nombre)}</div>`
  ).join('');
}

function tablaCursosHtml(lista, etiquetaColNombre) {
  if (!lista.length) return '<div class="placeholder-panel">Todavía no hay registros cargados.</div>';
  let html = `<table class="tabla-datos"><thead><tr>
    <th>Personal</th><th>${esc(etiquetaColNombre)}</th><th>Modalidad</th><th>Inicio</th><th>Fin</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}
  </tr></thead><tbody>`;
  lista.forEach(c => {
    const idx = D.cursos.indexOf(c);
    html += `<tr>
      <td class="col-personal-curso">${textoPersonalCurso(c.personal)}</td>
      <td>${esc(c.nombreCurso)}${c.descripcion ? `<div class="texto-justificado" style="font-size:11px; color:var(--gris-500);">${esc(c.descripcion)}</div>` : ''}</td>
      <td>${c.modalidad === 'presencial' ? 'Presencial' + (c.lugar ? ` — ${esc(c.lugar)}` : '') : 'Virtual'}</td>
      <td>${esc(c.fechaInicio)}</td><td>${esc(c.fechaFin)}</td>
      ${!SOLO_LECTURA_ACTUAL ? `<td style="display:flex; gap:4px;">
        <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="uiEditarCurso(${idx})">Editar</button>
        <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarCurso(${idx})">✕</button>
      </td>` : ''}
    </tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function renderCursos() {
  normalizarCursos();
  const cursos = D.cursos.filter(c => (c.tipo || 'curso') === 'curso');
  const comisiones = D.cursos.filter(c => c.tipo === 'comision');

  let html = `<div class="tarjeta"><h2>Cursos <span class="contador">${cursos.length}</span></h2>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" style="margin-bottom:12px;" onclick="uiAgregarCurso()">+ Agregar nuevo curso</button>`;
  html += tablaCursosHtml(cursos, 'Curso');
  html += `</div>`;

  html += `<div class="tarjeta"><h2>Comisiones <span class="contador">${comisiones.length}</span></h2>`;
  if (!SOLO_LECTURA_ACTUAL) html += `<button class="btn-primario" type="button" style="margin-bottom:12px;" onclick="uiAgregarComision()">+ Agregar nueva Comisión</button>`;
  html += tablaCursosHtml(comisiones, 'Comisión');
  html += `</div>`;

  return html;
}

function renderLicencias() {
  const categorias = todasLasCategoriasLicencia();
  let html = '';
  if (!SOLO_LECTURA_ACTUAL) html += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;"><button class="btn-primario" type="button" onclick="uiAgregarLicencia()">+ Agregar licencia</button><button class="btn-secundario" type="button" title="Se guarda aparte y no figura en el parte hasta confirmarla" onclick="uiPrecargar('licencias')">+ Precargar licencia</button></div>`;
  html += precargasHtml('licencias');
  // Solo se muestran las categorías que tienen personal cargado.
  const conDatos = categorias.filter(c => (D.licencias[c.clave] || []).length);
  if (!conDatos.length) html += '<div class="placeholder-panel">No hay licencias cargadas.</div>';
  conDatos.forEach(c => {
    const lista = D.licencias[c.clave] || [];
    const conDiagnostico = !!c.diagnostico;
    html += `<div class="tarjeta"><h2>${esc(c.etiqueta)} <span class="contador">${lista.length}</span></h2>`;
    html += `<table class="tabla-datos"><thead><tr><th>Jerarquía</th><th>Apellido y Nombre</th>${conDiagnostico ? '<th>Diagnóstico</th>' : ''}<th>Inicia</th><th>Vence</th>${!SOLO_LECTURA_ACTUAL ? '<th></th>' : ''}</tr></thead><tbody>`;
    // Siempre visibles ordenados por antigüedad: Personal Superior primero, después Subalterno;
    // lo no reconocido (texto libre viejo, typos) queda al final, alfabético.
    const indicesOrdenados = lista.map((l, idx) => idx).sort((ia, ib) => compararPorJerarquia(lista[ia].jerarquia, lista[ib].jerarquia));
    indicesOrdenados.forEach((idx) => {
      const l = lista[idx];
      html += `<tr>
        <td>${esc(l.jerarquia)}</td><td>${esc(l.nombre)}${l.oficina ? ` (${esc(l.oficina)})` : ''}</td>${conDiagnostico ? `<td>${esc(l.diagnostico || '')}</td>` : ''}<td>${esc(l.inicia)}</td><td>${esc(l.vence)}</td>
        ${!SOLO_LECTURA_ACTUAL ? `<td style="display:flex; gap:4px;">
          <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="uiEditarLicencia('${c.clave}',${idx})">Editar</button>
          <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarLicencia('${c.clave}',${idx})">✕</button>
        </td>` : ''}
      </tr>`;
    });
    html += `</tbody></table></div>`;
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

// ---------- Registro de pestañas ----------
const PESTANAS = [
  { id: 'inicio', grupo: 'Parte diario', etiqueta: 'Inicio', render: renderInicio },
  { id: 'insp-extraordinarias', grupo: 'Parte diario', etiqueta: 'Insp. Extraordinarias', render: renderExtraordinarias },
  { id: 'insp-psc', grupo: 'Parte diario', etiqueta: 'Estado Rector de Puerto', render: renderEstadoRectorPuerto },
  { id: 'casos-mas', grupo: 'Parte diario', etiqueta: 'Casos MAS', render: renderCasosMAS },
  { id: 'casos-sar', grupo: 'Parte diario', etiqueta: 'Casos SAR', render: renderCasosSAR },
  { id: 'otros', grupo: 'Parte diario', etiqueta: 'Otros', render: renderOtros },
  { id: 'oficinas', grupo: 'Parte diario', etiqueta: 'Oficinas', render: renderOficinas },
  { id: 'buques-detencion', grupo: 'Gestión', etiqueta: 'Buques con Detención', render: renderBuquesDetencion },
  { id: 'insp-tecnicas', grupo: 'Gestión', etiqueta: 'Inspecciones Técnicas', render: renderInspeccionesTecnicas },
  { id: 'control-gestion', grupo: 'Gestión', etiqueta: 'Div. Control de Gestión', render: renderDivisionControlGestion },
  { id: 'licencias', grupo: 'Gestión', etiqueta: 'Licencias', render: renderLicencias },
  { id: 'cursos', grupo: 'Gestión', etiqueta: 'Cursos / Comisiones', render: renderCursos }
];

// ============================================================
// BARRA SUPERIOR — menús desplegables (Links de interés / Usuario)
// y foto de perfil
// ============================================================
// La foto se guarda achicada (160x160) en dos lugares:
//  - localStorage de este navegador: para que se vea al instante,
//    sin esperar a Firestore, y como respaldo si por algún motivo
//    falla la escritura/lectura en la nube.
//  - Firestore (colección "fotosPerfil", documento = uid del usuario):
//    así la foto viaja con el usuario a cualquier computadora donde
//    entre. No usa Firebase Storage (no hace falta activarlo ni
//    configurarlo aparte) — al ser una imagen chica, entra sin
//    problema dentro de un documento de Firestore (límite 1 MiB).
// En modo demo no hay Firestore real, así que ahí solo se usa
// localStorage.

function claveFotoPerfil(usuario) {
  return `novedades_dpsn_foto_${usuario.dni}`;
}

function refFotoPerfil(usuario) {
  return db.collection('fotosPerfil').doc(usuario.uid);
}

async function cargarFotoPerfilDesdeFirestore(usuario) {
  if (DEMO_MODE || !usuario.uid) return;
  try {
    const doc = await refFotoPerfil(usuario).get();
    if (doc.exists && doc.data().foto) {
      try { localStorage.setItem(claveFotoPerfil(usuario), doc.data().foto); } catch (e) { /* localStorage no disponible */ }
      renderizarAvatar(usuario);
    }
  } catch (err) {
    console.log('No se pudo traer la foto de perfil guardada en la nube:', err);
  }
}

function inicialesUsuario(usuario) {
  const nombre = (usuario.nombre || '').trim();
  if (!nombre) return (usuario.dni || '—').slice(0, 2).toUpperCase();
  const porComa = nombre.split(',').map(s => s.trim()).filter(Boolean);
  if (porComa.length >= 2) return (porComa[0][0] + porComa[1][0]).toUpperCase();
  const palabras = nombre.split(/\s+/).filter(Boolean);
  if (palabras.length >= 2) return (palabras[0][0] + palabras[1][0]).toUpperCase();
  return nombre.slice(0, 2).toUpperCase();
}

function renderizarAvatar(usuario) {
  const iniciales = inicialesUsuario(usuario);
  let foto = null;
  try { foto = localStorage.getItem(claveFotoPerfil(usuario)); } catch (e) { /* localStorage no disponible */ }
  [document.getElementById('avatarChip'), document.getElementById('avatarGrande')].forEach(el => {
    if (!el) return;
    if (foto) {
      el.style.backgroundImage = `url(${foto})`;
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = iniciales;
    }
  });
}

function procesarFotoPerfil(usuario, archivo) {
  if (!archivo) return;
  if (!archivo.type.startsWith('image/')) { alert('Elegí un archivo de imagen (jpg, png...).'); return; }
  const lector = new FileReader();
  lector.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const tam = 160;
      const canvas = document.createElement('canvas');
      canvas.width = tam; canvas.height = tam;
      const ctx = canvas.getContext('2d');
      const lado = Math.min(img.width, img.height);
      const sx = (img.width - lado) / 2, sy = (img.height - lado) / 2;
      ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tam, tam);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      try {
        localStorage.setItem(claveFotoPerfil(usuario), dataUrl);
        renderizarAvatar(usuario);
      } catch (err) {
        alert('No se pudo guardar la foto en este navegador (puede que no haya espacio disponible).');
        return;
      }
      if (!DEMO_MODE && usuario.uid) {
        refFotoPerfil(usuario).set({ foto: dataUrl, actualizado: new Date().toISOString() })
          .then(() => UNDO.aviso('Foto de perfil actualizada.'))
          .catch(err => {
            console.log('No se pudo guardar la foto en la nube:', err);
            UNDO.aviso('La foto quedó guardada en esta computadora, pero no se pudo subir a la nube.', 3500);
          });
      }
    };
    img.onerror = () => alert('No se pudo leer esa imagen. Probá con otro archivo.');
    img.src = e.target.result;
  };
  lector.readAsDataURL(archivo);
}

function iniciarMenuUsuario(usuario) {
  renderizarAvatar(usuario);
  cargarFotoPerfilDesdeFirestore(usuario);
  document.getElementById('btnToggleUsuario').title =
    `${usuario.jerarquia ? usuario.jerarquia + ' ' : ''}${usuario.nombre || usuario.dni}`;

  document.getElementById('btnCambiarFoto').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('inputFotoPerfil').click();
  });
  document.getElementById('inputFotoPerfil').addEventListener('change', (e) => {
    const archivo = e.target.files && e.target.files[0];
    procesarFotoPerfil(usuario, archivo);
    e.target.value = '';
    document.getElementById('panelUsuario').classList.add('oculto');
  });
}

function iniciarMenusDesplegables() {
  const menus = [
    { boton: 'btnToggleLinks', panel: 'panelLinks' },
    { boton: 'btnToggleUsuario', panel: 'panelUsuario' }
  ];
  function cerrarTodos() {
    menus.forEach(m => {
      const panel = document.getElementById(m.panel);
      if (panel) panel.classList.add('oculto');
    });
  }
  menus.forEach(m => {
    const boton = document.getElementById(m.boton);
    const panel = document.getElementById(m.panel);
    if (!boton || !panel) return;
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      const estabaAbierto = !panel.classList.contains('oculto');
      cerrarTodos();
      if (!estabaAbierto) panel.classList.remove('oculto');
    });
    panel.addEventListener('click', (e) => {
      e.stopPropagation();
      // Clickear una opción del menú (que no sea el botón de cambiar foto,
      // que tiene su propia lógica) cierra el desplegable.
      if (e.target.closest('.item-despl')) cerrarTodos();
    });
  });
  document.addEventListener('click', cerrarTodos);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarTodos(); });
}

async function iniciarDashboard() {
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

  document.getElementById('btnExportarGlobal').onclick = () => abrirModalExportarGuardia();
  document.getElementById('btnVistaPreviaExportar').onclick = () => abrirModalExportarGuardia({ vistaPrevia: true });
  if (typeof GUARDADO_EN_DRIVE_ACTIVO !== 'undefined' && GUARDADO_EN_DRIVE_ACTIVO) {
    document.getElementById('btnPDFsArchivados').classList.remove('oculto');
  }
  if (!DEMO_MODE && usuario.administradorGlobal) {
    document.getElementById('btnAuditoria').classList.remove('oculto');
  }
  if (!DEMO_MODE) {
    document.getElementById('btnCambiarClave').classList.remove('oculto');
  }

  iniciarMenuUsuario(usuario);
  iniciarMenusDesplegables();

  // Armar la barra de pestañas superior
  const nav = document.getElementById('tabsNav');
  nav.innerHTML = PESTANAS.map(t =>
    `<button class="tab-link" data-id="${t.id}">${esc(t.etiqueta)}</button>`
  ).join('');
  nav.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => mostrarPestana(btn.dataset.id));
  });

  document.getElementById('contenidoPanel').innerHTML = '<div class="placeholder-panel">Cargando datos…</div>';
  await hidratarDatosGuardia();

  UNDO.iniciar();
  iniciarPuntosRestauracion();
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
