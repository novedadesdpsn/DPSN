// ============================================================
// CONTENIDO PARA EXPORTACIÓN — Novedades DPSN
// ============================================================
// Arma el contenido que va DENTRO del PDF, directo desde los
// datos (D = DATOS_EJEMPLO) — nunca desde el HTML de pantalla.
// Cada función devuelve un ARRAY de secciones { titulo, referencias?,
// contenido }, para poder emitir varios bloques con su propio
// título centrado (ej. bandera argentina, bandera extranjera y
// después el cuadro resumen, como tres bloques separados).
// ============================================================

function itemsResumenParte() {
  const tot = calcularTotalesExtraordinarias();
  const rp = D.estadoRectorPuerto.resumen;
  return [
    `Inspecciones Extraordinarias — Bandera Argentina: ${tot.diarioArg}`,
    `Inspecciones Extraordinarias — Bandera Extranjera: ${tot.diarioExt}`,
    `PSC inspeccionados hoy: ${rp.inspeccionadosDiario}`,
    `Casos MAS pendientes: ${contarCasos(D.casosMAS)}`,
    `Casos SAR pendientes: ${contarCasos(D.casosSAR)}`,
    `Otras situaciones: ${contarOtros()}`,
    `Buques con detención: ${D.buquesDetencion.length}`,
    `Personas de licencia: ${contarLicenciasTotal()}`,
    `Cursos / Comisiones: ${D.cursos.length}`
  ];
}

function contenidoGuardia() {
  return { tipo: 'guardia', saliente: D.guardia.saliente, entrante: D.guardia.entrante };
}

function textoExtraordinarias() {
  const tot = calcularTotalesExtraordinarias();
  const cat = calcularResumenCategorias();
  return [
    {
      titulo: 'Inspecciones Extraordinarias — Bandera Argentina',
      referencias: REFERENCIAS_TEXTO,
      contenido: { tipo: 'inspecciones', grupo: D.inspeccionesExtraordinarias.argentina, familia: 'extraordinarias' }
    },
    {
      titulo: 'Inspecciones Extraordinarias — Bandera Extranjera',
      referencias: REFERENCIAS_TEXTO,
      contenido: { tipo: 'inspecciones', grupo: D.inspeccionesExtraordinarias.extranjera, familia: 'extraordinarias' }
    },
    {
      titulo: 'Resumen de Inspecciones',
      contenido: {
        tipo: 'tablas',
        nota: '(Cálculo automático)',
        tablas: [{
          columnas: ['Pesqueros/Otros', 'Por Avería', 'Carga/Pasaje', 'Convoy Extr.', 'Convoy B/ARG', 'Total Diario', 'Total Anual'],
          filas: [[cat.pesquerosOtros, cat.porAveria, cat.cargaPasaje, cat.convoyesExtr, cat.convoyArgentino, tot.diarioArg + tot.diarioExt, tot.anualArg + tot.anualExt]]
        }]
      }
    }
  ];
}

function textoEstadoRectorPuerto() {
  const rp = D.estadoRectorPuerto.resumen;
  const factiblesAnual = (rp.factiblesAnualPrevio || 0) + (rp.factiblesDiario || 0);
  const inspeccionadosAnual = (rp.inspeccionadosAnualPrevio || 0) + (rp.inspeccionadosDiario || 0);
  const pctDiario = rp.factiblesDiario ? ((rp.inspeccionadosDiario / rp.factiblesDiario) * 100).toFixed(2) : '0.00';
  const pctAnual = factiblesAnual ? ((inspeccionadosAnual / factiblesAnual) * 100).toFixed(2) : '0.00';
  return [
    {
      titulo: 'Inspecciones por Estado Rector del Puerto',
      referencias: REFERENCIAS_PSC_TEXTO,
      contenido: { tipo: 'inspecciones', grupo: D.estadoRectorPuerto, familia: 'psc' }
    },
    {
      titulo: 'Resumen PSC',
      contenido: {
        tipo: 'tablas',
        nota: '(Cálculo automático)',
        tablas: [{
          columnas: ['Buq. Extr. Ingresados', 'Factibles (hoy)', 'Insp. (hoy)', 'Total % (hoy)', 'Factibles (anual)', 'Insp. (anual)', 'Total % (anual)'],
          filas: [[rp.buquesIngresados, rp.factiblesDiario, rp.inspeccionadosDiario, pctDiario + '%', factiblesAnual, inspeccionadosAnual, pctAnual + '%']]
        }]
      }
    }
  ];
}

