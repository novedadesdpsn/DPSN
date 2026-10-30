// ============================================================
// IMPORTAR EXCEL — Oficinas (Novedades DPSN)
// ============================================================
// Lee un .xlsx en el navegador (librería SheetJS, cargada por CDN
// en dashboard.html) y auto-completa las tablas de Oficinas
// matcheando columnas por el texto de su encabezado, no por
// posición fija. Dos variantes:
//   - uiAbrirImportarExcelSimple: tabla simple (Fecha/GDE/Detalle
//     del trámite) de Control de Gestión y División Navegación.
//   - uiAbrirImportarExcelDocumentacion: las 3 secciones apiladas
//     en una sola hoja (Trámites en Análisis / Certificados de
//     Arqueo-Bodega-Francobordo / Girados a TNAV) de Documentación.
// En ambos casos, importar reemplaza por completo lo que ya
// hubiera cargado (con confirmación antes de pisarlo).
// ============================================================

function _normTxtImportar(s) {
  return String(s == null ? '' : s)
    .toUpperCase()
    .replace(/[ºÓ°]/g, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/[.\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _formatearFechaCeldaExcel(v) {
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    const yyyy = y.length === 2 ? '20' + y : y;
    return `${d.padStart(2, '0')}/${mo.padStart(2, '0')}/${yyyy}`;
  }
  return s;
}

function _leerHojaComoMatriz(ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
}

function _filaTieneContenido(fila) {
  return Array.isArray(fila) && fila.some(c => String(c == null ? '' : c).trim());
}

function _esFilaDuplicadaDeHeader(fila, header) {
  const a = (fila || []).map(c => _normTxtImportar(c)).join('|');
  const b = (header || []).map(c => _normTxtImportar(c)).join('|');
  return !!a && a === b;
}

// Algunas planillas (celdas combinadas que se "desarman" al leer) dejan una
// fila espuria debajo del encabezado real, que repite -total o parcialmente-
// el texto de las columnas (ej.: la celda "Servicio" vuelve a decir
// "SERVICIO" en vez de un servicio real). Si TODAS las celdas no vacías que
// mapeamos para esta sección son un eco del propio encabezado de su columna,
// la tratamos como artefacto y no como un trámite real.
function _esFilaEcoDeHeader(fila, header, mapa) {
  // Comparamos contra TODA la fila de encabezado (no solo la misma columna):
  // el artefacto puede venir "corrido" una columna por celdas combinadas que
  // se desarman al leer, como pasa en el modelo real de Documentación.
  const headerNorm = (header || []).map(c => _normTxtImportar(c)).filter(Boolean);
  let consideradas = 0, coincidencias = 0;
  Object.values(mapa).forEach(colIdx => {
    const valorCelda = _normTxtImportar(fila[colIdx]);
    if (valorCelda.length < 3) return;
    consideradas++;
    if (headerNorm.some(h => h === valorCelda || h.includes(valorCelda))) coincidencias++;
  });
  return consideradas >= 2 && coincidencias === consideradas;
}

// ---------- Tabla simple (Fecha / GDE / Detalle del trámite) ----------

function _detectarColumnasSimple(headerRow) {
  const mapa = {};
  (headerRow || []).forEach((h, i) => {
    const t = _normTxtImportar(h);
    const tc = t.replace(/\s+/g, '');
    if (!t) return;
    if (mapa.fecha === undefined && t.includes('FECHA')) mapa.fecha = i;
    else if (mapa.gde === undefined && tc.includes('GDE')) mapa.gde = i;
    else if (mapa.expediente === undefined && (t.includes('EXPEDIENTE') || t.includes('DETALLE') || t.includes('TRAMITE'))) mapa.expediente = i;
  });
  return mapa;
}

function _parsearExcelSimple(workbook) {
  for (const nombreHoja of workbook.SheetNames) {
    const filas = _leerHojaComoMatriz(workbook.Sheets[nombreHoja]);
    for (let f = 0; f < Math.min(filas.length, 10); f++) {
      const mapa = _detectarColumnasSimple(filas[f]);
      if (mapa.fecha !== undefined && mapa.gde !== undefined && mapa.expediente !== undefined) {
        const datos = [];
        for (let r = f + 1; r < filas.length; r++) {
          const fila = filas[r];
          if (!_filaTieneContenido(fila)) continue;
          const fecha = _formatearFechaCeldaExcel(fila[mapa.fecha]);
          const gde = String(fila[mapa.gde] == null ? '' : fila[mapa.gde]).trim();
          const expediente = String(fila[mapa.expediente] == null ? '' : fila[mapa.expediente]).trim();
          if (!fecha && !gde && !expediente) continue;
          datos.push({ fecha, gde, expediente });
        }
        return { ok: true, hoja: nombreHoja, filas: datos };
      }
    }
  }
  return { ok: false };
}

// ---------- Documentación: hoja con 3 secciones apiladas ----------

function _mapearEncabezados(headerRow, reglas) {
  const mapa = {};
  (headerRow || []).forEach((celda, i) => {
    const t = _normTxtImportar(celda);
    if (!t) return;
    for (const [campo, pred] of reglas) {
      if (mapa[campo] !== undefined) continue;
      if (pred(t)) { mapa[campo] = i; break; }
    }
  });
  return mapa;
}

function _extraerFilasSeccion(filas, inicioHeader, finExclusivo, mapa, camposFecha) {
  const header = filas[inicioHeader] || [];
  const camposNoNumericos = Object.keys(mapa).filter(c => c !== 'numero' && c !== 'numeroIngreso');
  const resultado = [];
  for (let r = inicioHeader + 1; r < Math.min(finExclusivo, filas.length); r++) {
    const fila = filas[r] || [];
    if (!_filaTieneContenido(fila)) continue;
    if (_esFilaDuplicadaDeHeader(fila, header)) continue;
    if (_esFilaEcoDeHeader(fila, header, mapa)) continue;
    const obj = {};
    let tieneContenido = false;
    Object.keys(mapa).forEach(campo => {
      let v = fila[mapa[campo]];
      v = (camposFecha && camposFecha.includes(campo)) ? _formatearFechaCeldaExcel(v) : String(v == null ? '' : v).trim();
      obj[campo] = v;
      if (camposNoNumericos.includes(campo) && v) tieneContenido = true;
    });
    if (tieneContenido) resultado.push(obj);
  }
  return resultado;
}

function _buscarHojaProgebu(workbook) {
  for (const nombreHoja of workbook.SheetNames) {
    const filas = _leerHojaComoMatriz(workbook.Sheets[nombreHoja]);
    let filaTramites, filaArqueo, filaTnav;
    filas.forEach((fila, i) => {
      const texto = _normTxtImportar(fila.join(' '));
      if (filaTramites === undefined && texto.includes('ANALISIS') && texto.includes('TRAMITE')) filaTramites = i;
      if (filaArqueo === undefined && texto.includes('ARQUEO')) filaArqueo = i;
      if (filaTnav === undefined && texto.includes('TNAV')) filaTnav = i;
    });
    if (filaTramites !== undefined && filaArqueo !== undefined && filaTnav !== undefined &&
        filaTramites < filaArqueo && filaArqueo < filaTnav) {
      return { nombreHoja, filas, filaTramites, filaArqueo, filaTnav };
    }
  }
  return null;
}

function _parsearExcelProgebu(workbook) {
  const encontrado = _buscarHojaProgebu(workbook);
  if (!encontrado) return { ok: false };
  const { nombreHoja, filas, filaTramites, filaArqueo, filaTnav } = encontrado;

  const reglasTramites = [
    ['numero', t => t === 'N'],
    ['vuelve', t => t.includes('VUELVE')],
    ['ingresoProgebu', t => t.includes('PROGEBU')],
    ['vtoCnsn', t => t.includes('VTO') || t.includes('CNSN') || t.includes('PRORROGA')],
    ['usuarioSolicitante', t => t.includes('USUARIO')],
    ['tramite', t => t === 'TRAMITE' || (t.includes('TRAMITE') && !t.includes('ANALISIS'))],
    ['servicio', t => t.includes('SERVICIO')],
    ['nombre', t => t === 'NOMBRE'],
    ['especialidades', t => t.includes('ESPECIALIDAD')],
    ['solicita', t => t.includes('SOLICITA')],
    ['observacion', t => t.includes('OBSERVACION')]
  ];
  const reglasArqueo = [
    ['numeroIngreso', t => t.includes('INGRESO')],
    ['usuarioSolicitante', t => t.includes('USUARIO')],
    ['servicio', t => t.includes('SERVICIO')],
    ['nombre', t => t === 'NOMBRE'],
    ['solicita', t => t.includes('SOLICITA')]
  ];
  const reglasTnav = [
    ['numero', t => t === 'N'],
    ['fecha', t => t.includes('FECHA')],
    ['usuario', t => t === 'USUARIO'],
    ['servicio', t => t.includes('SERVICIO')],
    ['nombreMatricula', t => t.includes('NOMBRE')],
    ['solicita', t => t.includes('SOLICITA')]
  ];

  const mapaTramites = _mapearEncabezados(filas[filaTramites + 1], reglasTramites);
  const mapaArqueo = _mapearEncabezados(filas[filaArqueo + 1], reglasArqueo);
  const mapaTnav = _mapearEncabezados(filas[filaTnav + 1], reglasTnav);

  const tramitesAnalisis = _extraerFilasSeccion(filas, filaTramites + 1, filaArqueo, mapaTramites, ['ingresoProgebu', 'vtoCnsn']);
  const certificadosArqueo = _extraerFilasSeccion(filas, filaArqueo + 1, filaTnav, mapaArqueo);
  const giradosTNAV = _extraerFilasSeccion(filas, filaTnav + 1, filas.length, mapaTnav, ['fecha']);

  return { ok: true, hoja: nombreHoja, tramitesAnalisis, certificadosArqueo, giradosTNAV };
}

// ---------- UI común: modal con zona de arrastrar/examinar ----------

function cerrarModalImportarExcel() {
  const m = document.getElementById('modalImportarExcel');
  if (m) m.remove();
}

function _construirZonaCargaExcel(idInput) {
  return `
    <div class="zona-drop" id="zonaDrop_${idInput}">
      <input type="file" id="${idInput}" accept=".xlsx,.xls" class="oculto">
      <div class="zona-drop-texto">
        <strong>Arrastrá el archivo Excel aquí</strong>
        <span>o</span>
        <button type="button" class="btn-secundario" onclick="document.getElementById('${idInput}').click()">Examinar archivo</button>
      </div>
      <div class="zona-drop-nombre oculto" id="zonaDropNombre_${idInput}"></div>
    </div>`;
}

function _activarZonaCargaExcel(idInput, onArchivo) {
  const input = document.getElementById(idInput);
  const zona = document.getElementById('zonaDrop_' + idInput);
  const nombreEl = document.getElementById('zonaDropNombre_' + idInput);

  function recibir(file) {
    if (!file) return;
    nombreEl.textContent = file.name;
    nombreEl.classList.remove('oculto');
    const reader = new FileReader();
    reader.onload = (e) => onArchivo(e.target.result, null);
    reader.onerror = () => onArchivo(null, 'No se pudo leer el archivo.');
    reader.readAsArrayBuffer(file);
  }

  input.addEventListener('change', () => recibir(input.files[0]));
  zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('arrastrando'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('arrastrando'));
  zona.addEventListener('drop', (e) => {
    e.preventDefault();
    zona.classList.remove('arrastrando');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) recibir(e.dataTransfer.files[0]);
  });
}

// ---------- Importar Excel — tabla simple ----------

function uiAbrirImportarExcelSimple(clave, titulo) {
  cerrarModalImportarExcel();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalImportarExcel';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header">
        <h3>Importar Excel — ${esc(titulo)}</h3>
        <button type="button" onclick="cerrarModalImportarExcel()">✕</button>
      </div>
      <div class="modal-campos">
        <p style="font-size:12.5px; color:var(--gris-700); margin-top:0;">
          Se buscan las columnas <strong>Fecha</strong>, <strong>GDE</strong> y <strong>Detalle del trámite</strong> (o "Expedientes en tramitación") por su nombre de encabezado.
          Al confirmar, esta importación <strong>reemplaza todas las filas que ya están cargadas</strong> en ${esc(titulo)}.
        </p>
        ${_construirZonaCargaExcel('inputExcelSimple')}
        <div id="previaExcelSimple" style="margin-top:14px;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalImportarExcel()">Cancelar</button>
        <button class="btn-primario oculto" type="button" id="btnConfirmarImportarSimple">Reemplazar e importar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  let filasDetectadas = null;
  const previa = document.getElementById('previaExcelSimple');
  const btnConfirmar = document.getElementById('btnConfirmarImportarSimple');

  _activarZonaCargaExcel('inputExcelSimple', (arrayBuffer, errorLectura) => {
    if (errorLectura) {
      previa.innerHTML = `<div class="placeholder-panel">${esc(errorLectura)}</div>`;
      btnConfirmar.classList.add('oculto');
      filasDetectadas = null;
      return;
    }
    try {
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const resultado = _parsearExcelSimple(wb);
      if (!resultado.ok || !resultado.filas.length) {
        previa.innerHTML = `<div class="placeholder-panel">No se encontraron columnas de Fecha / GDE / Detalle del trámite reconocibles en este archivo.</div>`;
        btnConfirmar.classList.add('oculto');
        filasDetectadas = null;
        return;
      }
      filasDetectadas = resultado.filas;
      previa.innerHTML = `
        <p style="font-size:12.5px; font-weight:600; color:var(--azul-marino);">Se detectaron ${resultado.filas.length} fila(s) en la hoja "${esc(resultado.hoja)}":</p>
        <div style="max-height:260px; overflow-y:auto;">${tablaConFilas(['Fecha', 'GDE', 'Detalle del trámite'], ['fecha', 'gde', 'expediente'], resultado.filas.slice(0, 50), null)}</div>
        ${resultado.filas.length > 50 ? `<p style="font-size:11.5px; color:var(--gris-500);">Mostrando las primeras 50 de ${resultado.filas.length}.</p>` : ''}`;
      btnConfirmar.classList.remove('oculto');
    } catch (err) {
      previa.innerHTML = `<div class="placeholder-panel">No se pudo leer el archivo (¿es un .xlsx válido?).</div>`;
      btnConfirmar.classList.add('oculto');
      filasDetectadas = null;
    }
  });

  btnConfirmar.addEventListener('click', () => {
    if (!filasDetectadas) return;
    const actuales = D.oficinas[clave].filas.length;
    const aviso = actuales
      ? `Esto va a reemplazar las ${actuales} fila(s) que ya hay cargadas en ${titulo} por las ${filasDetectadas.length} del Excel. ¿Confirmás?`
      : `¿Confirmás importar ${filasDetectadas.length} fila(s) a ${titulo}?`;
    if (!confirm(aviso)) return;
    D.oficinas[clave].filas = filasDetectadas;
    persistirDatosGuardia();
    cerrarModalImportarExcel();
    refrescarPestanaActual();
  });
}

// ---------- Importar Excel — Documentación (3 secciones) ----------

function uiAbrirImportarExcelDocumentacion() {
  cerrarModalImportarExcel();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalImportarExcel';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header">
        <h3>Importar Excel — Documentación</h3>
        <button type="button" onclick="cerrarModalImportarExcel()">✕</button>
      </div>
      <div class="modal-campos">
        <p style="font-size:12.5px; color:var(--gris-700); margin-top:0;">
          Se busca, dentro del Excel, la hoja que tenga las 3 secciones "Trámites en Análisis", "Solicitudes Certificados de Arqueo/Bodega/Francobordo" y "Girados a TNAV", y se autocompletan las 3 tablas por el nombre de cada columna. Las demás hojas del archivo se ignoran.
          Al confirmar, esta importación <strong>reemplaza por completo las 3 tablas</strong> de Documentación.
        </p>
        ${_construirZonaCargaExcel('inputExcelDocumentacion')}
        <div id="previaExcelDocumentacion" style="margin-top:14px;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalImportarExcel()">Cancelar</button>
        <button class="btn-primario oculto" type="button" id="btnConfirmarImportarDocumentacion">Reemplazar e importar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  let resultadoDetectado = null;
  const previa = document.getElementById('previaExcelDocumentacion');
  const btnConfirmar = document.getElementById('btnConfirmarImportarDocumentacion');

  function previaSeccion(titulo, filas, columnas, campos) {
    return `
      <p style="font-size:12.5px; font-weight:600; color:var(--azul-marino); margin:14px 0 4px;">${esc(titulo)} — ${filas.length} fila(s) detectada(s)</p>
      ${filas.length
        ? `<div style="max-height:200px; overflow-y:auto;">${tablaConFilas(columnas, campos, filas.slice(0, 20), null)}</div>${filas.length > 20 ? `<p style="font-size:11px; color:var(--gris-500);">Mostrando las primeras 20 de ${filas.length}.</p>` : ''}`
        : '<div class="placeholder-panel" style="padding:20px;">Sin filas detectadas en esta sección.</div>'}`;
  }

  _activarZonaCargaExcel('inputExcelDocumentacion', (arrayBuffer, errorLectura) => {
    if (errorLectura) {
      previa.innerHTML = `<div class="placeholder-panel">${esc(errorLectura)}</div>`;
      btnConfirmar.classList.add('oculto');
      resultadoDetectado = null;
      return;
    }
    try {
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const resultado = _parsearExcelProgebu(wb);
      if (!resultado.ok) {
        previa.innerHTML = `<div class="placeholder-panel">No se encontró, en ninguna hoja del archivo, una que tenga las 3 secciones "Trámites en Análisis", "Certificados de Arqueo" y "Girados a TNAV".</div>`;
        btnConfirmar.classList.add('oculto');
        resultadoDetectado = null;
        return;
      }
      resultadoDetectado = resultado;
      previa.innerHTML = `
        <p style="font-size:12.5px; color:var(--gris-700);">Hoja detectada: "<strong>${esc(resultado.hoja)}</strong>"</p>` +
        previaSeccion('Trámites en Análisis',
          resultado.tramitesAnalisis,
          ['N.º', 'Vuelve', 'Ingreso PROGEBU', 'Usuario Sol.', 'Vto. CNSN/Prórroga', 'Trámite', 'Servicio', 'Nombre', 'Especialidades', 'Solicita', 'Observación'],
          ['numero', 'vuelve', 'ingresoProgebu', 'usuarioSolicitante', 'vtoCnsn', 'tramite', 'servicio', 'nombre', 'especialidades', 'solicita', 'observacion']) +
        previaSeccion('Solicitudes Certificados de Arqueo',
          resultado.certificadosArqueo,
          ['N.º Ingreso', 'Usuario Sol.', 'Servicio', 'Nombre', 'Solicita'],
          ['numeroIngreso', 'usuarioSolicitante', 'servicio', 'nombre', 'solicita']) +
        previaSeccion('Girados a TNAV',
          resultado.giradosTNAV,
          ['N.º', 'Fecha', 'Usuario', 'Servicio', 'Nombre y Matrícula', 'Solicita'],
          ['numero', 'fecha', 'usuario', 'servicio', 'nombreMatricula', 'solicita']);
      btnConfirmar.classList.remove('oculto');
    } catch (err) {
      previa.innerHTML = `<div class="placeholder-panel">No se pudo leer el archivo (¿es un .xlsx válido?).</div>`;
      btnConfirmar.classList.add('oculto');
      resultadoDetectado = null;
    }
  });

  btnConfirmar.addEventListener('click', () => {
    if (!resultadoDetectado) return;
    const doc = D.oficinas.documentacion;
    const totalActual = doc.tramitesAnalisis.length + doc.certificadosArqueo.length + doc.giradosTNAV.length;
    const totalNuevo = resultadoDetectado.tramitesAnalisis.length + resultadoDetectado.certificadosArqueo.length + resultadoDetectado.giradosTNAV.length;
    const aviso = totalActual
      ? `Esto va a reemplazar las ${totalActual} fila(s) que ya hay cargadas entre las 3 tablas de Documentación por las ${totalNuevo} del Excel. ¿Confirmás?`
      : `¿Confirmás importar ${totalNuevo} fila(s) a las 3 tablas de Documentación?`;
    if (!confirm(aviso)) return;
    doc.tramitesAnalisis = resultadoDetectado.tramitesAnalisis;
    doc.certificadosArqueo = resultadoDetectado.certificadosArqueo;
    doc.giradosTNAV = resultadoDetectado.giradosTNAV;
    persistirDatosGuardia();
    cerrarModalImportarExcel();
    refrescarPestanaActual();
  });
}
