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
const SECCIONES_PERSISTIDAS = ['inspeccionesExtraordinarias', 'estadoRectorPuerto', 'casosMAS', 'casosSAR', 'buquesDetencionMapa', 'otros', 'oficinas', 'buquesDetencion', 'inspeccionesTecnicas', 'divisionControlGestion', 'licencias', 'cursos'];
const COLECCION_PARTE_DIARIO = 'parteDiario';

function persistirDatosGuardia() {
  // Caché local instantáneo, siempre — sirve de resguardo si por
  // un instante se corta la conexión, y es lo único que se usa en
  // modo demo.
  const paquete = {};
  SECCIONES_PERSISTIDAS.forEach(clave => { paquete[clave] = DATOS_EJEMPLO[clave]; });
  localStorage.setItem(CLAVE_DATOS_GUARDIA, JSON.stringify(paquete));

  if (DEMO_MODE) return;

  SECCIONES_PERSISTIDAS.forEach(clave => {
    db.collection(COLECCION_PARTE_DIARIO).doc(clave).set({ valor: DATOS_EJEMPLO[clave] })
      .catch(err => console.error(`No se pudo guardar "${clave}" en Firestore:`, err));
  });
}

/** Primera carga: trae lo que ya haya guardado (Firestore o localStorage según el modo). */
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

  activarEscuchaEnVivo();
}

