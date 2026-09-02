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
    { id: 'expediente', label: 'Expedientes en tramitación', tipo: 'textarea' }
  ], {}, (datos) => {
    D.oficinas[clave].filas.push(datos);
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
