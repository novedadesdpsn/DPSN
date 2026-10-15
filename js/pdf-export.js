// ============================================================
// EXPORTACIÓN A PDF — Novedades DPSN
// ============================================================
// Encabezado institucional centrado, títulos de sección centrados,
// texto mixto negrita/normal en la misma línea (para diferenciar
// el título de cada inspección/caso del resto), listas en vez de
// texto corrido, y tablas con encabezados que ajustan su alto
// cuando el texto no entra en una sola línea.
// ============================================================

function fechaHoy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

const MESES_ES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

/** Fecha del parte con la fecha actual: "14 0700 a 15 0700 de OCTUBRE de 2026" (0700 del día anterior a 0700 de hoy). */
function fechaParteActual() {
  const hoy = new Date();
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  const dd = (d) => String(d.getDate()).padStart(2, '0');
  if (ayer.getMonth() === hoy.getMonth()) {
    return `${dd(ayer)}0700 a ${dd(hoy)}0700 de ${MESES_ES[hoy.getMonth()]} de ${hoy.getFullYear()}`;
  }
  return `${dd(ayer)}0700 de ${MESES_ES[ayer.getMonth()]} a ${dd(hoy)}0700 de ${MESES_ES[hoy.getMonth()]} de ${hoy.getFullYear()}`;
}

function cerrarModalExportar() {
  const m = document.getElementById('modalExportar');
  if (m) m.remove();
}

