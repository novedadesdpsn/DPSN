// ============================================================
// FINALIZAR GUARDIA — Novedades DPSN
// ============================================================
// Paso 1: se eligen las pestañas a limpiar (las tildadas se vacían).
// Paso 2: se carga la Guardia Entrante; el que estaba como entrante
// pasa a ser saliente. Todo se guarda de una vez, así que un solo
// "Deshacer" lo revierte completo. Antes de borrar, se archiva el
// parte en el historial.
// ============================================================

const PESTANAS_LIMPIABLES = [
  { id: 'insp-extraordinarias', etiqueta: 'Insp. Extraordinarias', marcada: true },
  { id: 'insp-psc', etiqueta: 'Estado Rector de Puerto', marcada: true },
  { id: 'casos-mas', etiqueta: 'Casos MAS (suelen tener continuidad)', marcada: false },
  { id: 'casos-sar', etiqueta: 'Casos SAR (suelen tener continuidad)', marcada: false },
  { id: 'otros', etiqueta: 'Otros', marcada: true },
  { id: 'oficinas', etiqueta: 'Oficinas', marcada: true },
  { id: 'buques-detencion', etiqueta: 'Buques con Detención (tabla y mapa)', marcada: true },
  { id: 'insp-tecnicas', etiqueta: 'Inspecciones Técnicas', marcada: true },
  { id: 'control-gestion', etiqueta: 'Div. Control de Gestión', marcada: true },
  { id: 'licencias', etiqueta: 'Licencias', marcada: true },
  { id: 'cursos', etiqueta: 'Cursos / Comisiones', marcada: true }
];

function cerrarModalFinalizarGuardia() {
  const m = document.getElementById('modalFinalizarGuardia');
  if (m) m.remove();
}

