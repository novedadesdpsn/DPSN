// ============================================================
// DATOS DE GUARDIA — carga directa en la plataforma
// ============================================================
// Cada sección (Inspecciones Extraordinarias, PSC, Casos MAS/SAR,
// Otros, Buques con Detención, Inspecciones Técnicas, Control de
// Gestión, Licencias, Cursos) es UN documento en la colección
// "parteDiario" de Firestore: parteDiario/{seccion} = { valor: ... }
//
// Mientras el proyecto de Firebase real no esté conectado (modo
// demo), se usa localStorage como reemplazo temporal — persiste
// en esa computadora, pero no se comparte entre usuarios. En
// cuanto haya un proyecto real, esto mismo pasa a leer/escribir
// en Firestore y queda compartido en vivo entre todas las
// computadoras que entren con el link.
// ============================================================

const CLAVE_DATOS_GUARDIA = 'novedades_dpsn_datos_guardia';
const SECCIONES_PERSISTIDAS = ['inspeccionesExtraordinarias', 'estadoRectorPuerto', 'casosMAS', 'casosSAR', 'buquesDetencionMapa', 'otros', 'oficinas', 'buquesDetencion', 'inspeccionesTecnicas', 'divisionControlGestion', 'licencias', 'cursos', 'guardia'];
const COLECCION_PARTE_DIARIO = 'parteDiario';

function persistirDatosGuardia() {
  // Caché local instantáneo, siempre — sirve de resguardo si por
  // un instante se corta la conexión, y es lo único que se usa en
  // modo demo.
  const paquete = {};
  SECCIONES_PERSISTIDAS.forEach(clave => { paquete[clave] = DATOS_EJEMPLO[clave]; });
  const fotoActual = JSON.stringify(paquete);
  localStorage.setItem(CLAVE_DATOS_GUARDIA, fotoActual);
  if (typeof UNDO !== 'undefined') UNDO.registrar(fotoActual);

  SECCIONES_PERSISTIDAS.forEach(clave => { registrarAuditoriaSiCambio(clave, DATOS_EJEMPLO[clave]); });

  if (DEMO_MODE) return;

  SECCIONES_PERSISTIDAS.forEach(clave => {
    db.collection(COLECCION_PARTE_DIARIO).doc(clave).set({ valor: DATOS_EJEMPLO[clave] })
      .catch(err => console.error(`No se pudo guardar "${clave}" en Firestore:`, err));
  });
}

/** Primera carga: trae lo que ya haya guardado (Firestore o localStorage según el modo). */
/**
 * Corrige la estructura de Oficinas si quedó guardada con la forma
 * vieja (bloques libres por oficina, de antes del rediseño) o le
 * faltan subsecciones. Devuelve true si tuvo que arreglar algo,
 * para que quien la llame vuelva a guardar el dato ya corregido.
 */
/** Asegura que exista la categoría "personales" aunque lo guardado sea de antes de agregarla. */
function normalizarLicencias() {
  if (!D.licencias) return false;
  if (!Array.isArray(D.licencias.personales)) {
    D.licencias.personales = [];
    return true;
  }
  return false;
}

/**
 * Precargas (licencias e inspecciones técnicas previstas) pendientes de confirmar.
 * Son PRIVADAS de cada usuario: no forman parte del parte compartido (no están en
 * SECCIONES_PERSISTIDAS), así que nadie más las ve, no van al historial ni a los
 * puntos de restauración. Se guardan en Firestore en precargasUsuario/{uid}
 * (en modo demo, en localStorage con el DNI).
 */
const CLAVES_PRECARGA = ['licencias', 'inspeccionesTecnicas', 'divisionControlGestion'];

function normalizarPrecargas() {
  let corregido = false;
  if (!DATOS_EJEMPLO.precargas || typeof DATOS_EJEMPLO.precargas !== 'object') { DATOS_EJEMPLO.precargas = {}; corregido = true; }
  CLAVES_PRECARGA.forEach(k => {
    if (!Array.isArray(DATOS_EJEMPLO.precargas[k])) { DATOS_EJEMPLO.precargas[k] = []; corregido = true; }
  });
  return corregido;
}

function claveLocalPrecargas() {
  const u = (typeof obtenerSesion === 'function') ? obtenerSesion() : null;
  return `novedades_dpsn_precargas_${u ? (u.uid || u.dni) : 'anon'}`;
}

/** Trae las precargas del usuario que ingresó (solo las suyas). */
async function cargarPrecargasPrivadas() {
  normalizarPrecargas();
  const u = (typeof obtenerSesion === 'function') ? obtenerSesion() : null;
  try {
    let guardado = null;
    if (!DEMO_MODE && u && u.uid) {
      const doc = await db.collection('precargasUsuario').doc(u.uid).get();
      if (doc.exists) guardado = doc.data();
    } else {
      const raw = localStorage.getItem(claveLocalPrecargas());
      if (raw) guardado = JSON.parse(raw);
    }
    if (guardado) {
      CLAVES_PRECARGA.forEach(k => { D.precargas[k] = Array.isArray(guardado[k]) ? guardado[k] : []; });
    }
  } catch (err) { console.error('No se pudieron leer las precargas:', err); }
}

/** Guarda SOLO las precargas del usuario (no toca el parte compartido). */
function persistirPrecargas() {
  normalizarPrecargas();
  const paquete = {};
  CLAVES_PRECARGA.forEach(k => { paquete[k] = D.precargas[k]; });
  try { localStorage.setItem(claveLocalPrecargas(), JSON.stringify(paquete)); } catch (e) { /* sin caché local */ }
  const u = (typeof obtenerSesion === 'function') ? obtenerSesion() : null;
  if (!DEMO_MODE && u && u.uid) {
    db.collection('precargasUsuario').doc(u.uid).set(paquete)
      .catch(err => console.error('No se pudieron guardar las precargas:', err));
  }
}

function filasRNBUVacias() {
  const f = (nroOrden) => ({ nroOrden, matr: 0, tran: 0, vent: 0, medJud: 0, cbioMotor: 0, otros: 0 });
  return { buscarBuque: f(1), ingresarGde: f(2), verificar: f(3), aprobarFolio: f(8), darSalida: f(11) };
}

function normalizarOficinas() {
  const vacia = () => ({
    documentacion: { tramitesAnalisis: [], certificadosArqueo: [], giradosTNAV: [] },
    controlGestion: { filas: [] },
    divisionNavegacion: { filas: [] },
    sinDefinir1: {},
    registroNacionalBuques: { filas: filasRNBUVacias() }
  });

  const o = DATOS_EJEMPLO.oficinas;
  if (!o || !o.documentacion || !Array.isArray(o.documentacion.tramitesAnalisis)) {
    DATOS_EJEMPLO.oficinas = vacia();
    return true;
  }
  let corregido = false;
  if (!Array.isArray(o.documentacion.certificadosArqueo)) { o.documentacion.certificadosArqueo = []; corregido = true; }
  if (!Array.isArray(o.documentacion.giradosTNAV)) { o.documentacion.giradosTNAV = []; corregido = true; }
  if (!o.controlGestion || !Array.isArray(o.controlGestion.filas)) { o.controlGestion = { filas: [] }; corregido = true; }
  if (!o.divisionNavegacion || !Array.isArray(o.divisionNavegacion.filas)) { o.divisionNavegacion = { filas: [] }; corregido = true; }
  if (!o.sinDefinir1) { o.sinDefinir1 = {}; corregido = true; }
  if (!o.registroNacionalBuques || !o.registroNacionalBuques.filas || !o.registroNacionalBuques.filas.buscarBuque) {
    o.registroNacionalBuques = { filas: filasRNBUVacias() };
    corregido = true;
  }
  if (o.sinDefinir2) { delete o.sinDefinir2; corregido = true; }
  return corregido;
}

