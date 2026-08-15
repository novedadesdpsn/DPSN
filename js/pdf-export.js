// ============================================================
// EXPORTACIÓN A PDF — Novedades DPSN
// ============================================================
// Formato pensado para parecerse al parte oficial: encabezado
// institucional centrado (sin colores de fondo), referencias en
// cursiva, dependencias en negrita, ítems con viñeta, y los
// cuadros numéricos como tablas reales con bordes — igual que en
// el PDF de referencia.
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
 * donde `contenido` puede ser:
 *   - un string (texto corrido, con negrita automática en líneas
 *     tipo "DEPENDENCIA:" y justificado)
 *   - un objeto { texto?, tablas?: [{ titulo?, columnas, filas }] }
 *     para secciones con cuadros numéricos reales.
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
    doc.text(texto.toUpperCase(), margen, y);
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
    const lineas = doc.splitTextToSize(texto, anchoUtil);
    lineas.forEach(ln => {
      saltoDePaginaSiHaceFalta(11);
      doc.text(ln, margen, y);
      y += 10;
    });
    doc.setTextColor(20, 20, 20);
    y += 6;
  }

  function parrafo(texto) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const lineas = doc.splitTextToSize(texto || '(sin contenido)', anchoUtil);
    lineas.forEach((ln, idx) => {
      saltoDePaginaSiHaceFalta(13);
      const esSubtitulo = /^[A-ZÁÉÍÓÚÑ0-9 /.]+:$/.test(ln.trim()) && ln.trim().length < 40;
      const esUltimaLinea = idx === lineas.length - 1;
      if (esSubtitulo) {
        doc.setFont('helvetica', 'bold');
        doc.text(ln, margen, y);
        doc.setFont('helvetica', 'normal');
      } else if (esUltimaLinea) {
        doc.text(ln, margen, y);
      } else {
        doc.text(ln, margen, y, { align: 'justify', maxWidth: anchoUtil });
      }
      y += 12.5;
    });
  }

  /** Tabla con bordes reales, encabezado en negrita con fondo gris claro. */
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
    const altoFila = 16;

    function dibujarEncabezado() {
      doc.setFillColor(235, 235, 235);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.5);
      doc.rect(margen, y, anchoUtil, altoFila, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      columnas.forEach((c, i) => {
        doc.text(String(c), margen + i * anchoCol + 4, y + 11, { maxWidth: anchoCol - 6 });
        if (i > 0) doc.line(margen + i * anchoCol, y, margen + i * anchoCol, y + altoFila);
      });
      doc.rect(margen, y, anchoUtil, altoFila);
      y += altoFila;
    }

    saltoDePaginaSiHaceFalta(altoFila * 2);
    dibujarEncabezado();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    filas.forEach(fila => {
      // Alto de fila dinámico según el texto más largo de la fila
      const lineasCelda = fila.map((celda, i) => doc.splitTextToSize(String(celda), anchoCol - 6));
      const maxLineas = Math.max(1, ...lineasCelda.map(l => l.length));
      const altoEstaFila = Math.max(altoFila, maxLineas * 9 + 6);

      if (y + altoEstaFila > altoPagina - 46) {
        doc.addPage();
        y = margen;
        dibujarEncabezado();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      doc.setDrawColor(190, 190, 190);
      doc.rect(margen, y, anchoUtil, altoEstaFila);
      lineasCelda.forEach((lineas, i) => {
        if (i > 0) doc.line(margen + i * anchoCol, y, margen + i * anchoCol, y + altoEstaFila);
        lineas.forEach((ln, li) => {
          doc.text(ln, margen + i * anchoCol + 4, y + 10 + li * 9, { maxWidth: anchoCol - 6 });
        });
      });
      y += altoEstaFila;
    });
    y += 14;
  }

  encabezadoInstitucional();

  secciones.forEach(sec => {
    tituloSeccion(sec.titulo);
    if (sec.referencias) referenciasSeccion(sec.referencias);

    const contenido = sec.contenido;
    if (typeof contenido === 'string') {
      parrafo(contenido);
    } else if (contenido && typeof contenido === 'object') {
      if (contenido.texto) parrafo(contenido.texto);
      if (contenido.tablas) {
        if (contenido.texto) y += 6;
        contenido.tablas.forEach(t => tabla(t.columnas, t.filas, t.titulo));
      }
    }
    y += 10;
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
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita el preflight CORS con Apps Script
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

function textoPlano(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || d.innerText || '';
}

const REFERENCIAS_TEXTO = 'REFERENCIAS: (II) Inspección Inicial. (ID) Inspección Más Detallada. (IS) Inspección de Seguimiento.';

// ---------- Exportar desde Guardias (todo el parte diario) ----------
function abrirModalExportarGuardia() {
  // "estadisticas" y "asistente" no entran: son herramientas de
  // análisis/búsqueda, no secciones del parte diario que se firma.
  const pestanasExportables = PESTANAS.filter(p => p.id !== 'estadisticas' && p.id !== 'asistente');
  const items = pestanasExportables.map(p => ({ id: p.id, label: p.etiqueta }));
  abrirModalExportarGenerico('Exportar Novedades DPSN', items, (seleccionados) => {
    const secciones = seleccionados.map(id => {
      const p = pestanasExportables.find(x => x.id === id);
      const generarContenido = TEXTO_EXPORTACION[id];
      const referencias = (id === 'insp-extraordinarias' || id === 'insp-psc' || id === 'buques-detencion') ? REFERENCIAS_TEXTO : null;
      return { titulo: p.etiqueta, referencias, contenido: generarContenido ? generarContenido() : '(sección sin generador de texto)' };
    });
    generarPDF(`Novedades DPSN ${fechaHoy()}.pdf`, 'RESUMEN DE NOVEDADES', D.fechaParte, secciones);
  });
}
