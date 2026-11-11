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
  { id: 'insp-extraordinarias', etiqueta: 'Insp. Extraordinarias', marcada: false },
  { id: 'insp-psc', etiqueta: 'Estado Rector de Puerto', marcada: false },
  { id: 'casos-mas', etiqueta: 'Casos MAS (suelen tener continuidad)', marcada: false },
  { id: 'casos-sar', etiqueta: 'Casos SAR (suelen tener continuidad)', marcada: false },
  { id: 'otros', etiqueta: 'Otros', marcada: false },
  { id: 'oficinas', etiqueta: 'Oficinas', marcada: false },
  { id: 'buques-detencion', etiqueta: 'Buques con Detención (tabla y mapa)', marcada: false },
  { id: 'insp-tecnicas', etiqueta: 'Inspecciones Técnicas', marcada: false },
  { id: 'control-gestion', etiqueta: 'Div. Control de Gestión', marcada: false },
  { id: 'licencias', etiqueta: 'Licencias', marcada: false },
  { id: 'cursos', etiqueta: 'Cursos / Comisiones', marcada: false }
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
        <p style="font-size:12px; color:var(--gris-700); margin:0 0 8px;">Tildá las pestañas que querés <strong>vaciar</strong>. Las que dejes sin tildar se conservan (por ejemplo, Casos MAS y SAR que siguen abiertos).</p>
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
      normalizarResumenPSC();
      const rp = D.estadoRectorPuerto.resumen;
      // Hay que calcularlo ANTES de vaciar porDependencia (el auto-cálculo lee las inspecciones de hoy).
      const inspeccionadosHoy = calcularInspeccionadosPSC();
      normalizarCIC();
      const cicHoy = contarCIC(D.estadoRectorPuerto);
      D.estadoRectorPuerto.resumen = {
        buquesIngresadosDiario: 0, factiblesDiario: 0, inspeccionadosManual: null,
        buquesIngresadosAnualPrevio: (rp.buquesIngresadosAnualPrevio || 0) + (rp.buquesIngresadosDiario || 0),
        factiblesAnualPrevio: (rp.factiblesAnualPrevio || 0) + (rp.factiblesDiario || 0),
        inspeccionadosAnualPrevio: (rp.inspeccionadosAnualPrevio || 0) + inspeccionadosHoy
      };
      D.estadoRectorPuerto.cic.totalPrevio = (D.estadoRectorPuerto.cic.totalPrevio || 0) + cicHoy;
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
  // Punto de restauración automático, por si hay que volver atrás.
  try { if (typeof crearPuntoRestauracion === 'function') await crearPuntoRestauracion('auto', 'Antes de finalizar guardia'); } catch (e) { console.error(e); }
  // Resguardo: archivar el parte tal cual estaba antes de borrar.
  try { if (typeof archivarParteDelDia === 'function') await archivarParteDelDia(); } catch (e) { console.error('No se pudo archivar antes de finalizar:', e); }

  seleccion.forEach(limpiarPestanaParaFinalizar);

  const entranteActual = (D.guardia.entrante || []).map(p => ({ ...p }));
  D.guardia = {
    saliente: entranteActual.length ? entranteActual : D.guardia.saliente,
    entrante: [
      { rol: 'Jefe de Servicio', nombre: jefe },
      { rol: 'Ayudante de Guardia', nombre: ayte }
    ],
    // Para que la finalización automática del mediodía (ver más abajo)
    // sepa que hoy ya se hizo el finalizado "a mano" y no vuelva a correr.
    ultimaFinalizacion: fechaHoyISO_()
  };
  persistirDatosGuardia();
  refrescarPestanaActual();
  UNDO.aviso('Guardia finalizada. Podés revertirla con "Deshacer".');
}

// ============================================================
// FINALIZACIÓN AUTOMÁTICA AL MEDIODÍA
// ============================================================
// Si para las 12:00 (hora local de la computadora) no se hizo ningún
// "Finalizar Guardia" en el día (ni a mano ni por este mismo chequeo),
// el sistema limpia automáticamente, sin pedir nada: Inspecciones
// Extraordinarias, Estado Rector de Puerto (EREP), los casos MAS/SAR
// marcados "Cerrado" (los "Pendiente" NO se tocan, siguen con
// continuidad) y las licencias cuyo vencimiento (fecha DD/MM/AAAA
// completa) ya pasó o es hoy. NO cambia el Jefe de Servicio ni el
// Ayudante de Guardia: eso sigue siendo siempre manual, con el botón
// de siempre.
//
// Como este sitio no tiene servidor propio, esto corre en el
// navegador de quien tenga el sistema abierto (y permiso de edición):
// se revisa apenas se entra y, si se deja la pestaña abierta, cada
// pocos minutos. Si nadie abrió el sistema ese día, corre apenas
// alguien lo abre, aunque ya sea de tarde — y limpia lo que haya que
// limpiar a esa hora, no solo "lo de las 12:00 en punto".
// ============================================================

const INTERVALO_CHEQUEO_FIN_AUTO_MIN = 5;

function fechaHoyISO_() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Convierte "DD/MM/AAAA" a Date (medianoche local). Devuelve null si el
 * texto no es EXACTAMENTE esa forma — por ejemplo "Turno médico
 * 05/08/2026" no cuenta: no se puede asumir con certeza cuál es la
 * fecha real de vencimiento, así que esas licencias no se tocan solas.
 */
