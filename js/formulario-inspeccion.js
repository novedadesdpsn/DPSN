// ============================================================
// FORMULARIO ESTÁNDAR DE INSPECCIÓN — Novedades DPSN
// ============================================================
// Mismo formulario para Inspecciones Extraordinarias y Estado
// Rector de Puerto: 3 estados (Inicial / Más Detallada / Seguimiento),
// y una carga de deficiencias estandarizada por grupos: acción
// ("Se detectó" o "Se recodificó"), cantidad y código — con la
// descripción oficial de cada código tomada de codigos.js.
// ============================================================

function cerrarModalInspeccion(id) {
  const m = document.getElementById(id || 'modalInspeccion');
  if (m) m.remove();
}

function opcionesCodigoHtml(lista) {
  return (lista || CODIGOS_MEDIDAS).map(c => `<option value="${c.codigo}">${c.codigo} — ${esc(c.descripcion)}</option>`).join('');
}

function opcionesCantidadHtml() {
  let out = '';
  for (let i = 1; i <= 30; i++) out += `<option value="${i}">${i}</option>`;
  return out;
}

function textoGrupoDeficiencia(g, lista) {
  const cant = g.cantidad || 1;
  if (g.accion === 'recodifico') {
    return `Se recodificó ${cant} deficiencia(s) Cód. ${g.codigoAnterior} (${descripcionEnLista(g.codigoAnterior, lista)}) a Cód. ${g.codigoNuevo} (${descripcionEnLista(g.codigoNuevo, lista)})`;
  }
  if (g.codigo2) {
    return `Se detectó ${cant} deficiencia(s) Cód. ${g.codigo}/${g.codigo2} (${descripcionEnLista(g.codigo, lista)} - ${descripcionEnLista(g.codigo2, lista)})`;
  }
  return `Se detectó ${cant} deficiencia(s) Cód. ${g.codigo} (${descripcionEnLista(g.codigo, lista)})`;
}

function lineasDescripcionGrupo(g) {
  // Compatibilidad: los grupos cargados antes de este cambio guardaban
  // todo junto en "descripcionAdicional".
  const texto = g.descripcionDeficiencia !== undefined ? g.descripcionDeficiencia : (g.descripcionAdicional || '');
  return texto.split('\n').map(l => l.trim()).filter(Boolean);
}

function textoComoSeSubsano(g) {
  return (g.comoSeSubsano || '').trim();
}

/**
 * Empareja cada deficiencia con su subsanación (1.ª con 1.ª, 2.ª con 2.ª...).
 * Se emparejan cuando hay una subsanación por línea (o una sola deficiencia con una sola subsanación);
 * si no, la subsanación queda "suelta" (extra) como antes.
 */
function paresDeficiencia(g) {
  const descs = lineasDescripcionGrupo(g);
  const subs = textoComoSeSubsano(g).split('\n').map(l => l.trim()).filter(Boolean);
  const emparejar = descs.length > 0 && (subs.length > 1 || (subs.length === 1 && descs.length === 1));
  if (!emparejar) return { items: descs.map(t => ({ texto: t, subsano: '' })), extra: subs };
  const n = Math.max(descs.length, subs.length);
  const items = [];
  for (let i = 0; i < n; i++) items.push({ texto: descs[i] || '', subsano: subs[i] || '' });
  return { items, extra: [] };
}

function subsanoEntreParentesis(t) {
  const x = String(t || '').trim();
  if (!x) return '';
  return x.startsWith('(') ? x : `(${x})`;
}

function codigosDeGrupo(g) {
  if (g.accion === 'recodifico') return [g.codigoAnterior, g.codigoNuevo];
  return g.codigo2 ? [g.codigo, g.codigo2] : [g.codigo];
}

/**
 * opciones = {
 *   titulo,
 *   etiquetasTipo: { inicial, detallada, seguimiento },
 *   incluirCategoria: true|false,   (solo Extraordinarias lo usa)
 *   valores: { dependencia, tipo, categoria, buque:{tipo,nombre,matricula,bandera},
 *              fechaInspMasDetallada, asunto, nota, deficiencias:[...] },
 *   onGuardar(datos)
 * }
 */