function abrirModalExportarGenerico(titulo, items, onExportar) {
  cerrarModalExportar();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalExportar';
  modal.innerHTML = `
    <div class="modal-caja">
      <div class="modal-header">
        <h3>${esc(titulo)}</h3>
        <button type="button" onclick="cerrarModalExportar()">✕</button>
      </div>
      <div class="modal-todos">
        <input type="checkbox" id="chkTodosExportar" checked>
        <label for="chkTodosExportar">Seleccionar todos los ítems</label>
      </div>
      <div class="modal-lista" id="listaItemsExportar">
        ${items.map(it => `
          <label>
            <input type="checkbox" class="chk-item-exportar" value="${esc(it.id)}" checked>
            ${esc(it.label)}
          </label>
        `).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalExportar()">Cancelar</button>
        <button class="btn-primario" type="button" id="btnConfirmarExportar">Exportar PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('chkTodosExportar').addEventListener('change', (e) => {
    document.querySelectorAll('.chk-item-exportar').forEach(chk => chk.checked = e.target.checked);
  });

  document.getElementById('btnConfirmarExportar').addEventListener('click', () => {
    const seleccionados = Array.from(document.querySelectorAll('.chk-item-exportar'))
      .filter(c => c.checked).map(c => c.value);
    if (!seleccionados.length) { alert('Elegí al menos un ítem para exportar.'); return; }
    cerrarModalExportar();
    onExportar(seleccionados);
  });
}

/**
 * Genera el PDF. `secciones` es un array de:
 * { titulo, referencias?, contenido }
 * `contenido.tipo` puede ser: 'lista' | 'inspecciones' | 'casos' | 'tablas' | 'texto'
 */
function generarPDF(nombreArchivo, tituloVisible, subtitulo, secciones) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margen = 48;
  const anchoPagina = 595;
  const altoPagina = 842;
  const anchoUtil = anchoPagina - margen * 2;
  let y = margen;

  function saltoDePaginaSiHaceFalta(alturaNecesaria) {
    if (y + alturaNecesaria > altoPagina - 46) { doc.addPage(); y = margen; }
  }

  function encabezadoInstitucional() {
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PREFECTURA NAVAL ARGENTINA', margen, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Autoridad Marítima', margen, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DIRECCIÓN DE POLICÍA DE SEGURIDAD DE LA NAVEGACIÓN', anchoPagina / 2, y, { align: 'center' });
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(tituloVisible || 'RESUMEN DE NOVEDADES', anchoPagina / 2, y, { align: 'center' });
    y += 15;
    if (subtitulo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(subtitulo, anchoPagina / 2, y, { align: 'center' });
      y += 12;
    }
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.8);
    doc.line(margen, y, anchoPagina - margen, y);
    y += 18;
  }

  function tituloSeccion(texto) {
    saltoDePaginaSiHaceFalta(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 20, 20);
    doc.text(texto.toUpperCase(), anchoPagina / 2, y, { align: 'center' });
    y += 8;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margen, y, anchoPagina - margen, y);
    y += 14;
  }

  function referenciasSeccion(runs) {
    saltoDePaginaSiHaceFalta(14);
    doc.setTextColor(70, 70, 70);
    y = escribirParrafoMixto(runs, margen, anchoUtil, y, 8, true);
    y += 6;
    doc.setTextColor(20, 20, 20);
  }

  /**
   * Escribe un párrafo con tramos de distinto peso (negrita/normal) que
   * fluyen en la misma línea y se van ajustando con el ancho disponible.
   * runs: [{ texto, negrita }]. Devuelve el nuevo y.
   */
  function escribirParrafoMixto(runs, x, anchoMax, yInicial, tamano, centrado) {
    doc.setFontSize(tamano);
    const espacio = doc.getStringUnitWidth(' ') * tamano / doc.internal.scaleFactor;
    const lineas = [[]];
    let anchoLinea = 0;
    runs.forEach(run => {
      doc.setFont('helvetica', run.negrita ? 'bold' : 'normal');
      String(run.texto).split(/\s+/).filter(Boolean).forEach(palabra => {
        const anchoPalabra = doc.getStringUnitWidth(palabra) * tamano / doc.internal.scaleFactor;
        if (anchoLinea + anchoPalabra > anchoMax && anchoLinea > 0) {
          lineas.push([]);
          anchoLinea = 0;
        }
        lineas[lineas.length - 1].push({ texto: palabra, negrita: run.negrita });
        anchoLinea += anchoPalabra + espacio;
      });
    });
    let y2 = yInicial;
    lineas.forEach((linea, idxLinea) => {
      if (y2 + 11 > altoPagina - 46) { doc.addPage(); y2 = margen; }
      const esUltimaLinea = idxLinea === lineas.length - 1;

      // Ancho real de las palabras (sin espacios), para calcular cuánto hay que estirar.
      let anchoPalabrasSolas = 0;
      linea.forEach(w => {
        doc.setFont('helvetica', w.negrita ? 'bold' : 'normal');
        anchoPalabrasSolas += doc.getStringUnitWidth(w.texto) * tamano / doc.internal.scaleFactor;
      });
      const huecos = linea.length - 1;
      const espacioJustificado = centrado ? espacio : ((!esUltimaLinea && huecos > 0)
        ? (anchoMax - anchoPalabrasSolas) / huecos
        : espacio);

      let cx = x;
      if (centrado) cx = x + (anchoMax - (anchoPalabrasSolas + espacio * huecos)) / 2;
      linea.forEach((w, i) => {
        doc.setFont('helvetica', w.negrita ? 'bold' : 'normal');
        doc.text(w.texto, cx, y2);
        cx += doc.getStringUnitWidth(w.texto) * tamano / doc.internal.scaleFactor + (i < linea.length - 1 ? espacioJustificado : 0);
      });
      y2 += tamano * 1.4;
    });
    return y2;
  }

  function listaSimple(items) {
    doc.setFontSize(9.5);
    items.forEach(item => {
      y = escribirParrafoMixto([{ texto: '•', negrita: false }, { texto: item, negrita: false }], margen, anchoUtil - 10, y, 9.5);
      y += 2;
    });
    y += 6;
  }

  /** Tabla con bordes reales; anchos por columna opcionales (proporciones que suman 1). */
  function tabla(columnas, filas, tituloTabla, anchos, extras) {
    extras = extras || {};
    if (tituloTabla) {
      saltoDePaginaSiHaceFalta(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(tituloTabla, margen, y);
      y += 12;
    }
    if (!filas.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin registros.', margen, y);
      y += 16;
      return;
    }

    const props = (anchos && anchos.length === columnas.length) ? anchos : columnas.map(() => 1 / columnas.length);
    const anchosCol = props.map(p => p * anchoUtil);
    const inicios = anchosCol.map((_, i) => anchosCol.slice(0, i).reduce((a, b) => a + b, 0));

    function dibujarEncabezado() {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6);
      const lineasEnc = columnas.map((col, i) => doc.splitTextToSize(String(col), anchosCol[i] - 8));
      const alto = Math.max(1, ...lineasEnc.map(l => l.length)) * 9 + 8;
      doc.setFillColor(235, 235, 235);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.5);
      doc.rect(margen, y, anchoUtil, alto, 'FD');
      doc.setTextColor(20, 20, 20);
      lineasEnc.forEach((lns, i) => {
        if (i > 0) doc.line(margen + inicios[i], y, margen + inicios[i], y + alto);
        lns.forEach((ln, li) => doc.text(ln, margen + inicios[i] + anchosCol[i] / 2, y + 10 + li * 9, { align: 'center' }));
      });
      doc.rect(margen, y, anchoUtil, alto);
      y += alto;
    }

    saltoDePaginaSiHaceFalta(extras.banda ? 58 : 40);
    if (extras.banda) {
      doc.setFillColor(215, 215, 215);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.5);
      doc.rect(margen, y, anchoUtil, 18, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      doc.text(extras.banda, anchoPagina / 2, y + 12, { align: 'center' });
      y += 18;
    }
    dibujarEncabezado();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    filas.forEach(fila => {
      const lineasCelda = fila.map((celda, i) => doc.splitTextToSize(String(celda), anchosCol[i] - 8));
      const alto = Math.max(1, ...lineasCelda.map(l => l.length)) * 9 + 7;
      if (y + alto > altoPagina - 46) {
        doc.addPage();
        y = margen;
        dibujarEncabezado();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
      }
      doc.setDrawColor(190, 190, 190);
      doc.rect(margen, y, anchoUtil, alto);
      lineasCelda.forEach((lns, i) => {
        if (i > 0) doc.line(margen + inicios[i], y, margen + inicios[i], y + alto);
        lns.forEach((ln, li) => doc.text(ln, margen + inicios[i] + anchosCol[i] / 2, y + 10 + li * 9, { align: 'center' }));
      });
      y += alto;
    });
    if (extras.pie && extras.pie.length) {
      y += 8;
      doc.setTextColor(20, 20, 20);
      extras.pie.forEach(linea => {
        y = escribirParrafoMixto([{ texto: linea, negrita: false }], margen, anchoUtil, y, 8.5);
        y += 2;
      });
    }
    y += 14;
  }

  function grupoDeficienciaPDF(g, xIndent, listaCodigos) {
    const lista = listaCodigos || CODIGOS_MEDIDAS;
    const cant = g.cantidad || 1;
    const anchoDisp = anchoUtil - (xIndent - margen);

    if (g.accion === 'recodifico') {
      const verbo = cant > 1 ? 'recodificándose ' : 'recodificándose ';
      const cantidadTexto = `${numeroALetras(cant)} (${numeroConDigitos(cant)}) `;
      const codigoAnteriorTexto = `def. Cód. ${g.codigoAnterior} (${descripcionEnLista(g.codigoAnterior, lista)}) `;
      const codigoNuevoTexto = `a Cód. ${g.codigoNuevo} (${descripcionEnLista(g.codigoNuevo, lista)}).`;
      y = escribirParrafoMixto([
        { texto: verbo, negrita: false },
        { texto: cantidadTexto, negrita: true },
        { texto: codigoAnteriorTexto, negrita: false },
        { texto: codigoNuevoTexto, negrita: true }
      ], xIndent, anchoDisp, y, 9);
    } else {
      const verbo = cant > 1 ? 'Se detectaron ' : 'Se detectó ';
      const cantidadTexto = `${numeroALetras(cant)} (${numeroConDigitos(cant)}) `;
      const codigoTexto = g.codigo2
        ? `def. Cód. ${g.codigo}-${g.codigo2} (${descripcionEnLista(g.codigo, lista)}-${descripcionEnLista(g.codigo2, lista)}).`
        : `def. Cód. ${g.codigo} (${descripcionEnLista(g.codigo, lista)}).`;
      y = escribirParrafoMixto([
        { texto: verbo, negrita: false },
        { texto: cantidadTexto, negrita: true },
        { texto: codigoTexto, negrita: true }
      ], xIndent, anchoDisp, y, 9);
    }

    // Qué se detectó, en lista numerada — sin negrita.
    const lineasDesc = lineasDescripcionGrupo(g);
    lineasDesc.forEach((l, i) => {
      y = escribirParrafoMixto([{ texto: `${i + 1}) ${l}`, negrita: false }], xIndent + 10, anchoDisp - 10, y, 9);
    });

    // Cómo se subsanó — en negrita, aparte.
    const subsano = textoComoSeSubsano(g);
    if (subsano) {
      const m = subsano.match(/^(C[óo]d\.?\s*[\d\/-]+\s*:)\s*([\s\S]*)$/i);
      const runsSub = m
        ? [{ texto: m[1], negrita: true }, { texto: m[2], negrita: false }]
        : [{ texto: subsano, negrita: true }];
      y = escribirParrafoMixto(runsSub, xIndent + 10, anchoDisp - 10, y, 9);
    }
  }

  function grupoInspeccionesPDF(grupo, familia) {
    const deps = Object.keys(grupo.porDependencia);
    if (!deps.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text('NIL', margen, y);
      y += 16;
      return;
    }
    deps.forEach(dep => {
      saltoDePaginaSiHaceFalta(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${dep}:`, margen, y);
      y += 13;

      grupo.porDependencia[dep].forEach(insp => {
        const listaCod = familia === 'psc' ? CODIGOS_MEDIDAS_PSC : CODIGOS_MEDIDAS;
        const marcaDe = (x) => {
          if (familia === 'psc') return x.tipo === 'inicial' ? '(IISD)' : x.tipo === 'detallada' ? '(IICD)' : `(IS de ID Fecha ${x.fechaInspMasDetallada || '—'})`;
          return x.tipo === 'inicial' ? '(II)' : x.tipo === 'detallada' ? '(ID)' : `(IS de ID Fecha ${x.fechaInspMasDetallada || '—'})`;
        };
        const esConvoy = insp.categoria === 'convoyesExtr' || insp.categoria === 'convoyArgentino';
        let tituloTexto;
        if (esConvoy) {
          tituloTexto = `${marcaDe(insp)} al ${insp.buque.tipo} "${insp.buque.nombre}" (${insp.buque.matricula}) B/${insp.buque.bandera}.`;
          if (insp.asunto) tituloTexto += ` Motivo ${insp.asunto}.`;
          if (insp.proximoPuerto) tituloTexto += ` Próx. puerto: ${insp.proximoPuerto}.`;
        } else {
          const refIdentif = familia === 'psc' ? 'IMO' : 'Mat.';
          tituloTexto = `${marcaDe(insp)} ${insp.buque.tipo} "${insp.buque.nombre}" (${refIdentif} ${insp.buque.matricula}) B/${insp.buque.bandera}`;
          if (insp.asunto) tituloTexto += `, referente ${insp.asunto}`;
          tituloTexto += '.';
          if (insp.proximoPuerto) tituloTexto += ` Próx. puerto: ${insp.proximoPuerto}.`;
        }

        y = escribirParrafoMixto([{ texto: tituloTexto, negrita: true }], margen + 8, anchoUtil - 8, y, 9);

        if (esConvoy && insp.caracteristicasConvoy) {
          insp.caracteristicasConvoy.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
            y = escribirParrafoMixto([{ texto: l, negrita: false }], margen + 8, anchoUtil - 8, y, 9);
          });
          y += 9;
        }

        if (insp.tipo === 'inicial') {
          y = escribirParrafoMixto([{ texto: 'Sin registrar deficiencias.', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        }
        (insp.deficiencias || []).forEach((g, gi) => { if (gi > 0) y += 9; grupoDeficienciaPDF(g, margen + 8, listaCod); });

        // La nota va debajo de la deficiencia; solo la palabra "Nota:" en negrita.
        if (insp.nota) {
          y = escribirParrafoMixto([{ texto: 'Nota:', negrita: true }, { texto: insp.nota, negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        }

        if (esConvoy && insp.barcazas && insp.barcazas.length) {
          y += 4;
          saltoDePaginaSiHaceFalta(24);
          y = escribirParrafoMixto([{ texto: 'BARCAZAS:', negrita: true }], margen + 8, anchoUtil - 8, y, 9);
          insp.barcazas.forEach(b => {
            let t = `"${b.buque.nombre}" (${b.buque.matricula}) B/${b.buque.bandera}.`;
            if (b.tipo === 'seguimiento') t = `${marcaDe(b)} ${t}`;
            y = escribirParrafoMixto([{ texto: t, negrita: true }], margen + 8, anchoUtil - 8, y, 9);
            if (b.tipo === 'inicial') {
              y = escribirParrafoMixto([{ texto: 'Sin registrar deficiencias.', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
            }
            (b.deficiencias || []).forEach((g, gi) => { if (gi > 0) y += 9; grupoDeficienciaPDF(g, margen + 8, listaCod); });
            if (b.nota) {
              y = escribirParrafoMixto([{ texto: 'Nota:', negrita: true }, { texto: b.nota, negrita: false }], margen + 8, anchoUtil - 8, y, 9);
            }
            y += 4;
          });
        }
        y += 9; // renglón en blanco entre inspecciones
      });
      y += 4;
    });
  }

  function otrosPDF(porDependencia) {
    const deps = Object.keys(porDependencia);
    if (!deps.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin novedades adicionales.', margen, y);
      y += 16;
      return;
    }
    deps.forEach(dep => {
      saltoDePaginaSiHaceFalta(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${dep}:`, margen, y);
      y += 13;
      porDependencia[dep].forEach(b => {
        y = escribirParrafoMixto([{ texto: b.titulo, negrita: true }], margen + 8, anchoUtil - 8, y, 9);
        if (b.tipoBloque === 'texto') {
          y = escribirParrafoMixto([{ texto: b.contenido || '', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        } else {
          y = escribirParrafoMixto([{ texto: '(tabla — ver detalle en el sistema)', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        }
        y += 8;
      });
      y += 4;
    });
  }

  function guardiaPDF(saliente, entrante) {
    [['GUARDIA SALIENTE:', saliente], ['GUARDIA ENTRANTE:', entrante]].forEach(([titulo, personas]) => {
      saltoDePaginaSiHaceFalta(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(titulo, margen, y);
      y += 13;
      personas.forEach(p => {
        y = escribirParrafoMixto([{ texto: '•', negrita: false }, { texto: `${p.rol}:`, negrita: true }, { texto: p.nombre, negrita: false }], margen + 8, anchoUtil - 8, y, 9.5);
        y += 2;
      });
      y += 8;
    });
  }

  function casosPDF(bloque, esSAR) {
    const deps = Object.keys(bloque.porDependencia);
    if (!deps.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin casos cargados.', margen, y);
      y += 16;
      return;
    }
    deps.forEach(dep => {
      saltoDePaginaSiHaceFalta(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${dep}:`, margen, y);
      y += 13;

      bloque.porDependencia[dep].forEach(c => {
        const estadoTxt = c.estado === 'pendiente' ? 'PENDIENTE' : 'CERRADO';
        y = escribirParrafoMixto([{ texto: `${c.titulo} — ${estadoTxt}`, negrita: true }], margen + 8, anchoUtil - 8, y, 9.5);

        if (esSAR) {
          const runsSar = [
            { texto: 'N.º de caso:', negrita: true }, { texto: (c.numeroCaso || '—') + '  ', negrita: false },
            { texto: 'Subcentro (VTS):', negrita: true }, { texto: (c.subcentroVTS || '—') + '  ', negrita: false },
            { texto: 'Inicio:', negrita: true }, { texto: c.fechaInicio || '—', negrita: false }
          ];
          if (c.fechaCierre) { runsSar.push({ texto: '  Cierre:', negrita: true }, { texto: c.fechaCierre, negrita: false }); }
          y = escribirParrafoMixto(runsSar, margen + 8, anchoUtil - 8, y, 8.5);
        }

        y = escribirParrafoMixto([{ texto: 'Posición:', negrita: true }, { texto: c.posicion || '—', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        y = escribirParrafoMixto([{ texto: 'Características:', negrita: true }, { texto: c.caracteristicas || '—', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        y = escribirParrafoMixto([{ texto: 'Situación:', negrita: true }, { texto: c.situacion || '—', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        y = escribirParrafoMixto([{ texto: 'Novedad:', negrita: true }, { texto: c.novedad || '—', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        y += 10;
      });
      y += 4;
    });
  }

  encabezadoInstitucional();

  secciones.forEach(sec => {
    tituloSeccion(sec.titulo);
    if (sec.referencias) referenciasSeccion(sec.referencias);

    const c = sec.contenido;
    if (typeof c === 'string') {
      listaSimple(c.split('\n').filter(Boolean));
    } else if (c && c.tipo === 'lista') {
      listaSimple(c.items);
    } else if (c && c.tipo === 'inspecciones') {
      grupoInspeccionesPDF(c.grupo, c.familia);
    } else if (c && c.tipo === 'casos') {
      casosPDF(c.bloque, c.esSAR);
    } else if (c && c.tipo === 'otros') {
      otrosPDF(c.porDependencia);
    } else if (c && c.tipo === 'guardia') {
      guardiaPDF(c.saliente, c.entrante);
    } else if (c && c.tipo === 'tablas') {
      c.tablas.forEach(t => tabla(t.columnas, t.filas, t.titulo, t.anchos, { banda: t.banda, pie: t.pie }));
      if (c.nota) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(c.nota, margen, y);
        doc.setTextColor(20, 20, 20);
        y += 14;
      }
    }
    y += 12;
  });

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Página ${p} de ${totalPaginas}`, anchoPagina - margen, altoPagina - 24, { align: 'right' });
  }

  doc.save(nombreArchivo);
  guardarCopiaEnDrive(doc, nombreArchivo);
}

/**
 * Manda una copia del PDF ya generado al Apps Script desplegado
 * como Web App, que la guarda en la carpeta de Drive configurada.
 * No bloquea ni condiciona la descarga local: si falla, solo se
 * avisa por consola.
 */
function guardarCopiaEnDrive(doc, nombreArchivo) {
  if (typeof GUARDADO_EN_DRIVE_ACTIVO === 'undefined' || !GUARDADO_EN_DRIVE_ACTIVO) return;

  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1];

  fetch(APPS_SCRIPT_WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      archivoBase64: base64,
      nombreArchivo: nombreArchivo,
      carpetaId: CARPETA_DRIVE_ID
    })
  })
    .then(r => r.json())
    .then(res => {
      if (!res.ok) console.error('No se pudo guardar el PDF en Drive:', res.error);
    })
    .catch(err => console.error('No se pudo contactar el Apps Script para guardar en Drive:', err));
}

/** Lista los PDFs guardados en Drive y los muestra en un modal, con link para abrir cada uno. */
async function abrirModalPDFsArchivados() {
  cerrarModalExportar();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalPDFsArchivados';
  modal.innerHTML = `
    <div class="modal-caja">
      <div class="modal-header">
        <h3>PDFs archivados en Drive</h3>
        <button type="button" onclick="document.getElementById('modalPDFsArchivados').remove()">✕</button>
      </div>
      <div class="modal-lista" id="listaPDFsArchivados"><div class="placeholder-panel">Consultando Drive…</div></div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="document.getElementById('modalPDFsArchivados').remove()">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const resp = await fetch(`${APPS_SCRIPT_WEBAPP_URL}?carpetaId=${encodeURIComponent(CARPETA_DRIVE_ID)}`);
    const datos = await resp.json();
    const cont = document.getElementById('listaPDFsArchivados');
    if (!cont) return; // el usuario ya cerró el modal
    if (!datos.ok) {
      cont.innerHTML = `<div class="placeholder-panel">No se pudo consultar Drive: ${esc(datos.error || '')}</div>`;
      return;
    }
    if (!datos.archivos.length) {
      cont.innerHTML = '<div class="placeholder-panel">Todavía no hay PDFs archivados en la carpeta.</div>';
      return;
    }
    cont.innerHTML = datos.archivos.map(a => `
      <a href="${esc(a.url)}" target="_blank" rel="noopener" style="display:flex; justify-content:space-between; gap:10px; padding:9px 0; border-bottom:1px solid var(--gris-100); font-size:13px; color:var(--azul-medio);">
        <span>${esc(a.nombre)}</span>
        <span style="color:var(--gris-500); font-size:11.5px; white-space:nowrap;">${esc(new Date(a.fecha).toLocaleDateString('es-AR'))}</span>
      </a>
    `).join('');
  } catch (err) {
    const cont = document.getElementById('listaPDFsArchivados');
    if (cont) cont.innerHTML = '<div class="placeholder-panel">No se pudo conectar con Drive. Revisá la configuración en integraciones-config.js.</div>';
  }
}

function textoPlano(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || d.innerText || '';
}

function referenciasRuns(pares) {
  const runs = [{ texto: 'REFERENCIAS:', negrita: true }];
  pares.forEach(([abrev, desc]) => {
    runs.push({ texto: `(${abrev})`, negrita: true });
    runs.push({ texto: desc, negrita: false });
  });
  return runs;
}

const REFERENCIAS_TEXTO = referenciasRuns([
  ['II', 'Inspección Inicial.'],
  ['ID', 'Inspección Más Detallada.'],
  ['IS', 'Inspección de Seguimiento.']
]);
const REFERENCIAS_PSC_TEXTO = referenciasRuns([
  ['IISD', 'Inspección Inicial Sin Deficiencias.'],
  ['IICD', 'Inspección Inicial Con Deficiencia.'],
  ['IS', 'Inspección de Seguimiento.']
]);

// Orden fijo en el que se arma el PDF, independiente del orden en
// que se tildaron los checkboxes. "inicio" se maneja aparte: su
// resumen va primero y su bloque de altura/calados/guardia al final.
const ORDEN_EXPORTACION = ['insp-extraordinarias', 'insp-psc', 'casos-mas', 'casos-sar', 'otros', 'oficinas', 'buques-detencion', 'insp-tecnicas', 'control-gestion', 'licencias', 'cursos'];

// ---------- Exportar desde Guardias (todo el parte diario) ----------
function abrirModalExportarGuardia() {
  // "estadisticas" y "asistente" no entran: son herramientas de
  // análisis/búsqueda, no secciones del parte diario que se firma.
  const pestanasExportables = PESTANAS.filter(p => p.id !== 'estadisticas' && p.id !== 'asistente');
  const items = pestanasExportables.map(p => ({ id: p.id, label: p.etiqueta }));
  abrirModalExportarGenerico('Exportar Novedades DPSN', items, (seleccionados) => {
    let secciones = [];

    if (seleccionados.includes('inicio')) {
      secciones.push({ titulo: 'Resumen del Parte', contenido: { tipo: 'lista', items: itemsResumenParte() } });
    }

    ORDEN_EXPORTACION.forEach(id => {
      if (!seleccionados.includes(id)) return;
      const generarSecciones = TEXTO_EXPORTACION[id];
      if (!generarSecciones) return;
      secciones = secciones.concat(generarSecciones());
    });

    if (seleccionados.includes('inicio')) {
      secciones.push({ titulo: 'Relevo de Guardia', contenido: contenidoGuardia() });
    }

    generarPDF(`Novedades DPSN ${fechaHoy()}.pdf`, 'RESUMEN DE NOVEDADES', fechaParteActual(), secciones);
    archivarParteDelDia();
  });
}