function fechaDDMMAAAAaDate_(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((texto || '').trim());
  if (!m) return null;
  const dd = Number(m[1]), mm = Number(m[2]), yyyy = Number(m[3]);
  const f = new Date(yyyy, mm - 1, dd);
  if (f.getFullYear() !== yyyy || f.getMonth() !== mm - 1 || f.getDate() !== dd) return null;
  return f;
}

/**
 * Saca de un bloque de casos (D.casosMAS o D.casosSAR) los que están
 * marcados "Cerrado". Los "Pendiente" quedan intactos. Devuelve cuántos
 * sacó.
 */
function limpiarCasosCerrados_(bloque) {
  let sacados = 0;
  if (!bloque || !bloque.porDependencia) return 0;
  Object.keys(bloque.porDependencia).forEach(dep => {
    const antes = bloque.porDependencia[dep].length;
    bloque.porDependencia[dep] = bloque.porDependencia[dep].filter(c => c.estado !== 'cerrado');
    sacados += antes - bloque.porDependencia[dep].length;
    if (!bloque.porDependencia[dep].length) delete bloque.porDependencia[dep];
  });
  return sacados;
}

/**
 * Saca de D.licencias (todas las categorías, incluidas las viejas que ya
 * no se pueden elegir para una licencia nueva) las que YA PASARON — es
 * decir, cuyo "vence" es ANTERIOR al día de hoy (fecha estrictamente
 * menor, no "hoy o antes"). Una licencia que vence hoy mismo todavía
 * tiene que verse en el parte de hoy (que arranca a las 07:00 y sigue
 * hasta las 07:00 de mañana), así que no se toca hasta el chequeo del
 * día siguiente. Las que tienen un vencimiento que no es una fecha
 * limpia (ej. "Turno médico...") tampoco se tocan: se siguen borrando a
 * mano. Devuelve cuántas sacó.
 */
function limpiarLicenciasVencidas_(hoyMedianoche) {
  let sacadas = 0;
  if (!D.licencias) return 0;
  Object.keys(D.licencias).forEach(cat => {
    if (!Array.isArray(D.licencias[cat])) return;
    D.licencias[cat] = D.licencias[cat].filter(lic => {
      const f = fechaDDMMAAAAaDate_(lic.vence);
      if (!f) return true; // no se puede determinar con certeza: se conserva
      const vencida = f < hoyMedianoche; // estrictamente anterior a hoy: "hoy" todavía no pasó
      if (vencida) sacadas++;
      return !vencida;
    });
  });
  return sacadas;
}

/**
 * Corre el chequeo. Si corresponde, limpia las 4 cosas de arriba y deja
 * un aviso (y queda, como siempre, en Auditoría y se puede revertir con
 * "Deshacer" o desde "Restaurar").
 */
async function chequearFinalizacionAutomatica() {
  if (typeof SOLO_LECTURA_ACTUAL !== 'undefined' && SOLO_LECTURA_ACTUAL) return; // que no lo dispare quien solo mira
  const ahora = new Date();
  if (ahora.getHours() < 12) return;
  const hoy = fechaHoyISO_();
  if (((D.guardia || {}).ultimaFinalizacion || '') === hoy) return; // hoy ya se hizo (a mano o automático)

  try { if (typeof crearPuntoRestauracion === 'function') await crearPuntoRestauracion('auto', 'Antes de la finalización automática del mediodía'); } catch (e) { console.error(e); }
  try { if (typeof archivarParteDelDia === 'function') await archivarParteDelDia(); } catch (e) { console.error('No se pudo archivar antes de la finalización automática:', e); }

  limpiarPestanaParaFinalizar('insp-extraordinarias');
  limpiarPestanaParaFinalizar('insp-psc');
  const cerradosMAS = limpiarCasosCerrados_(D.casosMAS);
  const cerradosSAR = limpiarCasosCerrados_(D.casosSAR);
  const hoyMedianoche = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const licenciasVencidas = limpiarLicenciasVencidas_(hoyMedianoche);

  D.guardia.ultimaFinalizacion = hoy;
  persistirDatosGuardia();
  refrescarPestanaActual();

  const partes = ['Insp. Extraordinarias y Estado Rector de Puerto'];
  if (cerradosMAS || cerradosSAR) partes.push(`${cerradosMAS + cerradosSAR} caso(s) MAS/SAR cerrado(s)`);
  if (licenciasVencidas) partes.push(`${licenciasVencidas} licencia(s) vencida(s)`);
  if (typeof UNDO !== 'undefined') UNDO.aviso(`Finalización automática del mediodía: se limpió ${partes.join(', ')}. Podés revertirlo con "Deshacer" o desde "Restaurar".`);
}

/** Se llama una vez al entrar al dashboard. Chequea al toque y después cada pocos minutos, por si se deja la pestaña abierta justo cuando cruza el mediodía. */
function iniciarFinalizacionAutomatica() {
  chequearFinalizacionAutomatica();
  setInterval(chequearFinalizacionAutomatica, INTERVALO_CHEQUEO_FIN_AUTO_MIN * 60 * 1000);
}
