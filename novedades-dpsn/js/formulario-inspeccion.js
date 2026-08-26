// ============================================================
// FORMULARIO ESTÁNDAR DE INSPECCIÓN — Novedades DPSN
// ============================================================
// Mismo formulario para Inspecciones Extraordinarias y Estado
// Rector de Puerto: 3 estados (Inicial / Más Detallada / Seguimiento),
// y una carga de deficiencias estandarizada por grupos: acción
// ("Se detectó" o "Se recodificó"), cantidad y código — con la
// descripción oficial de cada código tomada de codigos.js.
// ============================================================

function cerrarModalInspeccion() {
  const m = document.getElementById('modalInspeccion');
  if (m) m.remove();
}

function opcionesCodigoHtml() {
  return CODIGOS_MEDIDAS.map(c => `<option value="${c.codigo}">${c.codigo} — ${esc(c.descripcion)}</option>`).join('');
}

function opcionesCantidadHtml() {
  let out = '';
  for (let i = 1; i <= 20; i++) out += `<option value="${i}">${i}</option>`;
  return out;
}

function textoGrupoDeficiencia(g) {
  const cant = g.cantidad || 1;
  if (g.accion === 'recodifico') {
    return `Se recodificó ${cant} deficiencia(s) Cód. ${g.codigoAnterior} (${descripcionCodigo(g.codigoAnterior)}) a Cód. ${g.codigoNuevo} (${descripcionCodigo(g.codigoNuevo)})`;
  }
  return `Se detectó ${cant} deficiencia(s) Cód. ${g.codigo} (${descripcionCodigo(g.codigo)})`;
}

function lineasDescripcionGrupo(g) {
  return (g.descripcionAdicional || '').split('\n').map(l => l.trim()).filter(Boolean);
}

