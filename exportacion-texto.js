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
    `Cursos: ${D.cursos.length}`
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
  }];
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

function textoInspeccionesTecnicas() {
  return [{
    titulo: 'Inspecciones Técnicas',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['Especialidad', 'Embarcación/Empresa', 'Requerimiento', 'Lugar', 'Inspector/MOI'],
        filas: D.inspeccionesTecnicas.map(i => {
          let inspector = i.inspector + (i.extranjero ? ' (EXTRANJERO)' : '');
          if (i.salida && i.salida.fechaHora) {
            inspector += ` | Salida: ${i.salida.fechaHora} Vuelo ${i.salida.vuelo} ${i.salida.destino}`;
            inspector += ` | Regreso: ${i.regreso.fechaHora} Vuelo ${i.regreso.vuelo} ${i.regreso.destino}`;
          }
          return [i.especialidad, i.embarcacion, i.requerimiento, i.lugar, inspector];
        })
      }]
    }
  }];
}

function textoDivisionControlGestion() {
  return [{
    titulo: 'División Control de Gestión',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['Tipo de Auditoría', 'Embarcación/Empresa', 'Alcance', 'Lugar', 'Auditor'],
        filas: D.divisionControlGestion.map(a => [a.tipoAuditoria, a.embarcacion, a.alcance, a.lugar, a.auditor])
      }]
    }
  }];
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
  return [{
    titulo: 'Licencias',
    contenido: {
      tipo: 'tablas',
      tablas: grupos.map(([titulo, lista, esMedica]) => ({
        titulo,
        anchos: esMedica ? [0.11, 0.30, 0.34, 0.125, 0.125] : [0.12, 0.60, 0.14, 0.14],
        columnas: esMedica ? ['Jerarquía', 'Apellido y Nombre', 'Diagnóstico', 'Inicia', 'Vence'] : ['Jerarquía', 'Apellido y Nombre', 'Inicia', 'Vence'],
        filas: lista.map(l => esMedica ? [l.jerarquia, l.nombre, l.diagnostico || '', l.inicia, l.vence] : [l.jerarquia, l.nombre, l.inicia, l.vence])
      }))
    }
  }];
}

function textoCursos() {
  return [{
    titulo: 'Cursos',
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