function abrirFormularioInspeccionEstandar(opciones) {
  const idModal = opciones.idModal || 'modalInspeccion';
  const esBarcaza = !!opciones.esBarcaza;
  cerrarModalInspeccion(idModal);
  const v = opciones.valores || {};
  let barcazas = (v.barcazas || []).slice();
  const $ = (id) => modal.querySelector('#' + id);
  const buque = v.buque || {};
  const listaCodigos = opciones.listaCodigos || CODIGOS_MEDIDAS;
  let grupos = (v.deficiencias || []).slice();

  const categoriasHtml = (opciones.incluirCategoria && !esBarcaza) ? `
    <div class="campo">
      <label>Tipo de buque (categoría para el resumen)</label>
      <select id="insCategoria">
        <option value="pesquerosOtros" ${v.categoria === 'pesquerosOtros' ? 'selected' : ''}>Pesqueros/Otros</option>
        <option value="cargaPasaje" ${v.categoria === 'cargaPasaje' ? 'selected' : ''}>Buque de Carga/Pasaje</option>
        <option value="convoyesExtr" ${v.categoria === 'convoyesExtr' ? 'selected' : ''}>Convoyes/Buques Extr.</option>
        <option value="convoyArgentino" ${v.categoria === 'convoyArgentino' ? 'selected' : ''}>Convoy B/ARG</option>
      </select>
      <p style="font-size:11.5px; color:var(--gris-500); margin-top:4px;">Si el tipo de inspección (arriba) es "Por avería", el cuadro resumen la cuenta como "Por avería" sin importar lo que elijas aquí — esto queda para saber qué clase de buque es (y, si es convoy, poder cargarle características/barcazas).</p>
    </div>` : '';

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = idModal;
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header">
        <h3>${esc(opciones.titulo)}</h3>
        <button type="button" onclick="cerrarModalInspeccion('${idModal}')">✕</button>
      </div>
      <div class="modal-campos">
        <div class="campo ${esBarcaza ? 'oculto' : ''}">
          <label>Dependencia (sigla)</label>
          <input type="text" id="insDependencia" value="${esc(v.dependencia || '')}">
        </div>
        <div class="campo">
          <label>Tipo de inspección</label>
          <select id="insTipo">
            <option value="inicial" ${v.tipo === 'inicial' ? 'selected' : ''}>${esc(opciones.etiquetasTipo.inicial)}</option>
            <option value="detallada" ${v.tipo === 'detallada' ? 'selected' : ''}>${esc(opciones.etiquetasTipo.detallada)}</option>
            ${opciones.etiquetasTipo.averia ? `<option value="averia" ${v.tipo === 'averia' ? 'selected' : ''}>${esc(opciones.etiquetasTipo.averia)}</option>` : ''}
            <option value="seguimiento" ${v.tipo === 'seguimiento' ? 'selected' : ''}>${esc(opciones.etiquetasTipo.seguimiento)}</option>
          </select>
        </div>
        ${categoriasHtml}
        ${opciones.incluirCIC && !esBarcaza ? `
        <div class="campo">
          <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:600;">
            <input type="checkbox" id="insCIC" ${v.cic ? 'checked' : ''} style="width:16px;height:16px;">
            ¿Se hizo CIC? (Campaña de Inspecciones Concentradas)
          </label>
        </div>` : ''}
        <div class="fila-doble">
          <div class="campo"><label>Tipo de buque</label><input type="text" id="insBuqueTipo" value="${esc(buque.tipo || '')}" placeholder="L/M, B/P, B/M, B/T..."></div>
          <div class="campo"><label>Nombre del buque</label><input type="text" id="insBuqueNombre" value="${esc(buque.nombre || '')}"></div>
        </div>
        <div class="fila-doble">
          <div class="campo"><label>N.º IMO / Matrícula</label><input type="text" id="insMatricula" value="${esc(buque.matricula || '')}"></div>
          <div class="campo"><label>Bandera</label><input type="text" id="insBandera" value="${esc(buque.bandera || '')}"></div>
        </div>

        <div class="campo oculto" id="bloqueConvoy">
          <label>Características del remolcador / convoy (una por línea)</label>
          <textarea id="insConvoy" rows="6" placeholder="Convoy: Veinte (20) Bzas. con 26.205 tn harina de soja.&#10;Eslora total del convoy: 285,6 m. (remolcador y barcazas)&#10;Manga del convoy: 53,4 m.&#10;Potencia del Remolcador: 4.600 HP.&#10;Compañía: ...&#10;Procedente: ...&#10;Destino: ...">${esc(v.caracteristicasConvoy || '')}</textarea>
        </div>

        <div class="campo oculto" id="bloqueFechaID">
          <label>Fecha de la Inspección Más Detallada (ID) a la que remite</label>
          <input type="text" id="insFechaID" value="${esc(v.fechaInspMasDetallada || '')}" placeholder="dd/mm/aaaa">
        </div>

        <div class="campo oculto" id="bloqueDeficiencias">
          <label>Deficiencias cargadas</label>
          <div id="listaGruposDeficiencia" style="margin-bottom:10px;"></div>
          <div style="background:var(--gris-100); border-radius:var(--radio); padding:12px;">
            <div class="fila-doble">
              <div class="campo" style="margin-bottom:8px;">
                <label>Acción</label>
                <select id="defAccion">
                  <option value="detecto">Se detectó</option>
                  <option value="recodifico">Se recodificó</option>
                </select>
              </div>
              <div class="campo" style="margin-bottom:8px;">
                <label>Cantidad</label>
                <select id="defCantidad">${opcionesCantidadHtml()}</select>
              </div>
            </div>
            <div id="defCodigoUnico" class="campo" style="margin-bottom:8px;">
              <label>Código</label>
              <select id="defCodigo">${opcionesCodigoHtml(listaCodigos)}</select>
            </div>
            <div id="defCodigoUnico2" class="campo" style="margin-bottom:8px;">
              <label>Código adicional (opcional — para combinaciones tipo 17/99)</label>
              <select id="defCodigo2">
                <option value="">— Ninguno —</option>
                ${opcionesCodigoHtml(listaCodigos)}
              </select>
            </div>
            <div id="defCodigoDoble" class="fila-doble oculto">
              <div class="campo" style="margin-bottom:8px;"><label>Código anterior</label><select id="defCodigoAnterior">${opcionesCodigoHtml(listaCodigos)}</select></div>
              <div class="campo" style="margin-bottom:8px;"><label>Código nuevo</label><select id="defCodigoNuevo">${opcionesCodigoHtml(listaCodigos)}</select></div>
            </div>
            <div class="campo" style="margin-bottom:8px;">
              <label>Descripción de la(s) deficiencia(s)</label>
              <textarea id="defDescripcion" placeholder="Si hay varias del mismo código, escribí una por línea (Enter). Ej: qué se detectó."></textarea>
            </div>
            <div class="campo" style="margin-bottom:8px;">
              <label>Cómo se subsanó (opcional) — una por línea, en el mismo orden que las deficiencias: la 1.ª línea corresponde a la 1.ª deficiencia, la 2.ª a la 2.ª, y así</label>
              <textarea id="defComoSubsano" placeholder="Ej: Se verificó el correcto funcionamiento del generador N.º 1."></textarea>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button type="button" class="btn-secundario" id="btnAgregarGrupoDef">+ Agregar deficiencia</button>
              <button type="button" class="btn-secundario oculto" id="btnCancelarEdicionDef" style="color:var(--gris-500);">Cancelar edición</button>
            </div>
          </div>
        </div>

        <div class="campo ${esBarcaza ? 'oculto' : ''}">
          <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:600;">
            <input type="checkbox" id="insEsCasoMAS" ${v.asunto ? 'checked' : ''} style="width:16px;height:16px;">
            ¿Corresponde a un Caso MAS/SAR?
          </label>
        </div>
        <div class="campo ${v.asunto ? '' : 'oculto'}" id="bloqueAsuntoMAS">
          <label>Referencia al Caso MAS/SAR</label>
          <input type="text" id="insAsunto" value="${esc(v.asunto || '')}" placeholder="Ej: CASO MAS PZDE N.º 22/26 - Inconveniente en máquina">
        </div>

        <div class="campo ${esBarcaza ? 'oculto' : ''}">
          <label>Próximo puerto (opcional)</label>
          <input type="text" id="insProximoPuerto" value="${esc(v.proximoPuerto || '')}" placeholder="Ej: Rosario">
        </div>

        <div class="campo">
          <label>Nota</label>
          <textarea id="insNota">${esc(v.nota || '')}</textarea>
        </div>

        <div class="campo ${esBarcaza ? 'oculto' : ''}" id="bloqueTieneBarcazas">
          <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:600;">
            <input type="checkbox" id="insTieneBarcazas" ${barcazas.length ? 'checked' : ''} style="width:16px;height:16px;">
            ¿Lleva barcazas para cargar?
          </label>
        </div>
        <div class="campo oculto" id="bloqueBarcazas">
          <label>Barcazas</label>
          <div id="listaBarcazas" style="margin-bottom:8px;"></div>
          <button type="button" class="btn-secundario" id="btnAgregarBarcaza">+ Agregar barcaza</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalInspeccion('${idModal}')">Cancelar</button>
        <button class="btn-primario" type="button" id="btnGuardarInspeccion">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function renderizarChipsDeficiencias() {
    const cont = $('listaGruposDeficiencia');
    if (!grupos.length) {
      cont.innerHTML = '<div style="font-size:12px; color:var(--gris-500);">Todavía no agregaste ninguna.</div>';
      return;
    }
    cont.innerHTML = grupos.map((g, i) => {
      const { items, extra } = paresDeficiencia(g);
      return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; background:${i === editandoIdx ? '#fff8e6' : '#fff'}; border:1px solid ${i === editandoIdx ? '#d9a21b' : 'var(--gris-300)'}; border-radius:6px; padding:6px 10px; margin-bottom:6px; font-size:12px;">
        <div>
          <div>${esc(textoGrupoDeficiencia(g, listaCodigos))}</div>
          ${items.length ? `<ol style="margin:3px 0 0 20px; padding:0; list-style:decimal;">${items.map(it => `<li>${esc(it.texto)}${it.subsano ? ` <strong>${esc(subsanoEntreParentesis(it.subsano))}</strong>` : ''}</li>`).join('')}</ol>` : ''}
          ${extra.length ? `<div style="margin-top:3px; font-weight:600;">${extra.map(esc).join('<br>')}</div>` : ''}
        </div>
        <div style="display:flex; gap:6px; flex-shrink:0;">
          <button type="button" data-idx="${i}" class="btnEditarGrupo" style="background:none;border:none;color:var(--azul-medio,#2f6fb3);font-size:14px;" title="Editar">✎</button>
          <button type="button" data-idx="${i}" class="btnQuitarGrupo" style="background:none;border:none;color:var(--rojo);font-size:14px;" title="Eliminar">✕</button>
        </div>
      </div>
    `;
    }).join('');
    cont.querySelectorAll('.btnQuitarGrupo').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        grupos.splice(idx, 1);
        if (editandoIdx === idx) cancelarEdicionGrupo();
        else if (editandoIdx !== null && editandoIdx > idx) editandoIdx--;
        renderizarChipsDeficiencias();
      });
    });
    cont.querySelectorAll('.btnEditarGrupo').forEach(btn => {
      btn.addEventListener('click', () => editarGrupo(parseInt(btn.dataset.idx, 10)));
    });
  }

  // ---- Editar una deficiencia ya cargada: la carga en el cuadro de abajo en vez de borrar y recargar todo ----
  let editandoIdx = null;

  function editarGrupo(idx) {
    const g = grupos[idx];
    if (!g) return;
    editandoIdx = idx;
    $('defAccion').value = g.accion || 'detecto';
    $('defAccion').dispatchEvent(new Event('change'));
    $('defCantidad').value = String(g.cantidad || 1);
    if (g.accion === 'recodifico') {
      $('defCodigoAnterior').value = g.codigoAnterior || '';
      $('defCodigoNuevo').value = g.codigoNuevo || '';
    } else {
      $('defCodigo').value = g.codigo || '';
      $('defCodigo2').value = g.codigo2 || '';
    }
    $('defDescripcion').value = g.descripcionDeficiencia !== undefined ? g.descripcionDeficiencia : (g.descripcionAdicional || '');
    $('defComoSubsano').value = g.comoSeSubsano || '';
    $('btnAgregarGrupoDef').textContent = 'Guardar cambios en la deficiencia';
    $('btnCancelarEdicionDef').classList.remove('oculto');
    $('defDescripcion').scrollIntoView({ behavior: 'smooth', block: 'center' });
    renderizarChipsDeficiencias();
  }

  function cancelarEdicionGrupo() {
    editandoIdx = null;
    $('defAccion').value = 'detecto';
    $('defAccion').dispatchEvent(new Event('change'));
    $('defCantidad').value = '1';
    $('defDescripcion').value = '';
    $('defComoSubsano').value = '';
    $('btnAgregarGrupoDef').textContent = '+ Agregar deficiencia';
    $('btnCancelarEdicionDef').classList.add('oculto');
  }

  function actualizarVisibilidadPorTipo() {
    const tipo = $('insTipo').value;
    $('bloqueDeficiencias').classList.toggle('oculto', tipo === 'inicial');
    $('bloqueFechaID').classList.toggle('oculto', tipo !== 'seguimiento');
  }
  // El tipo de buque (categoría) no se toca al cambiar el tipo de inspección: "Por avería" para el
  // cuadro resumen se decide solo por el tipo de inspección (ver calcularResumenCategorias en app.js),
  // así se puede dejar cargado que es, por ejemplo, un convoy, aunque la inspección sea por avería.
  $('insTipo').addEventListener('change', actualizarVisibilidadPorTipo);
  actualizarVisibilidadPorTipo();

  $('defAccion').addEventListener('change', (e) => {
    const esRecodifico = e.target.value === 'recodifico';
    $('defCodigoUnico').classList.toggle('oculto', esRecodifico);
    $('defCodigoUnico2').classList.toggle('oculto', esRecodifico);
    $('defCodigoDoble').classList.toggle('oculto', !esRecodifico);
  });

  $('insEsCasoMAS').addEventListener('change', (e) => {
    $('bloqueAsuntoMAS').classList.toggle('oculto', !e.target.checked);
  });

  $('btnAgregarGrupoDef').addEventListener('click', () => {
    const accion = $('defAccion').value;
    const cantidad = parseInt($('defCantidad').value, 10);
    const descripcionDeficiencia = $('defDescripcion').value.trim();
    const comoSeSubsano = $('defComoSubsano').value.trim();
    let grupo;
    if (accion === 'recodifico') {
      grupo = {
        accion, cantidad, descripcionDeficiencia, comoSeSubsano,
        codigoAnterior: $('defCodigoAnterior').value,
        codigoNuevo: $('defCodigoNuevo').value
      };
    } else {
      const codigo2 = $('defCodigo2').value;
      grupo = { accion, cantidad, descripcionDeficiencia, comoSeSubsano, codigo: $('defCodigo').value, codigo2: codigo2 || null };
    }
    if (editandoIdx !== null) { grupos[editandoIdx] = grupo; } else { grupos.push(grupo); }
    cancelarEdicionGrupo();
    renderizarChipsDeficiencias();
  });

  $('btnCancelarEdicionDef').addEventListener('click', () => {
    cancelarEdicionGrupo();
    renderizarChipsDeficiencias();
  });

  renderizarChipsDeficiencias();

  // ---- Convoy (descripción del remolcador: solo Convoyes/Buques Extr. y Convoy B/ARG) ----
  // Las barcazas, en cambio, se pueden cargar en cualquier inspección (inicial, detallada, por avería,
  // de seguimiento, etc.) sin depender de la categoría — así "por avería" sigue contando como avería
  // en el cuadro resumen, y no hace falta pasarla a "convoy" solo para poder cargar las barcazas.
  const esCategoriaConvoy = () => !esBarcaza && opciones.incluirCategoria && ['convoyesExtr', 'convoyArgentino'].includes($('insCategoria').value);
  function actualizarBloquesConvoy() {
    $('bloqueConvoy').classList.toggle('oculto', !esCategoriaConvoy());
    $('bloqueBarcazas').classList.toggle('oculto', !(!esBarcaza && $('insTieneBarcazas').checked));
  }
  $('insTieneBarcazas').addEventListener('change', actualizarBloquesConvoy);
  function renderizarBarcazas() {
    const cont = $('listaBarcazas');
    if (!barcazas.length) { cont.innerHTML = '<div style="font-size:12px; color:var(--gris-500);">Todavía no agregaste barcazas.</div>'; return; }
    cont.innerHTML = barcazas.map((b, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; background:#fff; border:1px solid var(--gris-300); border-radius:6px; padding:6px 10px; margin-bottom:6px; font-size:12px;">
        <span>"${esc(b.buque.nombre)}" (${esc(b.buque.matricula)}) B/${esc(b.buque.bandera)} — ${(b.deficiencias || []).length} def.</span>
        <span style="flex-shrink:0;">
          <button type="button" data-idx="${i}" class="btnEditBarcaza btn-secundario" style="padding:2px 8px;">Editar</button>
          <button type="button" data-idx="${i}" class="btnQuitarBarcaza" style="background:none;border:none;color:var(--rojo);font-size:14px;">✕</button>
        </span>
      </div>`).join('');
    cont.querySelectorAll('.btnQuitarBarcaza').forEach(btn => btn.addEventListener('click', () => { barcazas.splice(parseInt(btn.dataset.idx, 10), 1); renderizarBarcazas(); }));
    cont.querySelectorAll('.btnEditBarcaza').forEach(btn => btn.addEventListener('click', () => abrirBarcaza(parseInt(btn.dataset.idx, 10))));
  }
  function abrirBarcaza(idx) {
    abrirFormularioInspeccionEstandar({
      idModal: 'modalBarcaza',
      esBarcaza: true,
      titulo: idx === undefined ? 'Agregar barcaza' : 'Editar barcaza',
      etiquetasTipo: opciones.etiquetasTipo,
      listaCodigos,
      valores: idx === undefined ? {} : barcazas[idx],
      onGuardar: (datos) => {
        if (idx === undefined) barcazas.push(datos); else barcazas[idx] = datos;
        renderizarBarcazas();
      }
    });
  }
  if (opciones.incluirCategoria && !esBarcaza) $('insCategoria').addEventListener('change', actualizarBloquesConvoy);
  $('btnAgregarBarcaza').addEventListener('click', () => abrirBarcaza());
  actualizarBloquesConvoy();
  renderizarBarcazas();

  $('btnGuardarInspeccion').addEventListener('click', () => {
    const tipo = $('insTipo').value;
    const datos = {
      dependencia: esBarcaza ? '' : ($('insDependencia').value.trim() || 'SIN_DEP'),
      tipo,
      buque: {
        tipo: $('insBuqueTipo').value.trim(),
        nombre: $('insBuqueNombre').value.trim(),
        matricula: $('insMatricula').value.trim(),
        bandera: $('insBandera').value.trim()
      },
      deficiencias: tipo === 'inicial' ? [] : grupos,
      fechaInspMasDetallada: tipo === 'seguimiento' ? $('insFechaID').value.trim() : '',
      proximoPuerto: esBarcaza ? '' : $('insProximoPuerto').value.trim(),
      asunto: $('insEsCasoMAS').checked ? $('insAsunto').value.trim() : '',
      nota: $('insNota').value.trim()
    };
    if (opciones.incluirCategoria && !esBarcaza) datos.categoria = $('insCategoria').value;
    if (opciones.incluirCIC && !esBarcaza) datos.cic = $('insCIC').checked;
    if (esCategoriaConvoy()) datos.caracteristicasConvoy = $('insConvoy').value.trim();
    if (!esBarcaza) datos.barcazas = $('insTieneBarcazas').checked ? barcazas : [];
    cerrarModalInspeccion(idModal);
    opciones.onGuardar(datos);
  });
}