function textoCasosMAS() {
  return [{ titulo: 'Casos MAS', contenido: { tipo: 'casos', bloque: D.casosMAS, esSAR: false } }];
}

function textoCasosSAR() {
  return [{ titulo: 'Casos SAR', contenido: { tipo: 'casos', bloque: D.casosSAR, esSAR: true } }];
}

function textoOtros() {
  return [{ titulo: 'Otros', contenido: { tipo: 'otros', porDependencia: D.otros.porDependencia } }];
}

function textoOficinas() {
  const doc = D.oficinas.documentacion;
  const secciones = [{
    titulo: `Documentación — Trámites en Análisis (${fechaHoy()})`,
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['N.º', 'Vuelve', 'Ingreso PROGEBU', 'Usuario Sol.', 'Vto. CNSN/Prórroga', 'Trámite', 'Servicio', 'Nombre', 'Especialidades', 'Solicita', 'Observación'],
        filas: doc.tramitesAnalisis.map(t => [t.numero, t.vuelve, t.ingresoProgebu, t.usuarioSolicitante, t.vtoCnsn, t.tramite, t.servicio, t.nombre, t.especialidades, t.solicita, t.observacion])
      }]
    }
  }, {
    titulo: 'Documentación — Solicitudes Certificados de Arqueo',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['N.º Ingreso', 'Usuario Sol.', 'Servicio', 'Nombre', 'Solicita'],
        filas: doc.certificadosArqueo.map(c => [c.numeroIngreso, c.usuarioSolicitante, c.servicio, c.nombre, c.solicita])
      }]
    }
  }, {
    titulo: 'Documentación — Girados a TNAV',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['N.º', 'Fecha', 'Usuario', 'Servicio', 'Nombre y Matrícula', 'Solicita'],
        filas: doc.giradosTNAV.map(g => [g.numero, g.fecha, g.usuario, g.servicio, g.nombreMatricula, g.solicita])
      }]
    }
  }, {
    titulo: 'Control de Gestión',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['Fecha', 'GDE', 'Expedientes en tramitación'],
        filas: D.oficinas.controlGestion.filas.map(f => [f.fecha, f.gde, f.expediente])
      }]
    }
  }, {
    titulo: 'División Navegación',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['Fecha', 'GDE', 'Expedientes en tramitación'],
        filas: D.oficinas.divisionNavegacion.filas.map(f => [f.fecha, f.gde, f.expediente])
      }]
    }
  }, (() => {
    const r = D.oficinas.registroNacionalBuques.filas;
    const defs = [['buscarBuque', 'Buscar Buque'], ['ingresarGde', 'Ingresar GDE/CUDAP'], ['verificar', 'Verificar Datos / Normalizar'], ['aprobarFolio', 'Aprobar Folio'], ['darSalida', 'Dar Salida']];
    const cols = ['matr', 'tran', 'vent', 'medJud', 'cbioMotor', 'otros'];
    const sumaFila = f => cols.reduce((a, k) => a + (f[k] || 0), 0);
    const totales = cols.map(k => defs.reduce((a, [fk]) => a + (r[fk][k] || 0), 0));
    const totalGral = totales.reduce((a, b) => a + b, 0);
    return {
      titulo: 'Registro Nacional de Buques',
      contenido: {
        tipo: 'tablas',
        tablas: [{
          columnas: ['Nro.', 'Pantalla Actual', 'MATR', 'TRAN', 'VENT', 'MED. JUD.', 'CBIO MOTOR', 'OTROS', 'Trám. Vigentes'],
          anchos: [0.07, 0.27, 0.09, 0.09, 0.09, 0.09, 0.1, 0.09, 0.11],
          filas: [
            ...defs.map(([fk, et]) => [r[fk].nroOrden, et, ...cols.map(k => r[fk][k]), sumaFila(r[fk])]),
            ['', 'Suma Total', ...totales, totalGral]
          ]
        }]
      }
    };
  })()];
  return secciones;
}

