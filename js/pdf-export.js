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
    doc.setFontSize(13);
    doc.text('RESUMEN DE NOVEDADES', anchoPagina / 2, y, { align: 'center' });
    y += 15;
    if (subtitulo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(subtitulo, anchoPagina / 2, y, { align: 'center' });
      y += 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PREFECTURA NAVAL ARGENTINA', anchoPagina / 2, y, { align: 'center' });
    y += 13;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Autoridad Marítima', anchoPagina / 2, y, { align: 'center' });
    y += 13;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('DIRECCIÓN DE POLICÍA DE SEGURIDAD DE LA NAVEGACIÓN', anchoPagina / 2, y, { align: 'center' });
    y += 12;
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

  function referenciasSeccion(texto) {
    saltoDePaginaSiHaceFalta(14);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(texto, anchoPagina / 2, y, { align: 'center', maxWidth: anchoUtil });
    y += 16;
    doc.setTextColor(20, 20, 20);
  }

  /**
   * Escribe un párrafo con tramos de distinto peso (negrita/normal) que
   * fluyen en la misma línea y se van ajustando con el ancho disponible.
   * runs: [{ texto, negrita }]. Devuelve el nuevo y.
   */
  function escribirParrafoMixto(runs, x, anchoMax, yInicial, tamano) {
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
    lineas.forEach(linea => {
      if (y2 + 11 > altoPagina - 46) { doc.addPage(); y2 = margen; }
      let cx = x;
      linea.forEach(w => {
        doc.setFont('helvetica', w.negrita ? 'bold' : 'normal');
        doc.text(w.texto, cx, y2);
        cx += doc.getStringUnitWidth(w.texto) * tamano / doc.internal.scaleFactor + espacio;
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

  /** Tabla con bordes reales; el encabezado ajusta su alto si el texto no entra en una línea. */
  function tabla(columnas, filas, tituloTabla) {
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

    const anchoCol = anchoUtil / columnas.length;

    function dibujarEncabezado() {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6);
      const lineasEncabezado = columnas.map(c => doc.splitTextToSize(String(c), anchoCol - 8));
      const maxLineas = Math.max(1, ...lineasEncabezado.map(l => l.length));
      const altoEncabezado = maxLineas * 9 + 8;

      doc.setFillColor(235, 235, 235);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.5);
      doc.rect(margen, y, anchoUtil, altoEncabezado, 'FD');
      doc.setTextColor(20, 20, 20);
      lineasEncabezado.forEach((lns, i) => {
        if (i > 0) doc.line(margen + i * anchoCol, y, margen + i * anchoCol, y + altoEncabezado);
        lns.forEach((ln, li) => {
          doc.text(ln, margen + i * anchoCol + 4, y + 10 + li * 9);
        });
      });
      doc.rect(margen, y, anchoUtil, altoEncabezado);
      y += altoEncabezado;
    }

    saltoDePaginaSiHaceFalta(40);
    dibujarEncabezado();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    filas.forEach(fila => {
      const lineasCelda = fila.map(celda => doc.splitTextToSize(String(celda), anchoCol - 8));
      const maxLineas = Math.max(1, ...lineasCelda.map(l => l.length));
      const altoEstaFila = maxLineas * 9 + 7;

      if (y + altoEstaFila > altoPagina - 46) {
        doc.addPage();
        y = margen;
        dibujarEncabezado();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
      }

      doc.setDrawColor(190, 190, 190);
      doc.rect(margen, y, anchoUtil, altoEstaFila);
      lineasCelda.forEach((lns, i) => {
        if (i > 0) doc.line(margen + i * anchoCol, y, margen + i * anchoCol, y + altoEstaFila);
        lns.forEach((ln, li) => {
          doc.text(ln, margen + i * anchoCol + 4, y + 10 + li * 9);
        });
      });
      y += altoEstaFila;
    });
    y += 14;
  }

  function grupoDeficienciaPDF(g, xIndent) {
    const cant = g.cantidad || 1;
    const verbo = g.accion === 'recodifico'
      ? (cant > 1 ? 'Se recodificaron ' : 'Se recodificó ')
      : (cant > 1 ? 'Se detectaron ' : 'Se detectó ');
    const contenido = g.accion === 'recodifico'
      ? `${numeroALetras(cant)} (${numeroConDigitos(cant)}) Def. Cód. ${g.codigoAnterior} (${descripcionCodigo(g.codigoAnterior)}) a Cód. ${g.codigoNuevo} (${descripcionCodigo(g.codigoNuevo)}).`
      : `${numeroALetras(cant)} (${numeroConDigitos(cant)}) Def. Cód. ${g.codigo} (${descripcionCodigo(g.codigo)}).`;

    y = escribirParrafoMixto([{ texto: verbo, negrita: false }, { texto: contenido, negrita: true }], xIndent, anchoUtil - (xIndent - margen), y, 9);

    const lineasDesc = (g.descripcionAdicional || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (lineasDesc.length === 1) {
      y = escribirParrafoMixto([{ texto: lineasDesc[0], negrita: true }], xIndent + 8, anchoUtil - (xIndent - margen) - 8, y, 9);
    } else if (lineasDesc.length > 1) {
      lineasDesc.forEach(l => {
        y = escribirParrafoMixto([{ texto: '- ' + l, negrita: true }], xIndent + 8, anchoUtil - (xIndent - margen) - 8, y, 9);
      });
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
        let marca;
        if (familia === 'psc') {
          marca = insp.tipo === 'inicial' ? '(IISD)' : insp.tipo === 'detallada' ? '(IICD)' : `(IS de ID Fecha ${insp.fechaInspMasDetallada || '—'})`;
        } else {
          marca = insp.tipo === 'inicial' ? '(II)' : insp.tipo === 'detallada' ? '(ID)' : `(IS de ID Fecha ${insp.fechaInspMasDetallada || '—'})`;
        }
        const refIdentif = familia === 'psc' ? 'IMO' : 'Mat.';
        let tituloTexto = `${marca} ${insp.buque.tipo} "${insp.buque.nombre}" (${refIdentif} ${insp.buque.matricula}) B/${insp.buque.bandera}`;
        if (insp.asunto) tituloTexto += `, referente ${insp.asunto}`;
        if (familia === 'psc' && insp.nota) tituloTexto += `. Próx. puerto: ${insp.nota}`;
        tituloTexto += '.';

        y = escribirParrafoMixto([{ texto: tituloTexto, negrita: true }], margen + 8, anchoUtil - 8, y, 9);

        if (insp.tipo === 'inicial') {
          y = escribirParrafoMixto([{ texto: 'Sin registrar deficiencias.', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        }
        (insp.deficiencias || []).forEach(g => grupoDeficienciaPDF(g, margen + 8));

        if (familia !== 'psc' && insp.nota) {
          y = escribirParrafoMixto([{ texto: 'Nota: ' + insp.nota, negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        }
        y += 9; // renglón en blanco entre inspecciones
      });
      y += 4;
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
        y = escribirParrafoMixto([{ texto: 'Novedad:', negrita: true }, { texto: c.novedad || '—', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        y = escribirParrafoMixto([{ texto: 'Características:', negrita: true }, { texto: c.caracteristicas || '—', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
        y = escribirParrafoMixto([{ texto: 'Situación:', negrita: true }, { texto: c.situacion || '—', negrita: false }], margen + 8, anchoUtil - 8, y, 9);
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
    } else if (c && c.tipo === 'tablas') {
      c.tablas.forEach(t => tabla(t.columnas, t.filas, t.titulo));
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

const REFERENCIAS_TEXTO = 'REFERENCIAS: (II) Inspección Inicial. (ID) Inspección Más Detallada. (IS) Inspección de Seguimiento.';
const REFERENCIAS_PSC_TEXTO = 'REFERENCIAS: (IISD) Inspección Inicial Sin Deficiencias. (IICD) Inspección Inicial Con Deficiencia. (IS) Inspección de Seguimiento.';

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
      secciones.push({ titulo: 'Altura de Agua, Calados de Navegación y Relevo de Guardia', contenido: { tipo: 'lista', items: itemsAlturaCaladosGuardia() } });
    }

    generarPDF(`Novedades DPSN ${fechaHoy()}.pdf`, 'RESUMEN DE NOVEDADES', D.fechaParte, secciones);
    archivarParteDelDia();
  });
}
