// ============================================================
// TEXTO PARA EXPORTACIÓN — Novedades DPSN
// ============================================================
// Estas funciones arman el contenido que va DENTRO del PDF,
// directo desde los datos (D = DATOS_EJEMPLO) — nunca desde el
// HTML de pantalla (ese tiene botones y placeholders que no van
// en el documento). Cada función devuelve:
//   - un string (texto corrido), o
//   - un objeto { texto?, tablas?: [{ titulo?, columnas, filas }] }
//     cuando la sección tiene cuadros numéricos reales, igual que
//     en el parte original.
// ============================================================

function textoInspeccionesGrupo(grupo, etiquetaBandera) {
  const deps = Object.keys(grupo.porDependencia);
  if (!deps.length) return `${etiquetaBandera}: NIL — sin novedades.\n`;

  let out = `${etiquetaBandera}:\n`;
  deps.forEach(dep => {
    out += `\n${dep}:\n`;
    grupo.porDependencia[dep].forEach(insp => {
      const tipoTexto = insp.tipo === 'inicial' ? 'Inspección Inicial (II)' :
        insp.tipo === 'detallada' ? 'Inspección Más Detallada (ID)' :
        `IS de ID Fecha ${insp.fechaInspMasDetallada || '—'}`;
      out += `  • (${tipoTexto}) ${insp.buque.tipo} "${insp.buque.nombre}" (${insp.buque.matricula}) B/${insp.buque.bandera}.\n`;
      if (insp.asunto) out += `    Ref. Caso MAS: ${insp.asunto}\n`;
      if (insp.tipo === 'inicial') {
        out += `    Sin registrar deficiencias.\n`;
      }
      (insp.deficiencias || []).forEach(g => {
        out += `    - ${textoGrupoDeficiencia(g)}\n`;
      });
      if (insp.nota) out += `    Nota: ${insp.nota}\n`;
    });
  });
  return out;
}

function textoExtraordinarias() {
  const tot = calcularTotalesExtraordinarias();
  const cat = calcularResumenCategorias();
  let texto = '';
  texto += textoInspeccionesGrupo(D.inspeccionesExtraordinarias.argentina, 'INSPECCIONES EXTRAORDINARIAS — BANDERA ARGENTINA');
  texto += '\n';
  texto += textoInspeccionesGrupo(D.inspeccionesExtraordinarias.extranjera, 'INSPECCIONES EXTRAORDINARIAS — BANDERA EXTRANJERA');

  return {
    texto,
    tablas: [{
      titulo: 'RESUMEN DE INSPECCIONES (cálculo automático — no se ingresa a mano)',
      columnas: ['Pesqueros/Otros', 'Por Avería', 'Carga/Pasaje', 'Convoy Extr.', 'Convoy B/ARG', 'Total Diario', 'Total Anual'],
      filas: [[cat.pesquerosOtros, cat.porAveria, cat.cargaPasaje, cat.convoyesExtr, cat.convoyArgentino, tot.diarioArg + tot.diarioExt, tot.anualArg + tot.anualExt]]
    }]
  };
}

function textoEstadoRectorPuerto() {
  const rp = D.estadoRectorPuerto.resumen;
  const texto = textoInspeccionesGrupo(D.estadoRectorPuerto, 'INSPECCIONES POR ESTADO RECTOR DEL PUERTO');
  const pctDiario = rp.factiblesDiario ? ((rp.inspeccionadosDiario / rp.factiblesDiario) * 100).toFixed(2) : '0.00';
  const pctAnual = rp.factiblesAnual ? ((rp.inspeccionadosAnual / rp.factiblesAnual) * 100).toFixed(2) : '0.00';

  return {
    texto,
    tablas: [{
      titulo: 'RESUMEN PSC',
      columnas: ['Buq. Extr. Ingresados', 'Factibles (hoy)', 'Insp. (hoy)', 'Total % (hoy)', 'Factibles (anual)', 'Insp. (anual)', 'Total % (anual)'],
      filas: [[rp.buquesIngresados, rp.factiblesDiario, rp.inspeccionadosDiario, pctDiario + '%', rp.factiblesAnual, rp.inspeccionadosAnual, pctAnual + '%']]
    }]
  };
}

function textoCasoIndividual(c, esSAR) {
  let out = `${c.titulo} — ${c.estado === 'pendiente' ? 'PENDIENTE' : 'CERRADO'}\n`;
  if (esSAR) {
    out += `N.º de caso: ${c.numeroCaso || '—'} · Subcentro (VTS): ${c.subcentroVTS || '—'} · Inicio: ${c.fechaInicio || '—'}`;
    out += c.fechaCierre ? ` · Cierre: ${c.fechaCierre}\n` : '\n';
  }
  out += `Asunto: ${c.asunto || c.titulo}\n`;
  out += `Posición: ${c.posicion || '—'}\n`;
  out += `Novedad: ${c.novedad || '—'}\n`;
  out += `Características: ${c.caracteristicas || '—'}\n`;
  out += `Situación: ${c.situacion || '—'}\n`;
  return out;
}

