// ============================================================
// OFICINAS — Novedades DPSN
// ============================================================
// Espacios fijos por oficina (no bloques libres): Documentación
// (3 tablas: Trámites en Análisis, Certificados de Arqueo,
// Girados a TNAV), Control de Gestión y División Navegación
// (tabla simple Fecha/GDE/Expediente), y 2 espacios "Sin Definir"
// para cuando definan qué necesitan cargar ahí.
// ============================================================

function uiAgregarFilaSimple(clave, titulo) {
  abrirModalFormulario(titulo, [
    { id: 'fecha', label: 'Fecha', default: fechaHoy().replace(/-/g, '/') },
    { id: 'gde', label: 'N.º GDE' },
    { id: 'expediente', label: 'Detalle del trámite', tipo: 'textarea' }
  ], {}, (datos) => {
    D.oficinas[clave].filas.push(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarFilaSimple(clave, indice, titulo) {
  const actual = D.oficinas[clave].filas[indice];
  abrirModalFormulario(titulo, [
    { id: 'fecha', label: 'Fecha', default: fechaHoy().replace(/-/g, '/') },
    { id: 'gde', label: 'N.º GDE' },
    { id: 'expediente', label: 'Detalle del trámite', tipo: 'textarea' }
  ], actual, (datos) => {
    D.oficinas[clave].filas[indice] = datos;
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarFilaSimple(clave, indice) {
  if (!confirm('¿Eliminar esta fila?')) return;
  D.oficinas[clave].filas.splice(indice, 1);
  persistirDatosGuardia();
  refrescarPestanaActual();
}

function uiAgregarTramiteAnalisis() {
  abrirModalFormulario('Agregar trámite en análisis', [
    { id: 'numero', label: 'N.º' },
    { id: 'vuelve', label: 'Vuelve' },
    { id: 'ingresoProgebu', label: 'Ingreso en PROGEBU' },
    { id: 'usuarioSolicitante', label: 'Usuario Solicitante' },
    { id: 'vtoCnsn', label: 'Vto. CNSN / Prórroga' },
    { id: 'tramite', label: 'Trámite' },
    { id: 'servicio', label: 'Servicio' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'especialidades', label: 'Especialidades' },
    { id: 'solicita', label: 'Solicita', tipo: 'textarea' },
    { id: 'observacion', label: 'Observación', tipo: 'textarea' }
  ], {}, (datos) => {
    D.oficinas.documentacion.tramitesAnalisis.push(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarTramiteAnalisis(indice) {
  const actual = D.oficinas.documentacion.tramitesAnalisis[indice];
  abrirModalFormulario('Editar trámite en análisis', [
    { id: 'numero', label: 'N.º' },
    { id: 'vuelve', label: 'Vuelve' },
    { id: 'ingresoProgebu', label: 'Ingreso en PROGEBU' },
    { id: 'usuarioSolicitante', label: 'Usuario Solicitante' },
    { id: 'vtoCnsn', label: 'Vto. CNSN / Prórroga' },
    { id: 'tramite', label: 'Trámite' },
    { id: 'servicio', label: 'Servicio' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'especialidades', label: 'Especialidades' },
    { id: 'solicita', label: 'Solicita', tipo: 'textarea' },
    { id: 'observacion', label: 'Observación', tipo: 'textarea' }
  ], actual, (datos) => {
    D.oficinas.documentacion.tramitesAnalisis[indice] = datos;
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiAgregarCertificadoArqueo() {
  abrirModalFormulario('Agregar solicitud de certificado de arqueo', [
    { id: 'numeroIngreso', label: 'N.º Ingreso' },
    { id: 'usuarioSolicitante', label: 'Usuario Solicitante' },
    { id: 'servicio', label: 'Servicio' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'solicita', label: 'Solicita', tipo: 'textarea' }
  ], {}, (datos) => {
    D.oficinas.documentacion.certificadosArqueo.push(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarCertificadoArqueo(indice) {
  const actual = D.oficinas.documentacion.certificadosArqueo[indice];
  abrirModalFormulario('Editar solicitud de certificado de arqueo', [
    { id: 'numeroIngreso', label: 'N.º Ingreso' },
    { id: 'usuarioSolicitante', label: 'Usuario Solicitante' },
    { id: 'servicio', label: 'Servicio' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'solicita', label: 'Solicita', tipo: 'textarea' }
  ], actual, (datos) => {
    D.oficinas.documentacion.certificadosArqueo[indice] = datos;
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiAgregarGiradoTNAV() {
  abrirModalFormulario('Agregar girado a TNAV', [
    { id: 'numero', label: 'N.º' },
    { id: 'fecha', label: 'Fecha', default: fechaHoy().replace(/-/g, '/') },
    { id: 'usuario', label: 'Usuario' },
    { id: 'servicio', label: 'Servicio' },
    { id: 'nombreMatricula', label: 'Nombre y Matrícula' },
    { id: 'solicita', label: 'Solicita', tipo: 'textarea' }
  ], {}, (datos) => {
    D.oficinas.documentacion.giradosTNAV.push(datos);
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function uiEditarGiradoTNAV(indice) {
  const actual = D.oficinas.documentacion.giradosTNAV[indice];
  abrirModalFormulario('Editar girado a TNAV', [
    { id: 'numero', label: 'N.º' },
    { id: 'fecha', label: 'Fecha', default: fechaHoy().replace(/-/g, '/') },
    { id: 'usuario', label: 'Usuario' },
    { id: 'servicio', label: 'Servicio' },
    { id: 'nombreMatricula', label: 'Nombre y Matrícula' },
    { id: 'solicita', label: 'Solicita', tipo: 'textarea' }
  ], actual, (datos) => {
    D.oficinas.documentacion.giradosTNAV[indice] = datos;
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarFilaDocumentacion(subtabla, indice) {
  if (!confirm('¿Eliminar esta fila?')) return;
  D.oficinas.documentacion[subtabla].splice(indice, 1);
  persistirDatosGuardia();
  refrescarPestanaActual();
}

/** Imprime solo el bloque indicado (oculta topbar, pestañas y el resto de las oficinas). */
function imprimirBloqueOficina(idBloque) {
  document.querySelectorAll('#contenidoPanel > *').forEach(el => el.classList.remove('imprimir-activo'));
  const bloque = document.getElementById(idBloque);
  if (bloque) bloque.classList.add('imprimir-activo');
  document.body.classList.add('imprimiendo');
  window.print();
}
window.addEventListener('afterprint', () => document.body.classList.remove('imprimiendo'));

// ---------- Registro Nacional de Buques ----------
const COLUMNAS_RNBU = ['matr', 'tran', 'vent', 'medJud', 'cbioMotor', 'otros'];

function actualizarCeldaRNBU(filaClave, columna, valor) {
  const n = Math.max(0, parseInt(valor, 10) || 0);
  D.oficinas.registroNacionalBuques.filas[filaClave][columna] = n;
  persistirDatosGuardia();
  refrescarPestanaActual();
}