/** Escucha en vivo: si otro usuario carga algo desde otra computadora, se refleja acá solo. */
function activarEscuchaEnVivo() {
  SECCIONES_PERSISTIDAS.forEach(clave => {
    db.collection(COLECCION_PARTE_DIARIO).doc(clave).onSnapshot(doc => {
      if (!doc.exists || doc.data().valor === undefined) return;
      DATOS_EJEMPLO[clave] = doc.data().valor;
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
    } else {
      controlHtml = `<input type="text" id="campo_${c.id}" value="${esc(valorActual)}">`;
    }
    div.innerHTML = `<label>${esc(c.label)}</label>${controlHtml}`;
    contenedor.appendChild(div);
  });

  document.getElementById('btnGuardarFormulario').addEventListener('click', () => {
    const resultado = {};
    campos.forEach(c => { resultado[c.id] = document.getElementById(`campo_${c.id}`).value.trim(); });
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
    etiquetasTipo: { inicial: 'Inicial (II)', detallada: 'Más Detallada (ID)', seguimiento: 'Seguimiento (IS)' },
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
    etiquetasTipo: { inicial: 'Inicial (II)', detallada: 'Más Detallada (ID)', seguimiento: 'Seguimiento (IS)' },
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
  return [...base, ...sar,
    { id: 'posicion', label: 'Posición (lat/lon o referencia)' },
    { id: 'novedad', label: 'Novedad', tipo: 'textarea' },
    { id: 'caracteristicas', label: 'Características', tipo: 'textarea' },
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

// ---------- Buques con Detención (tabla del parte) ----------
function uiAgregarBuqueDetencionTabla() {
  abrirModalFormulario('Agregar buque con detención', [
    { id: 'dependencia', label: 'Dependencia' },
    { id: 'buque', label: 'Buque (nombre y matrícula)' },
    { id: 'fecha', label: 'Fecha', default: fechaHoy().replace(/-/g, '/') },
    { id: 'tipoInsp', label: 'Tipo de inspección (ej: ID)' },
    { id: 'deficiencias', label: 'Deficiencias (ej: Cód. 30 (02) / Cód. 17 (02))' }
  ], {}, (datos) => {
    D.buquesDetencion.push({
      numero: D.buquesDetencion.length + 1,
      dependencia: datos.dependencia, buque: datos.buque, fecha: datos.fecha,
      tipoInsp: datos.tipoInsp, deficiencias: datos.deficiencias
    });
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
function uiAgregarInspeccionTecnica() {
  abrirModalFormulario('Agregar inspección técnica prevista', [
    { id: 'especialidad', label: 'Especialidad (Casco, Máquinas, Electricidad...)' },
    { id: 'embarcacion', label: 'Embarcación / Empresa' },
    { id: 'requerimiento', label: 'Requerimiento' },
    { id: 'lugar', label: 'Lugar' },
    { id: 'inspector', label: 'Inspector / MOI' },
    { id: 'extranjero', label: '¿Es en el extranjero?', tipo: 'select', opciones: [{ valor: 'no', etiqueta: 'No' }, { valor: 'si', etiqueta: 'Sí' }] },
    { id: 'salidaFechaHora', label: 'Salida — Fecha y hora (si es en el extranjero)' },
    { id: 'salidaVuelo', label: 'Salida — N.º de vuelo' },
    { id: 'salidaDestino', label: 'Salida — Destino' },
    { id: 'regresoFechaHora', label: 'Regreso — Fecha y hora' },
    { id: 'regresoVuelo', label: 'Regreso — N.º de vuelo' },
    { id: 'regresoDestino', label: 'Regreso — Destino' }
  ], {}, (datos) => {
    const esExtranjero = datos.extranjero === 'si';
    D.inspeccionesTecnicas.push({
      especialidad: datos.especialidad, embarcacion: datos.embarcacion, requerimiento: datos.requerimiento,
      lugar: datos.lugar, inspector: datos.inspector, extranjero: esExtranjero,
      salida: esExtranjero ? { fechaHora: datos.salidaFechaHora, vuelo: datos.salidaVuelo, destino: datos.salidaDestino } : {},
      regreso: esExtranjero ? { fechaHora: datos.regresoFechaHora, vuelo: datos.regresoVuelo, destino: datos.regresoDestino } : {}
    });
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
function uiAgregarAuditoria() {
  abrirModalFormulario('Agregar auditoría', [
    { id: 'tipoAuditoria', label: 'Tipo de auditoría (ej: S.G.S.)' },
    { id: 'embarcacion', label: 'Embarcación / Empresa' },
    { id: 'alcance', label: 'Alcance (ej: Renovación)' },
    { id: 'lugar', label: 'Lugar' },
    { id: 'auditor', label: 'Auditor' }
  ], {}, (datos) => {
    D.divisionControlGestion.push(datos);
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
  extraordinaria: 'extraordinaria', comisiones: 'comisiones', noComputable: 'noComputables'
};

function uiAgregarLicencia() {
  abrirModalFormulario('Agregar licencia', [
    { id: 'categoria', label: 'Categoría', tipo: 'select', opciones: [
      { valor: 'anual', etiqueta: 'Licencia Anual' }, { valor: 'medica', etiqueta: 'Licencia Médica' },
      { valor: 'tareasAdecuadas', etiqueta: 'Tareas Adecuadas' }, { valor: 'extraordinaria', etiqueta: 'Licencia Extraordinaria' },
      { valor: 'comisiones', etiqueta: 'Comisiones' }, { valor: 'noComputable', etiqueta: 'Licencia No Computable' }
    ]},
    { id: 'jerarquia', label: 'Jerarquía' },
    { id: 'nombre', label: 'Apellido y Nombre' },
    { id: 'inicia', label: 'Inicia' },
    { id: 'vence', label: 'Vence' }
  ], {}, (datos) => {
    const clave = MAPA_CATEGORIA_LICENCIA[datos.categoria];
    D.licencias[clave].push({ jerarquia: datos.jerarquia, nombre: datos.nombre, inicia: datos.inicia, vence: datos.vence });
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

// ---------- Cursos ----------
function uiAgregarCurso() {
  abrirModalFormulario('Agregar nuevo curso', [
    { id: 'personal', label: 'Personal designado' },
    { id: 'nombreCurso', label: 'Nombre del curso' },
    { id: 'descripcion', label: 'Descripción (opcional)', tipo: 'textarea' },
    { id: 'fechaInicio', label: 'Fecha de inicio' },
    { id: 'fechaFin', label: 'Fecha de finalización' },
    { id: 'modalidad', label: 'Modalidad', tipo: 'select', opciones: [{ valor: 'virtual', etiqueta: 'Virtual' }, { valor: 'presencial', etiqueta: 'Presencial' }] },
    { id: 'lugar', label: 'Lugar de realización (si es presencial)' }
  ], {}, (datos) => {
    D.cursos.push({
      personal: datos.personal, nombreCurso: datos.nombreCurso, descripcion: datos.descripcion,
      fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin, modalidad: datos.modalidad,
      lugar: datos.modalidad === 'presencial' ? datos.lugar : ''
    });
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

// ---------- Oficinas ----------
function uiAgregarOficinaTexto() {
  abrirModalFormulario('Agregar bloque de texto — Oficinas', [
    { id: 'oficina', label: 'Oficina' },
    { id: 'titulo', label: 'Título' },
    { id: 'contenido', label: 'Contenido', tipo: 'textarea' }
  ], {}, (datos) => {
    const of = datos.oficina || 'SIN_OFICINA';
    if (!D.oficinas.porOficina[of]) D.oficinas.porOficina[of] = [];
    D.oficinas.porOficina[of].push({ tipoBloque: 'texto', titulo: datos.titulo, contenido: datos.contenido });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiAgregarOficinaTabla() {
  abrirModalFormulario('Agregar tabla — Oficinas', [
    { id: 'oficina', label: 'Oficina' },
    { id: 'titulo', label: 'Título' },
    { id: 'columnas', label: 'Columnas (separadas por coma)', default: 'Concepto, Detalle, Fecha' }
  ], {}, (datos) => {
    const of = datos.oficina || 'SIN_OFICINA';
    const columnas = (datos.columnas || '').split(',').map(c => c.trim()).filter(Boolean);
    if (!D.oficinas.porOficina[of]) D.oficinas.porOficina[of] = [];
    D.oficinas.porOficina[of].push({ tipoBloque: 'tabla', titulo: datos.titulo, columnas, filas: [columnas.map(() => '')] });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarOficina(oficina, indice) {
  if (!confirm('¿Eliminar este bloque?')) return;
  D.oficinas.porOficina[oficina].splice(indice, 1);
  if (!D.oficinas.porOficina[oficina].length) delete D.oficinas.porOficina[oficina];
  persistirDatosGuardia();
  refrescarPestanaActual();
}
