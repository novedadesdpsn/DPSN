// ============================================================
// EXPORTACIÓN A PDF — Novedades DPSN
// ============================================================
// Un mismo modal sirve para exportar desde Guardias (todo el
// parte diario, título "Novedades DPSN (fecha)") o desde una
// oficina puntual (título "Novedades (oficina) (fecha)").
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

function generarPDF(tituloDocumento, secciones) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margen = 44;
  let y = margen;
  const anchoUtil = 595 - margen * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(tituloDocumento, margen, y);
  y += 22;
  doc.setDrawColor(180);
  doc.line(margen, y, 595 - margen, y);
  y += 20;

  secciones.forEach(sec => {
    if (y > 760) { doc.addPage(); y = margen; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(sec.titulo, margen, y);
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lineas = doc.splitTextToSize(sec.texto || '(sin contenido)', anchoUtil);
    lineas.forEach((linea, idx) => {
      if (y > 780) { doc.addPage(); y = margen; }
      const esUltimaLinea = idx === lineas.length - 1;
      if (esUltimaLinea) {
        doc.text(linea, margen, y);
      } else {
        doc.text(linea, margen, y, { align: 'justify', maxWidth: anchoUtil });
      }
      y += 13;
    });
    y += 12;
  });

  doc.save(tituloDocumento.replace(/[^\w\- ]/g, '') + '.pdf');
}

function textoPlano(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || d.innerText || '';
}

// ---------- Exportar desde Guardias (todo el parte diario) ----------
function abrirModalExportarGuardia() {
  const items = PESTANAS.map(p => ({ id: p.id, label: p.etiqueta }));
  abrirModalExportarGenerico('Exportar Novedades DPSN', items, (seleccionados) => {
    const secciones = seleccionados.map(id => {
      const p = PESTANAS.find(x => x.id === id);
      const html = p.render();
      return { titulo: p.etiqueta, texto: textoPlano(html) };
    });
    generarPDF(`Novedades DPSN ${fechaHoy()}`, secciones);
  });
}

// ---------- Exportar desde una oficina puntual ----------
function abrirModalExportarOficina(oficinaId, nombreOficina) {
  const bloques = obtenerBloques(oficinaId);
  if (!bloques.length) { alert('Esta oficina todavía no tiene bloques cargados para exportar.'); return; }
  const items = bloques.map(b => ({ id: b.id, label: b.titulo }));
  abrirModalExportarGenerico(`Exportar ${nombreOficina}`, items, (seleccionados) => {
    const secciones = bloques.filter(b => seleccionados.includes(b.id)).map(b => ({
      titulo: b.titulo,
      texto: b.tipo === 'tabla'
        ? [b.columnas.join(' | '), ...b.filas.map(f => f.join(' | '))].join('\n')
        : textoPlano(b.contenido)
    }));
    generarPDF(`Novedades ${nombreOficina} ${fechaHoy()}`, secciones);
  });
}