function uiFinalizarGuardia() {
  cerrarModalFinalizarGuardia();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalFinalizarGuardia';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header"><h3>Finalizar Guardia — Paso 1: ¿qué se limpia?</h3><button type="button" onclick="cerrarModalFinalizarGuardia()">✕</button></div>
      <div class="modal-lista" id="fgLista">
        <p style="font-size:12px; color:var(--gris-700); margin:0 0 8px;">Las pestañas <strong>tildadas se vacían</strong>. Destildá las que querés conservar (por ejemplo, Casos MAS y SAR que siguen abiertos).</p>
        ${PESTANAS_LIMPIABLES.map(p => `<label><input type="checkbox" class="fg-chk" value="${p.id}" ${p.marcada ? 'checked' : ''}> ${esc(p.etiqueta)}</label>`).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalFinalizarGuardia()">Cancelar</button>
        <button class="btn-primario" type="button" id="fgSiguiente">Siguiente →</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('fgSiguiente').addEventListener('click', () => {
    const seleccion = Array.from(document.querySelectorAll('.fg-chk')).filter(c => c.checked).map(c => c.value);
    pasoGuardiaEntrante(modal, seleccion);
  });
}

function pasoGuardiaEntrante(modal, seleccion) {
  const jefes = NOMINA_JEFES_SERVICIO.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  const aytes = NOMINA_AYUDANTES_GUARDIA.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  const ent = D.guardia.entrante || [];
  modal.querySelector('.modal-caja').innerHTML = `
    <div class="modal-header"><h3>Finalizar Guardia — Paso 2: Guardia Entrante</h3><button type="button" onclick="cerrarModalFinalizarGuardia()">✕</button></div>
    <div class="modal-campos">
      <p style="font-size:12px; color:var(--gris-700); margin:0 0 4px;">La guardia que figuraba como entrante (<strong>${esc(ent[0] ? ent[0].nombre : '—')}</strong> / ${esc(ent[1] ? ent[1].nombre : '—')}) pasa a ser <strong>saliente</strong>. Cargá la nueva guardia entrante:</p>
      <div class="campo"><label>Jefe de Servicio entrante</label><select id="fgJefe">${jefes}</select></div>
      <div class="campo"><label>Ayudante de Guardia entrante</label><select id="fgAyte">${aytes}</select></div>
      <p style="font-size:11.5px; color:var(--gris-500); margin:0;">Se va a vaciar: ${seleccion.length ? seleccion.map(id => esc((PESTANAS_LIMPIABLES.find(p => p.id === id) || {}).etiqueta || id)).join(', ') : 'nada (solo se cambia la guardia)'}. Podés revertirlo con "Deshacer".</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secundario" type="button" id="fgVolver">← Volver</button>
      <button class="btn-primario" type="button" id="fgConfirmar">Finalizar guardia</button>
    </div>`;
  document.getElementById('fgVolver').addEventListener('click', uiFinalizarGuardia);
  document.getElementById('fgConfirmar').addEventListener('click', async () => {
    const jefe = document.getElementById('fgJefe').value;
    const ayte = document.getElementById('fgAyte').value;
    cerrarModalFinalizarGuardia();
    await ejecutarFinalizarGuardia(seleccion, jefe, ayte);
  });
}

function limpiarPestanaParaFinalizar(id) {
  switch (id) {
    case 'insp-extraordinarias': {
      const ie = D.inspeccionesExtraordinarias;
      // El total anual es correlativo: lo de hoy pasa al acumulado antes de vaciar.
      ie.argentina.acumuladoAnualPrevio = (ie.argentina.acumuladoAnualPrevio || 0) + contarInspeccionesGrupo(ie.argentina);
      ie.extranjera.acumuladoAnualPrevio = (ie.extranjera.acumuladoAnualPrevio || 0) + contarInspeccionesGrupo(ie.extranjera);
      ie.argentina.porDependencia = {};
      ie.extranjera.porDependencia = {};
      ie.resumenManual = {};
      break;
    }
    case 'insp-psc': {
      const rp = D.estadoRectorPuerto.resumen;
      D.estadoRectorPuerto.resumen = {
        buquesIngresados: 0, factiblesDiario: 0, inspeccionadosDiario: 0,
        factiblesAnualPrevio: (rp.factiblesAnualPrevio || 0) + (rp.factiblesDiario || 0),
        inspeccionadosAnualPrevio: (rp.inspeccionadosAnualPrevio || 0) + (rp.inspeccionadosDiario || 0)
      };
      D.estadoRectorPuerto.porDependencia = {};
      break;
    }
    case 'casos-mas': D.casosMAS.porDependencia = {}; break;
    case 'casos-sar': D.casosSAR.porDependencia = {}; break;
    case 'otros': D.otros.porDependencia = {}; break;
    case 'oficinas':
      D.oficinas = {
        documentacion: { tramitesAnalisis: [], certificadosArqueo: [], giradosTNAV: [] },
        controlGestion: { filas: [] },
        divisionNavegacion: { filas: [] },
        sinDefinir1: {},
        registroNacionalBuques: { filas: filasRNBUVacias() }
      };
      break;
    case 'buques-detencion': D.buquesDetencion = []; D.buquesDetencionMapa = []; break;
    case 'insp-tecnicas': D.inspeccionesTecnicas = []; break;
    case 'control-gestion': D.divisionControlGestion = []; break;
    case 'licencias':
      Object.keys(D.licencias).forEach(k => { if (Array.isArray(D.licencias[k])) D.licencias[k] = []; });
      break;
    case 'cursos': D.cursos = []; break;
  }
}

async function ejecutarFinalizarGuardia(seleccion, jefe, ayte) {
  // Resguardo: archivar el parte tal cual estaba antes de borrar.
  try { if (typeof archivarParteDelDia === 'function') await archivarParteDelDia(); } catch (e) { console.error('No se pudo archivar antes de finalizar:', e); }

  seleccion.forEach(limpiarPestanaParaFinalizar);

  const entranteActual = (D.guardia.entrante || []).map(p => ({ ...p }));
  D.guardia = {
    saliente: entranteActual.length ? entranteActual : D.guardia.saliente,
    entrante: [
      { rol: 'Jefe de Servicio', nombre: jefe },
      { rol: 'Ayudante de Guardia', nombre: ayte }
    ]
  };
  persistirDatosGuardia();
  refrescarPestanaActual();
  UNDO.aviso('Guardia finalizada. Podés revertirla con "Deshacer".');
}