function textoBuquesDetencion() {
  return [{
    titulo: 'Buques con Detención',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['N.º', 'Dependencia', 'Buque', 'Fecha', 'Tipo Insp.', 'Deficiencias'],
        filas: D.buquesDetencion.map(b => [b.numero, b.dependencia, b.buque, b.fecha, b.tipoInsp, b.deficienciasLista ? textoDeficienciasDetencion(b.deficienciasLista) : (b.deficiencias || '')])
      }]
    }
  }];
}

const MESES_BANDA = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

function diaMesDeTexto(t) {
  const m = String(t || '').match(/(\d{1,2})[\/-](\d{1,2})/);
  return m ? { dia: parseInt(m[1], 10), mes: parseInt(m[2], 10) } : null;
}

/**
 * Arma una o dos secciones: las que se hacen en el país y, aparte, las "al exterior"
 * (con banda gris de fechas y, debajo de la tabla, disposición y vuelos).
 */
function seccionesConExterior(lista, tituloLocal, tituloExterior, columnas, filaDe, personaDe) {
  const esExt = (i) => i.extranjero || (!i.viaAerea && !!(i.salida && (i.salida.fechaHora || i.salida.vuelo)));
  const locales = lista.filter(i => !esExt(i));
  const exterior = lista.filter(esExt);
  const secciones = [];
  const fin = (t) => /[.]$/.test(t || '') ? '' : '.';

  // Líneas de pie con disposición y vuelos (GFH) de un ítem.
  const lineasVuelo = (i, marca) => {
    const s = i.salida || {}, r = i.regreso || {};
    const disp = i.extranjero && i.disposicion ? `Disp. N.º ${i.disposicion}. ` : '';
    const lineas = [];
    if (s.fechaHora || s.vuelo || s.destino || disp) lineas.push(`${marca} ${disp}Salida: Vuelo ${s.vuelo || '—'} GFH ${s.fechaHora || '—'} ${s.destino || ''}`.trim() + fin(s.destino));
    if (r.fechaHora || r.vuelo) lineas.push(`Retorno: Vuelo ${r.vuelo || '—'} GFH ${r.fechaHora || '—'} ${r.destino || ''}`.trim() + fin(r.destino));
    return lineas;
  };

  if (locales.length || !exterior.length) {
    // Los de vía aérea dentro del país van en la tabla local, con marca y sus vuelos debajo.
    const pieLocal = [];
    let nAerea = 0;
    const filas = locales.map(i => {
      if (!i.viaAerea) return filaDe(i, '');
      nAerea++;
      const marca = '(' + '*'.repeat(nAerea) + ')';
      pieLocal.push(...lineasVuelo(i, marca));
      return filaDe(i, marca);
    });
    secciones.push({
      titulo: tituloLocal,
      contenido: { tipo: 'tablas', tablas: [{ columnas, filas, pie: pieLocal }] }
    });
  }

  if (exterior.length) {
    const pie = [];
    const fechas = [];
    const filas = exterior.map((i, idx) => {
      const marca = '(' + '*'.repeat(idx + 1) + ')';
      const s = i.salida || {}, r = i.regreso || {};
      pie.push(...lineasVuelo(i, marca));
      const fs = diaMesDeTexto(s.fechaHora), fr = diaMesDeTexto(r.fechaHora);
      if (fs) fechas.push(fs);
      if (fr) fechas.push(fr);
      return filaDe(i, marca);
    });
    let banda = '';
    if (fechas.length) {
      const clave = f => f.mes * 100 + f.dia;
      const ord = fechas.slice().sort((a, b) => clave(a) - clave(b));
      const a = ord[0], b = ord[ord.length - 1];
      const f2 = n => String(n).padStart(2, '0');
      banda = `DEL ${f2(a.dia)} DE ${MESES_BANDA[a.mes - 1] || ''} AL ${f2(b.dia)} DE ${MESES_BANDA[b.mes - 1] || ''}`;
    }
    secciones.push({
      titulo: tituloExterior,
      contenido: { tipo: 'tablas', tablas: [{ columnas, filas, banda, pie }] }
    });
  }
  return secciones;
}