async function hidratarDatosGuardia() {
  if (DEMO_MODE) {
    const raw = localStorage.getItem(CLAVE_DATOS_GUARDIA);
    if (raw) {
      try {
        const guardado = JSON.parse(raw);
        SECCIONES_PERSISTIDAS.forEach(clave => {
          if (guardado[clave] !== undefined) DATOS_EJEMPLO[clave] = guardado[clave];
        });
      } catch (e) { console.error('No se pudo leer lo guardado localmente:', e); }
    } else {
      persistirDatosGuardia();
    }
    if (normalizarOficinas() || normalizarLicencias()) persistirDatosGuardia();
    inicializarEstadoConocido();
    await cargarPrecargasPrivadas();
    return;
  }

  await Promise.all(SECCIONES_PERSISTIDAS.map(async (clave) => {
    try {
      const doc = await db.collection(COLECCION_PARTE_DIARIO).doc(clave).get();
      if (doc.exists && doc.data().valor !== undefined) {
        DATOS_EJEMPLO[clave] = doc.data().valor;
      } else {
        // Todavía no existe en Firestore: lo sembramos con el dato de ejemplo actual.
        await db.collection(COLECCION_PARTE_DIARIO).doc(clave).set({ valor: DATOS_EJEMPLO[clave] });
      }
    } catch (err) {
      console.error(`No se pudo leer "${clave}" desde Firestore:`, err);
    }
  }));

  if (normalizarOficinas() || normalizarLicencias()) persistirDatosGuardia();
  inicializarEstadoConocido();
  await cargarPrecargasPrivadas();
  activarEscuchaEnVivo();
}

/** Escucha en vivo: si otro usuario carga algo desde otra computadora, se refleja acá solo. */
function activarEscuchaEnVivo() {
  SECCIONES_PERSISTIDAS.forEach(clave => {
    db.collection(COLECCION_PARTE_DIARIO).doc(clave).onSnapshot(doc => {
      if (!doc.exists || doc.data().valor === undefined) return;
      DATOS_EJEMPLO[clave] = doc.data().valor;
      sincronizarEstadoConocido(clave, doc.data().valor);
      if (typeof UNDO !== 'undefined') UNDO.reiniciar(); // no genera entrada de auditoría: no es un cambio de esta sesión
      if (typeof refrescarPestanaActual === 'function') refrescarPestanaActual();
    }, err => console.error(`Escucha en vivo de "${clave}" interrumpida:`, err));
  });
}

// ---------- Modal de formulario genérico ----------
function cerrarModalFormulario() {
  const m = document.getElementById('modalFormulario');
  if (m) m.remove();
}

function abrirModalFormulario(titulo, campos, valores, onGuardar) {
  cerrarModalFormulario();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalFormulario';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header">
        <h3>${esc(titulo)}</h3>
        <button type="button" onclick="cerrarModalFormulario()">✕</button>
      </div>
      <div class="modal-campos" id="modalCamposContenedor"></div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalFormulario()">Cancelar</button>
        <button class="btn-primario" type="button" id="btnGuardarFormulario">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const contenedor = document.getElementById('modalCamposContenedor');
  campos.forEach(c => {
    const valorActual = (valores && valores[c.id] !== undefined) ? valores[c.id] : (c.default || '');
    const div = document.createElement('div');
    div.className = 'campo';
    let controlHtml = '';
    if (c.tipo === 'select') {
      controlHtml = `<select id="campo_${c.id}">${c.opciones.map(o =>
        `<option value="${esc(o.valor)}" ${o.valor === valorActual ? 'selected' : ''}>${esc(o.etiqueta)}</option>`
      ).join('')}</select>`;
    } else if (c.tipo === 'textarea') {
      controlHtml = `<textarea id="campo_${c.id}">${esc(valorActual)}</textarea>`;
    } else if (c.tipo === 'fecha') {
      controlHtml = `<input type="date" id="campo_${c.id}" value="${esc(valorActual)}">`;
    } else if (c.tipo === 'checkbox') {
      controlHtml = `<label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:600;"><input type="checkbox" id="campo_${c.id}" ${valorActual === 'si' ? 'checked' : ''} style="width:16px;height:16px;"> ${esc(c.textoCheck || 'Sí')}</label>`;
    } else {
      controlHtml = `<input type="text" id="campo_${c.id}" value="${esc(valorActual)}">`;
    }
    div.innerHTML = (c.tipo === 'checkbox' ? '' : `<label>${esc(c.label)}</label>`) + controlHtml + (c.ayudaHtml || '');
    div.dataset.campo = c.id;
    contenedor.appendChild(div);
  });

  // Campos que solo aparecen si algún checkbox está tildado (visibleSi: 'idDelCheckbox' o ['id1','id2']).
  function actualizarCondicionales() {
    campos.forEach(c => {
      if (!c.visibleSi) return;
      const ids = Array.isArray(c.visibleSi) ? c.visibleSi : [c.visibleSi];
      const fila = contenedor.querySelector(`[data-campo="${c.id}"]`);
      const algunoTildado = ids.some(id => { const chk = document.getElementById(`campo_${id}`); return chk && chk.checked; });
      if (fila) fila.classList.toggle('oculto', !algunoTildado);
    });
  }
  campos.forEach(c => {
    if (c.tipo === 'checkbox') document.getElementById(`campo_${c.id}`).addEventListener('change', actualizarCondicionales);
  });
  actualizarCondicionales();

  document.getElementById('btnGuardarFormulario').addEventListener('click', () => {
    const resultado = {};
    campos.forEach(c => {
      const el = document.getElementById(`campo_${c.id}`);
      resultado[c.id] = c.tipo === 'checkbox' ? (el.checked ? 'si' : 'no') : el.value.trim();
    });
    cerrarModalFormulario();
    onGuardar(resultado);
  });
}

function construirDeficiencias(textoCodigos) {
  return (textoCodigos || '').split(',').map(c => c.trim()).filter(Boolean)
    .map(codigo => ({ codigo, descripcion: descripcionCodigo(codigo) }));
}

// ---------- Inspecciones Extraordinarias ----------
function uiAgregarInspeccionExtraordinaria(bandera) {
  abrirFormularioInspeccionEstandar({
    titulo: 'Agregar inspección extraordinaria',
    etiquetasTipo: { inicial: 'Inicial (II)', detallada: 'Más Detallada (ID)', averia: 'Por Avería (IA)', seguimiento: 'Seguimiento (IS)' },
    incluirCategoria: true,
    onGuardar: (datos) => {
      const grupo = bandera === 'argentina' ? D.inspeccionesExtraordinarias.argentina : D.inspeccionesExtraordinarias.extranjera;
      const dep = datos.dependencia;
      if (!grupo.porDependencia[dep]) grupo.porDependencia[dep] = [];
      grupo.porDependencia[dep].push(datos);
      persistirDatosGuardia();
      refrescarPestanaActual();
    }
  });
}