function codigosDeGrupo(g) {
  return g.accion === 'recodifico' ? [g.codigoAnterior, g.codigoNuevo] : [g.codigo];
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
  cerrarModalInspeccion();
  const v = opciones.valores || {};
  const buque = v.buque || {};
  let grupos = (v.deficiencias || []).slice();

  const categoriasHtml = opciones.incluirCategoria ? `
    <div class="campo">
      <label>Categoría (para el resumen)</label>
      <select id="insCategoria">
        <option value="pesquerosOtros" ${v.categoria === 'pesquerosOtros' ? 'selected' : ''}>Pesqueros/Otros</option>
        <option value="porAveria" ${v.categoria === 'porAveria' ? 'selected' : ''}>Por avería</option>
        <option value="cargaPasaje" ${v.categoria === 'cargaPasaje' ? 'selected' : ''}>Buque de Carga/Pasaje</option>
        <option value="convoyesExtr" ${v.categoria === 'convoyesExtr' ? 'selected' : ''}>Convoyes/Buques Extr.</option>
        <option value="convoyArgentino" ${v.categoria === 'convoyArgentino' ? 'selected' : ''}>Convoy B/ARG</option>
      </select>
    </div>` : '';

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalInspeccion';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header">
        <h3>${esc(opciones.titulo)}</h3>
        <button type="button" onclick="cerrarModalInspeccion()">✕</button>
      </div>
      <div class="modal-campos">
        <div class="campo">
          <label>Dependencia (sigla)</label>
          <input type="text" id="insDependencia" value="${esc(v.dependencia || '')}">
        </div>
        <div class="campo">
          <label>Tipo de inspección</label>
          <select id="insTipo">
            <option value="inicial" ${v.tipo === 'inicial' ? 'selected' : ''}>${esc(opciones.etiquetasTipo.inicial)}</option>
            <option value="detallada" ${v.tipo === 'detallada' ? 'selected' : ''}>${esc(opciones.etiquetasTipo.detallada)}</option>
            <option value="seguimiento" ${v.tipo === 'seguimiento' ? 'selected' : ''}>${esc(opciones.etiquetasTipo.seguimiento)}</option>
          </select>
        </div>
        ${categoriasHtml}
        <div class="fila-doble">
          <div class="campo"><label>Tipo de buque</label><input type="text" id="insBuqueTipo" value="${esc(buque.tipo || '')}" placeholder="L/M, B/P, B/M, B/T..."></div>
          <div class="campo"><label>Nombre del buque</label><input type="text" id="insBuqueNombre" value="${esc(buque.nombre || '')}"></div>
        </div>
        <div class="fila-doble">
          <div class="campo"><label>N.º IMO / Matrícula</label><input type="text" id="insMatricula" value="${esc(buque.matricula || '')}"></div>
          <div class="campo"><label>Bandera</label><input type="text" id="insBandera" value="${esc(buque.bandera || '')}"></div>
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
              <select id="defCodigo">${opcionesCodigoHtml()}</select>
            </div>
            <div id="defCodigoDoble" class="fila-doble oculto">
              <div class="campo" style="margin-bottom:8px;"><label>Código anterior</label><select id="defCodigoAnterior">${opcionesCodigoHtml()}</select></div>
              <div class="campo" style="margin-bottom:8px;"><label>Código nuevo</label><select id="defCodigoNuevo">${opcionesCodigoHtml()}</select></div>
            </div>
            <div class="campo" style="margin-bottom:8px;">
              <label>Descripción / aclaración</label>
              <textarea id="defDescripcion" placeholder="Si hay varias deficiencias de este mismo código, escribí una por línea (Enter). Ej: qué se detectó y cómo se subsanó."></textarea>
            </div>
            <button type="button" class="btn-secundario" id="btnAgregarGrupoDef">+ Agregar deficiencia</button>
          </div>
        </div>

        <div class="campo">
          <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:600;">
            <input type="checkbox" id="insEsCasoMAS" ${v.asunto ? 'checked' : ''} style="width:16px;height:16px;">
            ¿Corresponde a un Caso MAS?
          </label>
        </div>
        <div class="campo ${v.asunto ? '' : 'oculto'}" id="bloqueAsuntoMAS">
          <label>Referencia al Caso MAS</label>
          <input type="text" id="insAsunto" value="${esc(v.asunto || '')}" placeholder="Ej: CASO MAS PZDE N.º 22/26 - Inconveniente en máquina">
        </div>

        <div class="campo">
          <label>Nota</label>
          <textarea id="insNota">${esc(v.nota || '')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalInspeccion()">Cancelar</button>
        <button class="btn-primario" type="button" id="btnGuardarInspeccion">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function renderizarChipsDeficiencias() {
    const cont = document.getElementById('listaGruposDeficiencia');
    if (!grupos.length) {
      cont.innerHTML = '<div style="font-size:12px; color:var(--gris-500);">Todavía no agregaste ninguna.</div>';
      return;
    }
    cont.innerHTML = grupos.map((g, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; background:#fff; border:1px solid var(--gris-300); border-radius:6px; padding:6px 10px; margin-bottom:6px; font-size:12px;">
        <span>${esc(textoGrupoDeficiencia(g))}</span>
        <button type="button" data-idx="${i}" class="btnQuitarGrupo" style="background:none;border:none;color:var(--rojo);font-size:14px; flex-shrink:0;">✕</button>
      </div>
    `).join('');
    cont.querySelectorAll('.btnQuitarGrupo').forEach(btn => {
      btn.addEventListener('click', () => {
        grupos.splice(parseInt(btn.dataset.idx, 10), 1);
        renderizarChipsDeficiencias();
      });
    });
  }

  function actualizarVisibilidadPorTipo() {
    const tipo = document.getElementById('insTipo').value;
    document.getElementById('bloqueDeficiencias').classList.toggle('oculto', tipo === 'inicial');
    document.getElementById('bloqueFechaID').classList.toggle('oculto', tipo !== 'seguimiento');
  }
  document.getElementById('insTipo').addEventListener('change', actualizarVisibilidadPorTipo);
  actualizarVisibilidadPorTipo();

  document.getElementById('defAccion').addEventListener('change', (e) => {
    const esRecodifico = e.target.value === 'recodifico';
    document.getElementById('defCodigoUnico').classList.toggle('oculto', esRecodifico);
    document.getElementById('defCodigoDoble').classList.toggle('oculto', !esRecodifico);
  });

  document.getElementById('insEsCasoMAS').addEventListener('change', (e) => {
    document.getElementById('bloqueAsuntoMAS').classList.toggle('oculto', !e.target.checked);
  });

  document.getElementById('btnAgregarGrupoDef').addEventListener('click', () => {
    const accion = document.getElementById('defAccion').value;
    const cantidad = parseInt(document.getElementById('defCantidad').value, 10);
    const descripcionAdicional = document.getElementById('defDescripcion').value.trim();
    if (accion === 'recodifico') {
      grupos.push({
        accion, cantidad, descripcionAdicional,
        codigoAnterior: document.getElementById('defCodigoAnterior').value,
        codigoNuevo: document.getElementById('defCodigoNuevo').value
      });
    } else {
      grupos.push({ accion, cantidad, descripcionAdicional, codigo: document.getElementById('defCodigo').value });
    }
    document.getElementById('defDescripcion').value = '';
    renderizarChipsDeficiencias();
  });

  renderizarChipsDeficiencias();

  document.getElementById('btnGuardarInspeccion').addEventListener('click', () => {
    const tipo = document.getElementById('insTipo').value;
    const datos = {
      dependencia: document.getElementById('insDependencia').value.trim() || 'SIN_DEP',
      tipo,
      buque: {
        tipo: document.getElementById('insBuqueTipo').value.trim(),
        nombre: document.getElementById('insBuqueNombre').value.trim(),
        matricula: document.getElementById('insMatricula').value.trim(),
        bandera: document.getElementById('insBandera').value.trim()
      },
      deficiencias: tipo === 'inicial' ? [] : grupos,
      fechaInspMasDetallada: tipo === 'seguimiento' ? document.getElementById('insFechaID').value.trim() : '',
      asunto: document.getElementById('insEsCasoMAS').checked ? document.getElementById('insAsunto').value.trim() : '',
      nota: document.getElementById('insNota').value.trim()
    };
    if (opciones.incluirCategoria) datos.categoria = document.getElementById('insCategoria').value;
    cerrarModalInspeccion();
    opciones.onGuardar(datos);
  });
}