function textoCasosBloque(bloque, titulo, esSAR) {
  const deps = Object.keys(bloque.porDependencia);
  if (!deps.length) return `${titulo}: sin casos.`;
  let out = '';
  deps.forEach(dep => {
    out += `\n${dep}:\n`;
    bloque.porDependencia[dep].forEach(c => { out += textoCasoIndividual(c, esSAR) + '\n'; });
  });
  return out;
}

function textoCasosMAS() { return textoCasosBloque(D.casosMAS, 'CASOS MAS', false); }
function textoCasosSAR() { return textoCasosBloque(D.casosSAR, 'CASOS SAR', true); }

function textoOtros() {
  const deps = Object.keys(D.otros.porDependencia);
  if (!deps.length) return 'Sin novedades adicionales.';
  let out = '';
  deps.forEach(dep => {
    out += `\n${dep}:\n`;
    D.otros.porDependencia[dep].forEach(b => {
      out += `  • ${b.titulo}: ${b.contenido}\n`;
    });
  });
  return out;
}

function textoInicio() {
  const tot = calcularTotalesExtraordinarias();
  const rp = D.estadoRectorPuerto.resumen;
  let out = 'RESUMEN DEL PARTE:\n';
  out += `Insp. Extraord. B. Argentina: ${tot.diarioArg} | Insp. Extraord. B. Extranjera: ${tot.diarioExt} | `;
  out += `PSC inspeccionados hoy: ${rp.inspeccionadosDiario} | Casos MAS pendientes: ${contarCasos(D.casosMAS)} | `;
  out += `Casos SAR pendientes: ${contarCasos(D.casosSAR)} | Otras situaciones: ${contarOtros()} | `;
  out += `Buques con detención: ${D.buquesDetencion.length} | Personas de licencia: ${contarLicenciasTotal()}\n\n`;

  out += 'ALTURA DE AGUA:\n';
  D.alturaAgua.lecturas.forEach(a => { out += `  ${a.punto}: ${a.altura} "${a.escala}" (${a.fecha})\n`; });
  out += '\nCALADOS DE NAVEGACIÓN:\n';
  D.alturaAgua.calados.forEach(c => { out += `  Para puerto ${c.tramo}: ${c.calado} (${c.referencia})\n`; });

  out += '\nRELEVO DE GUARDIA:\n';
  out += 'Saliente: ' + D.guardia.saliente.map(g => `${g.rol}: ${g.nombre}`).join(' · ') + '\n';
  out += 'Entrante: ' + D.guardia.entrante.map(g => `${g.rol}: ${g.nombre}`).join(' · ');
  return out;
}

function textoBuquesDetencion() {
  return {
    tablas: [{
      columnas: ['N.º', 'Dependencia', 'Buque', 'Fecha', 'Tipo Insp.', 'Deficiencias'],
      filas: D.buquesDetencion.map(b => [b.numero, b.dependencia, b.buque, b.fecha, b.tipoInsp, b.deficiencias])
    }]
  };
}

function textoInspeccionesTecnicas() {
  return {
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
  };
}

function textoDivisionControlGestion() {
  return {
    tablas: [{
      columnas: ['Tipo de Auditoría', 'Embarcación/Empresa', 'Alcance', 'Lugar', 'Auditor'],
      filas: D.divisionControlGestion.map(a => [a.tipoAuditoria, a.embarcacion, a.alcance, a.lugar, a.auditor])
    }]
  };
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
  return {
    tablas: grupos.map(([titulo, lista]) => ({
      titulo,
      columnas: ['Jerarquía', 'Apellido y Nombre', 'Inicia', 'Vence'],
      filas: lista.map(l => [l.jerarquia, l.nombre, l.inicia, l.vence])
    }))
  };
}

// Mapa pestaña → función de contenido para exportar. "estadisticas"
// y "asistente" quedan afuera: son herramientas, no secciones del
// parte diario que se firma y archiva.
const TEXTO_EXPORTACION = {
  'inicio': textoInicio,
  'insp-extraordinarias': textoExtraordinarias,
  'insp-psc': textoEstadoRectorPuerto,
  'casos-mas': textoCasosMAS,
  'casos-sar': textoCasosSAR,
  'otros': textoOtros,
  'buques-detencion': textoBuquesDetencion,
  'insp-tecnicas': textoInspeccionesTecnicas,
  'control-gestion': textoDivisionControlGestion,
  'licencias': textoLicencias
};