function textoInspeccionesTecnicas() {
  return seccionesConExterior(
    D.inspeccionesTecnicas, 'Inspecciones Técnicas', 'Inspecciones al Exterior',
    ['ESP', 'EMBARCACION', 'REQUERIMIENTO', 'LUGAR', 'INSPECTOR/MOI'],
    (i, marca) => [i.especialidad, i.embarcacion, i.requerimiento, i.lugar, `${i.inspector}${marca ? ' ' + marca : ''}`]
  );
}

function textoDivisionControlGestion() {
  return seccionesConExterior(
    D.divisionControlGestion, 'División Control de Gestión', 'Auditorías al Exterior',
    ['Tipo de Auditoría', 'Embarcación/Empresa', 'Alcance', 'Lugar', 'Auditor'],
    (a, marca) => [a.tipoAuditoria, a.embarcacion, a.alcance, a.lugar, `${a.auditor}${marca ? ' ' + marca : ''}`]
  );
}

function textoLicencias() {
  const grupos = [
    ['Licencia Anual', D.licencias.anuales, false],
    ['Licencia Médica', D.licencias.medicas, true],
    ['Tareas Adecuadas', D.licencias.tareasAdecuadas, false],
    ['Licencia Extraordinaria', D.licencias.extraordinaria, false],
    ['Comisiones', D.licencias.comisiones, false],
    ['Licencias No Computables', D.licencias.noComputables, false],
    ['Asuntos Personales', D.licencias.personales, false]
  ];
  const conDatos = grupos.filter(([, lista]) => lista.length);
  if (!conDatos.length) return [];
  return [{
    titulo: 'Licencias',
    contenido: {
      tipo: 'tablas',
      tablas: conDatos.map(([titulo, lista, esMedica]) => ({
        titulo,
        anchos: esMedica ? [0.11, 0.30, 0.34, 0.125, 0.125] : [0.12, 0.60, 0.14, 0.14],
        columnas: esMedica ? ['Jerarquía', 'Apellido y Nombre', 'Diagnóstico', 'Inicia', 'Vence'] : ['Jerarquía', 'Apellido y Nombre', 'Inicia', 'Vence'],
        filas: lista.map(l => {
          const nom = l.nombre + (l.oficina ? ` (${l.oficina})` : '');
          return esMedica ? [l.jerarquia, nom, l.diagnostico || '', l.inicia, l.vence] : [l.jerarquia, nom, l.inicia, l.vence];
        })
      }))
    }
  }];
}

function textoCursos() {
  if (!D.cursos.length) return [];
  return [{
    titulo: 'Cursos / Comisiones',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['Personal', 'Curso', 'Modalidad', 'Inicio', 'Fin'],
        filas: D.cursos.map(c => [c.personal, c.nombreCurso, c.modalidad === 'presencial' ? `Presencial — ${c.lugar}` : 'Virtual', c.fechaInicio, c.fechaFin])
      }]
    }
  }];
}

// Mapa pestaña → función que arma el/los bloque(s) para exportar.
// "inicio" y "estadisticas"/"asistente" se manejan aparte (ver
// pdf-export.js): el resumen va primero, altura/calados/guardia
// al final, y estadísticas/asistente no forman parte del parte.
const TEXTO_EXPORTACION = {
  'insp-extraordinarias': textoExtraordinarias,
  'insp-psc': textoEstadoRectorPuerto,
  'casos-mas': textoCasosMAS,
  'casos-sar': textoCasosSAR,
  'otros': textoOtros,
  'oficinas': textoOficinas,
  'buques-detencion': textoBuquesDetencion,
  'insp-tecnicas': textoInspeccionesTecnicas,
  'control-gestion': textoDivisionControlGestion,
  'licencias': textoLicencias,
  'cursos': textoCursos
};
