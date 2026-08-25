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
    `Personas en cursos: ${D.cursos.length}`
  ];
}

function itemsAlturaCaladosGuardia() {
  const items = [];
  D.alturaAgua.lecturas.forEach(a => items.push(`Altura de Agua — ${a.punto}: ${a.altura} "${a.escala}" (${a.fecha})`));
  D.alturaAgua.calados.forEach(c => items.push(`Calado — Para puerto ${c.tramo}: ${c.calado} (${c.referencia})`));
  items.push(`Guardia Saliente: ${D.guardia.saliente.map(g => `${g.rol}: ${g.nombre}`).join(' · ')}`);
  items.push(`Guardia Entrante: ${D.guardia.entrante.map(g => `${g.rol}: ${g.nombre}`).join(' · ')}`);
  return items;
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
  const pctDiario = rp.factiblesDiario ? ((rp.inspeccionadosDiario / rp.factiblesDiario) * 100).toFixed(2) : '0.00';
  const pctAnual = rp.factiblesAnual ? ((rp.inspeccionadosAnual / rp.factiblesAnual) * 100).toFixed(2) : '0.00';
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
          filas: [[rp.buquesIngresados, rp.factiblesDiario, rp.inspeccionadosDiario, pctDiario + '%', rp.factiblesAnual, rp.inspeccionadosAnual, pctAnual + '%']]
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
  const deps = Object.keys(D.otros.porDependencia);
  const items = [];
  deps.forEach(dep => {
    D.otros.porDependencia[dep].forEach(b => {
      if (b.tipoBloque === 'texto') items.push(`${dep} — ${b.titulo}: ${b.contenido}`);
      else items.push(`${dep} — ${b.titulo}: (tabla — ver detalle en el sistema)`);
    });
  });
  return [{ titulo: 'Otros', contenido: { tipo: 'lista', items: items.length ? items : ['Sin novedades adicionales.'] } }];
}

function textoBuquesDetencion() {
  return [{
    titulo: 'Buques con Detención',
    contenido: {
      tipo: 'tablas',
      tablas: [{
        columnas: ['N.º', 'Dependencia', 'Buque', 'Fecha', 'Tipo Insp.', 'Deficiencias'],
        filas: D.buquesDetencion.map(b => [b.numero, b.dependencia, b.buque, b.fecha, b.tipoInsp, b.deficiencias])
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
    ['Licencia Anual', D.licencias.anuales],
    ['Licencia Médica', D.licencias.medicas],
    ['Tareas Adecuadas', D.licencias.tareasAdecuadas],
    ['Licencia Extraordinaria', D.licencias.extraordinaria],
    ['Comisiones', D.licencias.comisiones],
    ['Licencias No Computables', D.licencias.noComputables]
  ];
  return [{
    titulo: 'Licencias',
    contenido: {
      tipo: 'tablas',
      tablas: grupos.map(([titulo, lista]) => ({
        titulo,
        columnas: ['Jerarquía', 'Apellido y Nombre', 'Inicia', 'Vence'],
        filas: lista.map(l => [l.jerarquia, l.nombre, l.inicia, l.vence])
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
  'buques-detencion': textoBuquesDetencion,
  'insp-tecnicas': textoInspeccionesTecnicas,
  'control-gestion': textoDivisionControlGestion,
  'licencias': textoLicencias,
  'cursos': textoCursos
};
