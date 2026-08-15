// ============================================================
// DATOS DE GUARDIA — carga directa en la plataforma
// ============================================================
// Guarda en el navegador (localStorage) lo que se va cargando en
// Inspecciones Extraordinarias, Estado Rector de Puerto, Casos MAS
// y Casos SAR, así no se pierde al recargar la página o cerrar el
// navegador. Es un reemplazo temporal de Firestore: persiste en
// ESTA computadora/navegador, no se sincroniza todavía entre
// distintos usuarios — eso llega cuando conectemos Firestore.
// ============================================================

const CLAVE_DATOS_GUARDIA = 'novedades_dpsn_datos_guardia';
const SECCIONES_PERSISTIDAS = ['inspeccionesExtraordinarias', 'estadoRectorPuerto', 'casosMAS', 'casosSAR', 'buquesDetencionMapa'];

function persistirDatosGuardia() {
  const paquete = {};
  SECCIONES_PERSISTIDAS.forEach(clave => { paquete[clave] = DATOS_EJEMPLO[clave]; });
  localStorage.setItem(CLAVE_DATOS_GUARDIA, JSON.stringify(paquete));
}

function hidratarDatosGuardia() {
  const raw = localStorage.getItem(CLAVE_DATOS_GUARDIA);
  if (raw) {
    try {
      const guardado = JSON.parse(raw);
      SECCIONES_PERSISTIDAS.forEach(clave => {
        if (guardado[clave]) DATOS_EJEMPLO[clave] = guardado[clave];
      });
    } catch (e) { console.error('No se pudo leer lo guardado localmente:', e); }
  } else {
    persistirDatosGuardia(); // primera vez: el punto de partida son los datos de ejemplo
  }
}
hidratarDatosGuardia();

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

function camposComunesBuque(prefijo) {
  return [
    { id: 'dependencia', label: 'Dependencia (sigla)' },
    { id: 'buqueTipo', label: 'Tipo de buque (L/M, B/P, B/M, B/T...)' },
    { id: 'buqueNombre', label: 'Nombre del buque' },
    { id: 'matricula', label: 'Matrícula / IMO / MMSI' },
    { id: 'bandera', label: 'Bandera' },
    { id: 'codigosDeficiencia', label: 'Códigos de deficiencia (separados por coma, vacío si no hay)' },
    { id: 'fechaInspMasDetallada', label: 'Fecha de la Inspección Más Detallada (solo si es Seguimiento)' },
    { id: 'nota', label: 'Nota', tipo: 'textarea' }
  ];
}

function construirDeficiencias(textoCodigos) {
  return (textoCodigos || '').split(',').map(c => c.trim()).filter(Boolean)
    .map(codigo => ({ codigo, descripcion: descripcionCodigo(codigo) }));
}

// ---------- Inspecciones Extraordinarias ----------
function uiAgregarInspeccionExtraordinaria(bandera) {
  abrirModalFormulario('Agregar inspección extraordinaria', [
    { id: 'tipo', label: 'Tipo de inspección', tipo: 'select', opciones: [
      { valor: 'inicial', etiqueta: 'Inicial' }, { valor: 'detallada', etiqueta: 'Más detallada' }, { valor: 'seguimiento', etiqueta: 'Seguimiento' }
    ]},
    { id: 'categoria', label: 'Categoría (para el resumen)', tipo: 'select', opciones: [
      { valor: 'pesquerosOtros', etiqueta: 'Pesqueros/Otros' }, { valor: 'porAveria', etiqueta: 'Por avería' },
      { valor: 'cargaPasaje', etiqueta: 'Buque de Carga/Pasaje' }, { valor: 'convoyesExtr', etiqueta: 'Convoyes/Buques Extr.' },
      { valor: 'convoyArgentino', etiqueta: 'Convoy B/ARG' }
    ]},
    ...camposComunesBuque(),
    { id: 'asunto', label: 'Asunto (si corresponde)', tipo: 'textarea' }
  ], {}, (datos) => {
    const grupo = bandera === 'argentina' ? D.inspeccionesExtraordinarias.argentina : D.inspeccionesExtraordinarias.extranjera;
    const dep = datos.dependencia || 'SIN_DEP';
    if (!grupo.porDependencia[dep]) grupo.porDependencia[dep] = [];
    grupo.porDependencia[dep].push({
      tipo: datos.tipo, categoria: datos.categoria,
      buque: { tipo: datos.buqueTipo, nombre: datos.buqueNombre, matricula: datos.matricula, bandera: datos.bandera },
      deficiencias: construirDeficiencias(datos.codigosDeficiencia),
      fechaInspMasDetallada: datos.fechaInspMasDetallada,
      asunto: datos.asunto,
      nota: datos.nota
    });
    persistirDatosGuardia();
    refrescarPestanaActual();
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
  abrirModalFormulario('Agregar inspección PSC', [
    { id: 'tipo', label: 'Tipo de inspección', tipo: 'select', opciones: [
      { valor: 'inicial', etiqueta: 'IISD — Inicial sin deficiencias' },
      { valor: 'detallada', etiqueta: 'IICD — Inicial con deficiencia' },
      { valor: 'seguimiento', etiqueta: 'IS — Seguimiento' }
    ]},
    ...camposComunesBuque()
  ], {}, (datos) => {
    const dep = datos.dependencia || 'SIN_DEP';
    if (!D.estadoRectorPuerto.porDependencia[dep]) D.estadoRectorPuerto.porDependencia[dep] = [];
    D.estadoRectorPuerto.porDependencia[dep].push({
      tipo: datos.tipo,
      buque: { tipo: datos.buqueTipo, nombre: datos.buqueNombre, matricula: datos.matricula, bandera: datos.bandera },
      deficiencias: construirDeficiencias(datos.codigosDeficiencia),
      fechaInspMasDetallada: datos.fechaInspMasDetallada,
      nota: datos.nota
    });
    persistirDatosGuardia();
    refrescarPestanaActual();
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
    { id: 'asunto', label: 'Asunto', tipo: 'textarea' },
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