function uiEditarInspeccionExtraordinaria(bandera, dependencia, indice) {
  const grupo = bandera === 'argentina' ? D.inspeccionesExtraordinarias.argentina : D.inspeccionesExtraordinarias.extranjera;
  const actual = grupo.porDependencia[dependencia][indice];
  abrirFormularioInspeccionEstandar({
    titulo: 'Editar inspección extraordinaria',
    etiquetasTipo: { inicial: 'Inicial (II)', detallada: 'Más Detallada (ID)', averia: 'Por Avería (IA)', seguimiento: 'Seguimiento (IS)' },
    incluirCategoria: true,
    valores: { ...actual, dependencia },
    onGuardar: (datos) => {
      grupo.porDependencia[dependencia].splice(indice, 1);
      if (!grupo.porDependencia[dependencia].length) delete grupo.porDependencia[dependencia];
      const nuevaDep = datos.dependencia;
      if (!grupo.porDependencia[nuevaDep]) grupo.porDependencia[nuevaDep] = [];
      grupo.porDependencia[nuevaDep].push(datos);
      persistirDatosGuardia();
      refrescarPestanaActual();
    }
  });
}

function eliminarInspeccionExtraordinaria(bandera, dependencia, indice) {
  if (!confirm('¿Eliminar esta inspección?')) return;
  const grupo = bandera === 'argentina' ? D.inspeccionesExtraordinarias.argentina : D.inspeccionesExtraordinarias.extranjera;
  grupo.porDependencia[dependencia].splice(indice, 1);
  if (!grupo.porDependencia[dependencia].length) delete grupo.porDependencia[dependencia];
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Estado Rector de Puerto ----------
function uiAgregarInspeccionPSC() {
  abrirFormularioInspeccionEstandar({
    titulo: 'Agregar inspección PSC',
    etiquetasTipo: { inicial: 'IISD — Inicial sin deficiencias', detallada: 'IICD — Inicial con deficiencia', seguimiento: 'IS — Seguimiento' },
    incluirCategoria: false,
    listaCodigos: CODIGOS_MEDIDAS_PSC,
    onGuardar: (datos) => {
      const dep = datos.dependencia;
      if (!D.estadoRectorPuerto.porDependencia[dep]) D.estadoRectorPuerto.porDependencia[dep] = [];
      D.estadoRectorPuerto.porDependencia[dep].push(datos);
      persistirDatosGuardia();
      refrescarPestanaActual();
    }
  });
}

function uiEditarInspeccionPSC(dependencia, indice) {
  const actual = D.estadoRectorPuerto.porDependencia[dependencia][indice];
  abrirFormularioInspeccionEstandar({
    titulo: 'Editar inspección PSC',
    etiquetasTipo: { inicial: 'IISD — Inicial sin deficiencias', detallada: 'IICD — Inicial con deficiencia', seguimiento: 'IS — Seguimiento' },
    incluirCategoria: false,
    listaCodigos: CODIGOS_MEDIDAS_PSC,
    valores: { ...actual, dependencia },
    onGuardar: (datos) => {
      D.estadoRectorPuerto.porDependencia[dependencia].splice(indice, 1);
      if (!D.estadoRectorPuerto.porDependencia[dependencia].length) delete D.estadoRectorPuerto.porDependencia[dependencia];
      const nuevaDep = datos.dependencia;
      if (!D.estadoRectorPuerto.porDependencia[nuevaDep]) D.estadoRectorPuerto.porDependencia[nuevaDep] = [];
      D.estadoRectorPuerto.porDependencia[nuevaDep].push(datos);
      persistirDatosGuardia();
      refrescarPestanaActual();
    }
  });
}

function eliminarInspeccionPSC(dependencia, indice) {
  if (!confirm('¿Eliminar esta inspección?')) return;
  D.estadoRectorPuerto.porDependencia[dependencia].splice(indice, 1);
  if (!D.estadoRectorPuerto.porDependencia[dependencia].length) delete D.estadoRectorPuerto.porDependencia[dependencia];
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Casos MAS / SAR ----------
function camposCaso(esSAR) {
  const base = [
    { id: 'dependencia', label: 'Dependencia (sigla)' },
    { id: 'estado', label: 'Estado', tipo: 'select', opciones: [{ valor: 'pendiente', etiqueta: 'Pendiente' }, { valor: 'cerrado', etiqueta: 'Cerrado' }] },
    { id: 'titulo', label: 'Título identificatorio (ej: R/E KOETI)' }
  ];
  const sar = esSAR ? [
    { id: 'numeroCaso', label: 'N.º de caso' },
    { id: 'subcentroVTS', label: 'Subcentro (VTS)' },
    { id: 'nombreBuque', label: 'Nombre del buque' },
    { id: 'matricula', label: 'Matrícula' },
    { id: 'bandera', label: 'Bandera' },
    { id: 'fechaInicio', label: 'Fecha de inicio' },
    { id: 'fechaCierre', label: 'Fecha de cierre (si corresponde)' }
  ] : [];
  const requiereInspeccion = !esSAR ? [
    { id: 'requiereInspeccion', label: '¿Requiere inspección?', tipo: 'select', opciones: [{ valor: 'no', etiqueta: 'No' }, { valor: 'si', etiqueta: 'Sí' }] }
  ] : [];
  return [...base, ...sar, ...requiereInspeccion,
    { id: 'posicion', label: 'Posición (lat/lon o referencia)' },
    { id: 'caracteristicas', label: 'Características', tipo: 'textarea' },
    { id: 'novedad', label: 'Novedad', tipo: 'textarea' },
    { id: 'situacion', label: 'Situación', tipo: 'textarea' }
  ];
}

function uiAgregarCaso(tipo) {
  const esSAR = tipo === 'SAR';
  abrirModalFormulario(`Agregar caso ${tipo}`, camposCaso(esSAR), {}, (datos) => {
    const bloque = esSAR ? D.casosSAR : D.casosMAS;
    const dep = datos.dependencia || 'SIN_DEP';
    if (!bloque.porDependencia[dep]) bloque.porDependencia[dep] = [];
    bloque.porDependencia[dep].push(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarCaso(tipo, dependencia, indice) {
  const esSAR = tipo === 'SAR';
  const bloque = esSAR ? D.casosSAR : D.casosMAS;
  const actual = bloque.porDependencia[dependencia][indice];
  abrirModalFormulario(`Editar caso ${tipo}`, camposCaso(esSAR), { ...actual, dependencia }, (datos) => {
    const nuevaDep = datos.dependencia || 'SIN_DEP';
    bloque.porDependencia[dependencia].splice(indice, 1);
    if (!bloque.porDependencia[dependencia].length) delete bloque.porDependencia[dependencia];
    if (!bloque.porDependencia[nuevaDep]) bloque.porDependencia[nuevaDep] = [];
    bloque.porDependencia[nuevaDep].push(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarCaso(tipo, dependencia, indice) {
  if (!confirm('¿Eliminar este caso?')) return;
  const bloque = tipo === 'SAR' ? D.casosSAR : D.casosMAS;
  bloque.porDependencia[dependencia].splice(indice, 1);
  if (!bloque.porDependencia[dependencia].length) delete bloque.porDependencia[dependencia];
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Otros ----------
function uiAgregarOtroTexto() {
  abrirModalFormulario('Agregar bloque de texto — Otros', [
    { id: 'dependencia', label: 'Dependencia (sigla)' },
    { id: 'titulo', label: 'Título' },
    { id: 'contenido', label: 'Contenido', tipo: 'textarea' }
  ], {}, (datos) => {
    const dep = datos.dependencia || 'SIN_DEP';
    if (!D.otros.porDependencia[dep]) D.otros.porDependencia[dep] = [];
    D.otros.porDependencia[dep].push({ tipoBloque: 'texto', titulo: datos.titulo, contenido: datos.contenido });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiAgregarOtroTabla() {
  abrirModalFormulario('Agregar bloque de tabla — Otros', [
    { id: 'dependencia', label: 'Dependencia (sigla)' },
    { id: 'titulo', label: 'Título' },
    { id: 'columnas', label: 'Columnas (separadas por coma)', default: 'Concepto, Detalle, Fecha' }
  ], {}, (datos) => {
    const dep = datos.dependencia || 'SIN_DEP';
    const columnas = (datos.columnas || '').split(',').map(c => c.trim()).filter(Boolean);
    if (!D.otros.porDependencia[dep]) D.otros.porDependencia[dep] = [];
    D.otros.porDependencia[dep].push({ tipoBloque: 'tabla', titulo: datos.titulo, columnas, filas: [columnas.map(() => '')] });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarOtro(dependencia, indice) {
  if (!confirm('¿Eliminar este bloque?')) return;
  D.otros.porDependencia[dependencia].splice(indice, 1);
  if (!D.otros.porDependencia[dependencia].length) delete D.otros.porDependencia[dependencia];
  persistirDatosGuardia();
  refrescarPestanaActual();
}

function uiEditarOtro(dependencia, indice) {
  const actual = D.otros.porDependencia[dependencia][indice];
  const campos = actual.tipoBloque === 'texto'
    ? [
        { id: 'dependencia', label: 'Dependencia (sigla)' },
        { id: 'titulo', label: 'Título' },
        { id: 'contenido', label: 'Contenido', tipo: 'textarea' }
      ]
    : [
        { id: 'dependencia', label: 'Dependencia (sigla)' },
        { id: 'titulo', label: 'Título' }
      ];
  const valoresIniciales = { dependencia, titulo: actual.titulo, contenido: actual.contenido };
  abrirModalFormulario('Editar bloque — Otros', campos, valoresIniciales, (datos) => {
    D.otros.porDependencia[dependencia].splice(indice, 1);
    if (!D.otros.porDependencia[dependencia].length) delete D.otros.porDependencia[dependencia];
    const nuevaDep = datos.dependencia || 'SIN_DEP';
    if (!D.otros.porDependencia[nuevaDep]) D.otros.porDependencia[nuevaDep] = [];
    D.otros.porDependencia[nuevaDep].push(actual.tipoBloque === 'texto'
      ? { tipoBloque: 'texto', titulo: datos.titulo, contenido: datos.contenido }
      : { ...actual, titulo: datos.titulo });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

// ---------- Buques con Detención (tabla del parte) ----------
const CODIGOS_DETENCION = ['17', '18', '30', '99'];

function textoDeficienciasDetencion(lista) {
  return (lista || []).map(d => `Cód. ${d.codigo} (${String(d.cantidad).padStart(2, '0')})`).join(' / ');
}

function abrirFormularioBuqueDetencion(titulo, valores, onGuardar) {
  cerrarModalInspeccion();
  let lista = (valores.deficienciasLista || []).slice();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalInspeccion';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header"><h3>${esc(titulo)}</h3><button type="button" onclick="cerrarModalInspeccion()">✕</button></div>
      <div class="modal-campos">
        <div class="campo"><label>Dependencia</label><input type="text" id="bdDependencia" value="${esc(valores.dependencia || '')}"></div>
        <div class="campo"><label>Buque (nombre y matrícula)</label><input type="text" id="bdBuque" value="${esc(valores.buque || '')}"></div>
        <div class="fila-doble">
          <div class="campo"><label>Fecha</label><input type="text" id="bdFecha" value="${esc(valores.fecha || fechaHoy().replace(/-/g, '/'))}"></div>
          <div class="campo"><label>Tipo de inspección (ej: ID)</label><input type="text" id="bdTipoInsp" value="${esc(valores.tipoInsp || '')}"></div>
        </div>
        <div class="campo">
          <label>Deficiencias cargadas</label>
          <div id="bdListaDeficiencias" style="margin-bottom:10px;"></div>
          <div style="background:var(--gris-100); border-radius:var(--radio); padding:12px;">
            <div class="fila-doble">
              <div class="campo" style="margin-bottom:8px;"><label>Cantidad</label><select id="bdCantidad">${opcionesCantidadHtml()}</select></div>
              <div class="campo" style="margin-bottom:8px;"><label>Código</label>
                <select id="bdCodigo">${CODIGOS_DETENCION.map(cod => `<option value="${cod}">Cód. ${cod} — ${esc(descripcionCodigo(cod))}</option>`).join('')}</select>
              </div>
            </div>
            <button type="button" class="btn-secundario" id="bdBtnAgregar">+ Agregar deficiencia</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalInspeccion()">Cancelar</button>
        <button class="btn-primario" type="button" id="bdBtnGuardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function renderizarLista() {
    const cont = document.getElementById('bdListaDeficiencias');
    if (!lista.length) { cont.innerHTML = '<div style="font-size:12px; color:var(--gris-500);">Todavía no agregaste ninguna.</div>'; return; }
    cont.innerHTML = lista.map((d, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid var(--gris-300); border-radius:6px; padding:6px 10px; margin-bottom:6px; font-size:12px;">
        <span>Cód. ${esc(d.codigo)} (${String(d.cantidad).padStart(2, '0')})</span>
        <button type="button" data-idx="${i}" class="bdQuitar" style="background:none;border:none;color:var(--rojo);font-size:14px;">✕</button>
      </div>`).join('');
    cont.querySelectorAll('.bdQuitar').forEach(btn => {
      btn.addEventListener('click', () => { lista.splice(parseInt(btn.dataset.idx, 10), 1); renderizarLista(); });
    });
  }
  renderizarLista();

  document.getElementById('bdBtnAgregar').addEventListener('click', () => {
    lista.push({ cantidad: parseInt(document.getElementById('bdCantidad').value, 10), codigo: document.getElementById('bdCodigo').value });
    renderizarLista();
  });

  document.getElementById('bdBtnGuardar').addEventListener('click', () => {
    const datos = {
      dependencia: document.getElementById('bdDependencia').value.trim(),
      buque: document.getElementById('bdBuque').value.trim(),
      fecha: document.getElementById('bdFecha').value.trim(),
      tipoInsp: document.getElementById('bdTipoInsp').value.trim(),
      deficienciasLista: lista
    };
    cerrarModalInspeccion();
    onGuardar(datos);
  });
}

function uiAgregarBuqueDetencionTabla() {
  abrirFormularioBuqueDetencion('Agregar buque con detención', {}, (datos) => {
    D.buquesDetencion.push({ numero: D.buquesDetencion.length + 1, ...datos });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarBuqueDetencionTabla(indice) {
  const actual = D.buquesDetencion[indice];
  abrirFormularioBuqueDetencion('Editar buque con detención', actual, (datos) => {
    D.buquesDetencion[indice] = { ...actual, ...datos };
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarBuqueDetencionTabla(indice) {
  if (!confirm('¿Eliminar este registro?')) return;
  D.buquesDetencion.splice(indice, 1);
  D.buquesDetencion.forEach((b, i) => { b.numero = i + 1; });
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Inspecciones Técnicas (previstas) ----------
function camposInspeccionTecnica() {
  return [
    { id: 'especialidad', label: 'Especialidad (Casco, Máquinas, Electricidad...)' },
    { id: 'embarcacion', label: 'Embarcación / Empresa' },
    { id: 'requerimiento', label: 'Requerimiento' },
    { id: 'lugar', label: 'Lugar' },
    { id: 'inspector', label: 'Inspector / MOI' },
    ...camposFechasPrevistas(),
    ...camposExterior()
  ];
}

// ---------- Fechas "desde / hasta" (inspecciones técnicas y auditorías) ----------
const MESES_MINUSCULA = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function partesFechaISO(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { a: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) } : null;
}

/** 2026-10-20 → 20/10/2026 */
function fechaISOaCorta(iso) {
  const p = partesFechaISO(iso);
  return p ? `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.a}` : '';
}

/** "Del 20 al 30 de octubre", "Del 28 de octubre al 2 de noviembre", "20 de octubre". Vacío si no hay fecha. */
function textoRangoFechas(desdeISO, hastaISO) {
  const a = partesFechaISO(desdeISO);
  let b = partesFechaISO(hastaISO);
  if (!a && !b) return '';
  const hoyA = new Date().getFullYear();
  const sufijo = (p) => (p.a !== hoyA ? ` de ${p.a}` : '');
  if (!a) return `Hasta el ${b.d} de ${MESES_MINUSCULA[b.m - 1]}${sufijo(b)}`;
  if (!b || (b.a === a.a && b.m === a.m && b.d === a.d)) return `${a.d} de ${MESES_MINUSCULA[a.m - 1]}${sufijo(a)}`;
  if (a.a === b.a && a.m === b.m) return `Del ${a.d} al ${b.d} de ${MESES_MINUSCULA[b.m - 1]}${sufijo(b)}`;
  return `Del ${a.d} de ${MESES_MINUSCULA[a.m - 1]}${a.a !== b.a ? ` de ${a.a}` : ''} al ${b.d} de ${MESES_MINUSCULA[b.m - 1]}${sufijo(b)}`;
}

function camposFechasPrevistas() {
  return [
    { id: 'desde', label: 'Desde (fecha)', tipo: 'fecha' },
    { id: 'hasta', label: 'Hasta (fecha — dejar vacío si es un solo día)', tipo: 'fecha' }
  ];
}

/** Campos compartidos por Inspecciones Técnicas y Control de Gestión: en el extranjero y/o por vía aérea. */
function camposExterior() {
  const vuelos = ['extranjero', 'viaAerea'];
  return [
    { id: 'extranjero', label: '', tipo: 'checkbox', textoCheck: 'Es en el extranjero' },
    { id: 'viaAerea', label: '', tipo: 'checkbox', textoCheck: 'Se viaja por vía aérea (ej: destino en el sur del país)' },
    { id: 'disposicion', label: 'N.º de la disposición que autoriza la inspección', visibleSi: 'extranjero' },
    { id: 'salidaFechaHora', label: 'Salida — GFH (ej: 24/09 23:55)', visibleSi: vuelos },
    { id: 'salidaVuelo', label: 'Salida — N.º de vuelo', visibleSi: vuelos },
    { id: 'salidaDestino', label: 'Salida — Destino (aeropuerto)', visibleSi: vuelos },
    { id: 'regresoFechaHora', label: 'Retorno — GFH', visibleSi: vuelos },
    { id: 'regresoVuelo', label: 'Retorno — N.º de vuelo', visibleSi: vuelos },
    { id: 'regresoDestino', label: 'Retorno — Destino (aeropuerto)', visibleSi: vuelos }
  ];
}

/** Arma los datos de viaje a partir de lo cargado en el formulario. */
function construirExterior(datos) {
  const extranjero = datos.extranjero === 'si';
  const viaAerea = datos.viaAerea === 'si';
  const conVuelos = extranjero || viaAerea;
  return {
    extranjero, viaAerea,
    disposicion: extranjero ? (datos.disposicion || '') : '',
    salida: conVuelos ? { fechaHora: datos.salidaFechaHora || '', vuelo: datos.salidaVuelo || '', destino: datos.salidaDestino || '' } : {},
    regreso: conVuelos ? { fechaHora: datos.regresoFechaHora || '', vuelo: datos.regresoVuelo || '', destino: datos.regresoDestino || '' } : {}
  };
}

/** Inverso: valores para precargar el formulario al editar. */
function valoresExterior(actual) {
  const s = actual.salida || {}, r = actual.regreso || {};
  return {
    extranjero: actual.extranjero ? 'si' : 'no', viaAerea: actual.viaAerea ? 'si' : 'no', disposicion: actual.disposicion || '',
    salidaFechaHora: s.fechaHora || '', salidaVuelo: s.vuelo || '', salidaDestino: s.destino || '',
    regresoFechaHora: r.fechaHora || '', regresoVuelo: r.vuelo || '', regresoDestino: r.destino || ''
  };
}

function construirInspeccionTecnica(datos) {
  return {
    especialidad: datos.especialidad, embarcacion: datos.embarcacion, requerimiento: datos.requerimiento,
    lugar: datos.lugar, inspector: datos.inspector,
    desde: datos.desde || '', hasta: datos.hasta || '',
    ...construirExterior(datos)
  };
}

function uiAgregarInspeccionTecnica() {
  abrirModalFormulario('Agregar inspección técnica prevista', camposInspeccionTecnica(), {}, (datos) => {
    D.inspeccionesTecnicas.push(construirInspeccionTecnica(datos));
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarInspeccionTecnica(indice) {
  const actual = D.inspeccionesTecnicas[indice];
  const valoresIniciales = {
    especialidad: actual.especialidad, embarcacion: actual.embarcacion, requerimiento: actual.requerimiento,
    lugar: actual.lugar, inspector: actual.inspector,
    desde: actual.desde || '', hasta: actual.hasta || '',
    ...valoresExterior(actual)
  };
  abrirModalFormulario('Editar inspección técnica', camposInspeccionTecnica(), valoresIniciales, (datos) => {
    D.inspeccionesTecnicas[indice] = construirInspeccionTecnica(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarInspeccionTecnica(indice) {
  if (!confirm('¿Eliminar esta inspección técnica?')) return;
  D.inspeccionesTecnicas.splice(indice, 1);
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- División Control de Gestión ----------
function camposAuditoria() {
  return [
    { id: 'tipoAuditoria', label: 'Tipo de auditoría (ej: S.G.S.)' },
    { id: 'embarcacion', label: 'Embarcación / Empresa' },
    { id: 'alcance', label: 'Alcance (ej: Renovación)' },
    { id: 'lugar', label: 'Lugar' },
    { id: 'auditor', label: 'Auditor' },
    ...camposFechasPrevistas(),
    ...camposExterior()
  ];
}

function construirAuditoria(datos) {
  return {
    tipoAuditoria: datos.tipoAuditoria, embarcacion: datos.embarcacion, alcance: datos.alcance,
    lugar: datos.lugar, auditor: datos.auditor,
    desde: datos.desde || '', hasta: datos.hasta || '',
    ...construirExterior(datos)
  };
}

function uiAgregarAuditoria() {
  abrirModalFormulario('Agregar auditoría', camposAuditoria(), {}, (datos) => {
    D.divisionControlGestion.push(construirAuditoria(datos));
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarAuditoria(indice) {
  const actual = D.divisionControlGestion[indice];
  abrirModalFormulario('Editar auditoría', camposAuditoria(), { ...actual, ...valoresExterior(actual) }, (datos) => {
    D.divisionControlGestion[indice] = construirAuditoria(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarAuditoria(indice) {
  if (!confirm('¿Eliminar esta auditoría?')) return;
  D.divisionControlGestion.splice(indice, 1);
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Licencias ----------
const MAPA_CATEGORIA_LICENCIA = {
  anual: 'anuales', medica: 'medicas', tareasAdecuadas: 'tareasAdecuadas',
  extraordinaria: 'extraordinaria', comisiones: 'comisiones', noComputable: 'noComputables', personales: 'personales'
};

const OPCIONES_CATEGORIA_LICENCIA = [
  { valor: 'anual', etiqueta: 'Licencia Anual' }, { valor: 'medica', etiqueta: 'Licencia Médica' },
  { valor: 'tareasAdecuadas', etiqueta: 'Tareas Adecuadas' }, { valor: 'extraordinaria', etiqueta: 'Licencia Extraordinaria' },
  { valor: 'comisiones', etiqueta: 'Comisiones' }, { valor: 'noComputable', etiqueta: 'Licencia No Computable' },
  { valor: 'personales', etiqueta: 'Asuntos Personales' }
];

function camposLicencia() {
  return [
    { id: 'categoria', label: 'Categoría', tipo: 'select', opciones: OPCIONES_CATEGORIA_LICENCIA },
    {
      id: 'jerarquia', label: 'Jerarquía (código de 6 letras: Jerarquía + Cuerpo + Escalafón — ej. PRCGGE, CICXMY)',
      ayudaHtml: '<button type="button" class="btn-secundario" style="padding:2px 8px; font-size:11.5px; margin-top:4px;" onclick="abrirAyudaEscalafones()">¿Qué sigla de cuerpo/escalafón uso?</button>'
    },
    { id: 'nombre', label: 'Apellido y Nombre' },
    { id: 'oficina', label: 'Oficina (opcional)' },
    { id: 'diagnostico', label: 'Diagnóstico (solo si es Licencia Médica)', tipo: 'textarea' },
    { id: 'inicia', label: 'Inicia' },
    { id: 'vence', label: 'Vence' }
  ];
}

/** Ayuda-memoria de siglas de Cuerpo y Escalafón (Jerarquía no hace falta, ya se sabe de memoria). */
function abrirAyudaEscalafones() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalAyudaEscalafones';
  const filaTabla = ([sigla, nombre]) => `<tr><td style="font-weight:600; padding:3px 10px 3px 0;">${esc(sigla)}</td><td style="padding:3px 0;">${esc(nombre)}</td></tr>`;
  modal.innerHTML = `
    <div class="modal-caja">
      <div class="modal-header">
        <h3>Siglas de Cuerpo y Escalafón</h3>
        <button type="button" onclick="document.getElementById('modalAyudaEscalafones').remove()">✕</button>
      </div>
      <div class="modal-lista" style="font-size:13px;">
        <h4 style="margin:0 0 6px 0;">Personal Superior</h4>
        <p style="margin:0 0 6px 0; color:var(--gris-500);">Cuerpo:</p>
        <table style="margin-bottom:10px;">${AYUDA_CUERPO_SUPERIOR.map(filaTabla).join('')}</table>
        <p style="margin:0 0 6px 0; color:var(--gris-500);">Escalafón:</p>
        <table style="margin-bottom:14px;">${AYUDA_ESCALAFON_SUPERIOR.map(filaTabla).join('')}</table>
        <h4 style="margin:0 0 6px 0;">Personal Subalterno</h4>
        <p style="margin:0 0 6px 0; color:var(--gris-500);">Cuerpo:</p>
        <table style="margin-bottom:10px;">${AYUDA_CUERPO_SUBALTERNO.map(filaTabla).join('')}</table>
        <p style="margin:0 0 6px 0; color:var(--gris-500);">Escalafón:</p>
        <table>${AYUDA_ESCALAFON_SUBALTERNO.map(filaTabla).join('')}</table>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="document.getElementById('modalAyudaEscalafones').remove()">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function uiAgregarLicencia() {
  abrirModalFormulario('Agregar licencia', camposLicencia(), {}, (datos) => {
    const clave = MAPA_CATEGORIA_LICENCIA[datos.categoria];
    D.licencias[clave].push({
      jerarquia: datos.jerarquia, nombre: datos.nombre, oficina: datos.oficina, inicia: datos.inicia, vence: datos.vence,
      diagnostico: datos.categoria === 'medica' ? datos.diagnostico : ''
    });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarLicencia(claveActual, indice) {
  const actual = D.licencias[claveActual][indice];
  const categoriaActual = Object.keys(MAPA_CATEGORIA_LICENCIA).find(k => MAPA_CATEGORIA_LICENCIA[k] === claveActual);
  abrirModalFormulario('Editar licencia', camposLicencia(), { ...actual, categoria: categoriaActual }, (datos) => {
    D.licencias[claveActual].splice(indice, 1);
    const claveNueva = MAPA_CATEGORIA_LICENCIA[datos.categoria];
    D.licencias[claveNueva].push({
      jerarquia: datos.jerarquia, nombre: datos.nombre, oficina: datos.oficina, inicia: datos.inicia, vence: datos.vence,
      diagnostico: datos.categoria === 'medica' ? datos.diagnostico : ''
    });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarLicencia(clave, indice) {
  if (!confirm('¿Eliminar esta licencia?')) return;
  D.licencias[clave].splice(indice, 1);
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Precargas (licencias e inspecciones técnicas previstas) ----------
// Se cargan de a poco, con anticipación, y recién al "Confirmar" pasan al parte real
// (tabla, contadores, PDF). Mientras tanto viven aparte en D.precargas.
function fechaDesdeTexto(t) {
  const m = String(t || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10)) : null;
}

function licenciaDesdePrecarga(p) {
  return { jerarquia: p.jerarquia, nombre: p.nombre, oficina: p.oficina, inicia: p.inicia, vence: p.vence,
    diagnostico: p.categoria === 'medica' ? (p.diagnostico || '') : '' };
}

const CONFIG_PRECARGA = {
  licencias: {
    titulo: 'licencia',
    campos: () => camposLicencia(),
    construir: (datos) => ({ categoria: datos.categoria, jerarquia: datos.jerarquia, nombre: datos.nombre, oficina: datos.oficina,
      diagnostico: datos.diagnostico, inicia: datos.inicia, vence: datos.vence }),
    valores: (p) => ({ ...p }),
    columnas: ['Categoría', 'Jerarquía', 'Apellido y Nombre', 'Inicia', 'Vence'],
    fila: (p) => [(OPCIONES_CATEGORIA_LICENCIA.find(o => o.valor === p.categoria) || {}).etiqueta || '', p.jerarquia, p.nombre + (p.oficina ? ` (${p.oficina})` : ''), p.inicia, p.vence],
    confirmar: (p) => { const clave = MAPA_CATEGORIA_LICENCIA[p.categoria]; if (!D.licencias[clave]) D.licencias[clave] = []; D.licencias[clave].push(licenciaDesdePrecarga(p)); },
    corresponde: (p) => { const f = fechaDesdeTexto(p.inicia); const h = new Date(); h.setHours(0, 0, 0, 0); return !!f && f <= h; }
  },
  inspeccionesTecnicas: {
    titulo: 'inspección técnica prevista',
    campos: () => camposInspeccionTecnica(),
    construir: (datos) => construirInspeccionTecnica(datos),
    valores: (p) => ({ especialidad: p.especialidad, embarcacion: p.embarcacion, requerimiento: p.requerimiento, lugar: p.lugar, inspector: p.inspector, ...valoresExterior(p) }),
    columnas: ['Especialidad', 'Embarcación/Empresa', 'Requerimiento', 'Lugar', 'Inspector/MOI', 'Desde', 'Hasta'],
    fila: (p) => [p.especialidad, p.embarcacion, p.requerimiento, p.lugar, p.inspector, fechaISOaCorta(p.desde), fechaISOaCorta(p.hasta)],
    confirmar: (p) => { D.inspeccionesTecnicas.push(p); },
    corresponde: (p) => fechaPrevistaLlego(p.desde)
  },
  divisionControlGestion: {
    titulo: 'auditoría',
    campos: () => camposAuditoria(),
    construir: (datos) => construirAuditoria(datos),
    valores: (p) => ({ ...p, ...valoresExterior(p) }),
    columnas: ['Tipo de auditoría', 'Embarcación/Empresa', 'Alcance', 'Lugar', 'Auditor', 'Desde', 'Hasta'],
    fila: (p) => [p.tipoAuditoria, p.embarcacion, p.alcance, p.lugar, p.auditor, fechaISOaCorta(p.desde), fechaISOaCorta(p.hasta)],
    confirmar: (p) => { D.divisionControlGestion.push(p); },
    corresponde: (p) => fechaPrevistaLlego(p.desde)
  }
};

/** ¿La fecha "desde" (AAAA-MM-DD) es hoy o ya pasó? Sirve para marcar "Corresponde" en las precargas. */
function fechaPrevistaLlego(iso) {
  const p = partesFechaISO(iso);
  if (!p) return false;
  const h = new Date(); h.setHours(0, 0, 0, 0);
  return new Date(p.a, p.m - 1, p.d) <= h;
}

function listaPrecargas(tipo) {
  if (!D.precargas) D.precargas = {};
  if (!Array.isArray(D.precargas[tipo])) D.precargas[tipo] = [];
  return D.precargas[tipo];
}

function precargasHtml(tipo) {
  const lista = listaPrecargas(tipo);
  if (!lista.length) return '';
  const cfg = CONFIG_PRECARGA[tipo];
  const editable = !SOLO_LECTURA_ACTUAL;
  let html = `<div class="tarjeta" style="background:#fff8e6; border:1px dashed #d9a21b; margin-bottom:14px;">
    <h2>Precargadas — pendientes de confirmar <span class="contador">${lista.length}</span></h2>
    <p style="font-size:11.5px; color:var(--gris-700); margin:0 0 8px;">Solo las ves vos con tu usuario. No figuran en el parte, ni en el PDF, ni en los contadores, y el resto del personal no las ve, hasta que las confirmes.</p>
    <table class="tabla-datos"><thead><tr>${cfg.columnas.map(c => `<th>${esc(c)}</th>`).join('')}${editable ? '<th></th>' : ''}</tr></thead><tbody>`;
  lista.forEach((p, i) => {
    const celdas = cfg.fila(p).map(c => `<td>${esc(c)}</td>`).join('');
    html += `<tr>${celdas}${editable ? `<td style="display:flex; gap:4px; flex-wrap:wrap;">
      ${cfg.corresponde(p) ? '<span class="tag averia" title="La fecha de inicio ya llegó">Corresponde</span>' : ''}
      <button type="button" class="btn-primario" style="padding:2px 8px;" onclick="confirmarPrecarga('${tipo}',${i})">Confirmar</button>
      <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="uiEditarPrecarga('${tipo}',${i})">Editar</button>
      <button type="button" class="btn-secundario" style="padding:2px 8px;" onclick="eliminarPrecarga('${tipo}',${i})">✕</button>
    </td>` : ''}</tr>`;
  });
  html += `</tbody></table>`;
  if (editable) html += `<button type="button" class="btn-primario" style="margin-top:10px;" onclick="confirmarTodasPrecargas('${tipo}')">Confirmar todas (${lista.length})</button>`;
  return html + `</div>`;
}

function uiPrecargar(tipo) {
  const cfg = CONFIG_PRECARGA[tipo];
  abrirModalFormulario(`Precargar ${cfg.titulo}`, cfg.campos(), {}, (datos) => {
    listaPrecargas(tipo).push(cfg.construir(datos));
    persistirPrecargas();
    refrescarPestanaActual();
  });
}

function uiEditarPrecarga(tipo, indice) {
  const cfg = CONFIG_PRECARGA[tipo];
  const actual = listaPrecargas(tipo)[indice];
  abrirModalFormulario(`Editar precarga — ${cfg.titulo}`, cfg.campos(), cfg.valores(actual), (datos) => {
    listaPrecargas(tipo)[indice] = cfg.construir(datos);
    persistirPrecargas();
    refrescarPestanaActual();
  });
}

function eliminarPrecarga(tipo, indice) {
  if (!confirm('¿Eliminar esta precarga?')) return;
  listaPrecargas(tipo).splice(indice, 1);
  persistirPrecargas();
  refrescarPestanaActual();
}

function confirmarPrecarga(tipo, indice) {
  const lista = listaPrecargas(tipo);
  const p = lista[indice];
  if (!p) return;
  CONFIG_PRECARGA[tipo].confirmar(p);
  lista.splice(indice, 1);
  persistirPrecargas();
  persistirDatosGuardia();
  refrescarPestanaActual();
}

function confirmarTodasPrecargas(tipo) {
  const lista = listaPrecargas(tipo);
  if (!lista.length) return;
  if (!confirm(`¿Confirmar las ${lista.length} precargadas? Pasan al parte de hoy.`)) return;
  lista.forEach(p => CONFIG_PRECARGA[tipo].confirmar(p));
  D.precargas[tipo] = [];
  persistirPrecargas();
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Cursos ----------
function camposCurso() {
  return [
    { id: 'personal', label: 'Personal designado' },
    { id: 'nombreCurso', label: 'Nombre del curso' },
    { id: 'descripcion', label: 'Descripción (opcional)', tipo: 'textarea' },
    { id: 'fechaInicio', label: 'Fecha de inicio' },
    { id: 'fechaFin', label: 'Fecha de finalización' },
    { id: 'modalidad', label: 'Modalidad', tipo: 'select', opciones: [{ valor: 'virtual', etiqueta: 'Virtual' }, { valor: 'presencial', etiqueta: 'Presencial' }] },
    { id: 'lugar', label: 'Lugar de realización (si es presencial)' }
  ];
}

function construirCurso(datos) {
  return {
    personal: datos.personal, nombreCurso: datos.nombreCurso, descripcion: datos.descripcion,
    fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin, modalidad: datos.modalidad,
    lugar: datos.modalidad === 'presencial' ? datos.lugar : ''
  };
}

function uiAgregarCurso() {
  abrirModalFormulario('Agregar nuevo curso', camposCurso(), {}, (datos) => {
    D.cursos.push(construirCurso(datos));
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarCurso(indice) {
  const actual = D.cursos[indice];
  const valoresIniciales = { ...actual, modalidad: actual.modalidad || 'virtual' };
  abrirModalFormulario('Editar curso', camposCurso(), valoresIniciales, (datos) => {
    D.cursos[indice] = construirCurso(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarCurso(indice) {
  if (!confirm('¿Eliminar este curso?')) return;
  D.cursos.splice(indice, 1);
  persistirDatosGuardia();
  refrescarPestanaActual();
}

// ---------- Resumen PSC (editable) ----------
function uiEditarResumenExtraordinarias() {
  const ie = D.inspeccionesExtraordinarias;
  const man = ie.resumenManual || {};
  const auto = calcularResumenCategorias();
  const campoCat = (id, label) => ({ id, label: `${label} (hoy) — vacío = automático (hoy da ${auto[id]})`, default: man[id] === undefined || man[id] === null ? '' : String(man[id]) });
  abrirModalFormulario('Editar resumen de inspecciones', [
    campoCat('pesquerosOtros', 'Pesqueros/Otros'),
    campoCat('porAveria', 'Por avería'),
    campoCat('cargaPasaje', 'Carga/Pasaje'),
    campoCat('convoyesExtr', 'Convoyes/Buques Extr.'),
    campoCat('convoyArgentino', 'Convoy B/ARG'),
    { id: 'anualArg', label: 'Acumulado anual bandera argentina — previo a hoy', default: String(ie.argentina.acumuladoAnualPrevio || 0) },
    { id: 'anualExt', label: 'Acumulado anual bandera extranjera — previo a hoy', default: String(ie.extranjera.acumuladoAnualPrevio || 0) }
  ], {}, (datos) => {
    const nuevo = {};
    ['pesquerosOtros', 'porAveria', 'cargaPasaje', 'convoyesExtr', 'convoyArgentino'].forEach(k => {
      if (String(datos[k]).trim() !== '') nuevo[k] = parseInt(datos[k], 10) || 0;
    });
    ie.resumenManual = nuevo;
    ie.argentina.acumuladoAnualPrevio = parseInt(datos.anualArg, 10) || 0;
    ie.extranjera.acumuladoAnualPrevio = parseInt(datos.anualExt, 10) || 0;
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarResumenPSC() {
  const rp = D.estadoRectorPuerto.resumen;
  abrirModalFormulario('Editar resumen PSC', [
    { id: 'buquesIngresados', label: 'Buques extranjeros ingresados (hoy)', default: String(rp.buquesIngresados) },
    { id: 'factiblesDiario', label: 'Factibles de ser inspeccionados (hoy)', default: String(rp.factiblesDiario) },
    { id: 'inspeccionadosManual', label: 'Corrección manual de "Inspeccionados (hoy)" (dejar vacío para que se sume solo, a partir de las inspecciones cargadas)', default: String(rp.inspeccionadosManual !== undefined && rp.inspeccionadosManual !== null ? rp.inspeccionadosManual : '') },
    { id: 'factiblesAnualPrevio', label: 'Acumulado anual de factibles — previo a hoy (se carga una sola vez al implementar, y después no hace falta tocarlo)', default: String(rp.factiblesAnualPrevio || 0) },
    { id: 'inspeccionadosAnualPrevio', label: 'Acumulado anual de inspeccionados — previo a hoy (ídem, una sola vez)', default: String(rp.inspeccionadosAnualPrevio || 0) }
  ], {}, (datos) => {
    D.estadoRectorPuerto.resumen = {
      buquesIngresados: parseInt(datos.buquesIngresados, 10) || 0,
      factiblesDiario: parseInt(datos.factiblesDiario, 10) || 0,
      inspeccionadosManual: datos.inspeccionadosManual.trim() === '' ? null : (parseInt(datos.inspeccionadosManual, 10) || 0),
      factiblesAnualPrevio: parseInt(datos.factiblesAnualPrevio, 10) || 0,
      inspeccionadosAnualPrevio: parseInt(datos.inspeccionadosAnualPrevio, 10) || 0
    };
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

// ---------- Guardia (Saliente / Entrante) ----------
function uiEditarGuardia() {
  const s = D.guardia.saliente;
  const e = D.guardia.entrante;
  const opcionesJefes = NOMINA_JEFES_SERVICIO.map(n => ({ valor: n, etiqueta: n }));
  const opcionesAyudantes = NOMINA_AYUDANTES_GUARDIA.map(n => ({ valor: n, etiqueta: n }));
  abrirModalFormulario('Editar Guardia', [
    { id: 'salienteJefe', label: 'Saliente — Jefe de Servicio', tipo: 'select', opciones: opcionesJefes, default: s[0] ? s[0].nombre : '' },
    { id: 'salienteAyte', label: 'Saliente — Ayudante de Guardia', tipo: 'select', opciones: opcionesAyudantes, default: s[1] ? s[1].nombre : '' },
    { id: 'entranteJefe', label: 'Entrante — Jefe de Servicio', tipo: 'select', opciones: opcionesJefes, default: e[0] ? e[0].nombre : '' },
    { id: 'entranteAyte', label: 'Entrante — Ayudante de Guardia', tipo: 'select', opciones: opcionesAyudantes, default: e[1] ? e[1].nombre : '' }
  ], {}, (datos) => {
    D.guardia = {
      saliente: [
        { rol: 'Jefe de Servicio', nombre: datos.salienteJefe },
        { rol: 'Ayudante de Guardia', nombre: datos.salienteAyte }
      ],
      entrante: [
        { rol: 'Jefe de Servicio', nombre: datos.entranteJefe },
        { rol: 'Ayudante de Guardia', nombre: datos.entranteAyte }
      ]
    };
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}
