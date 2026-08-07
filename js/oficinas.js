// ============================================================
// MÓDULO OFICINAS — Novedades DPSN
// ============================================================
// Cada oficina tiene una lista de "bloques": tabla o documento.
// Por ahora se guardan en localStorage (namespace por oficina)
// como reemplazo temporal, hasta que quede conectado Firestore.
// Cuando eso pase, estas mismas funciones (agregarBloque,
// eliminarBloque, etc.) van a escribir a Firestore en vez de
// localStorage, y el render se dispara con onSnapshot.
// ============================================================

const OFICINAS_LIST = [
  { id: "personal-navegacion", nombre: "Personal de la Navegación" },
  { id: "reglamentacion", nombre: "Reglamentación" },
  { id: "gestion-seguridad", nombre: "Gestión de la Seguridad" },
  { id: "documentacion", nombre: "Documentación" },
  { id: "control-buques", nombre: "Control de Buques" },
  { id: "navegacion", nombre: "Navegación" },
  { id: "archivo-tecnico", nombre: "Archivo Técnico" },
  { id: "electricidad", nombre: "Electricidad" },
  { id: "maquinas", nombre: "Máquinas" },
  { id: "construccion-naval", nombre: "Construcción Naval" },
  { id: "francobordo-arqueo", nombre: "Francobordo y Arqueo" },
  { id: "historial-elenco", nombre: "Historial y Elenco" },
  { id: "inspecciones-tecnicas-of", nombre: "Inspecciones Técnicas" },
  { id: "registro-empresas", nombre: "Registro de Empresas" },
  { id: "embarcaciones-menores", nombre: "Embarcaciones Menores y Deportivas" },
  { id: "registro-nacional-buques", nombre: "Registro Nacional de Buques" },
  { id: "gestion-calidad", nombre: "Gestión de Calidad" }
];

function claveStorage(oficinaId) { return `novedades_dpsn_oficina_${oficinaId}`; }

function obtenerBloques(oficinaId) {
  const raw = localStorage.getItem(claveStorage(oficinaId));
  return raw ? JSON.parse(raw) : [];
}

function guardarBloques(oficinaId, bloques) {
  localStorage.setItem(claveStorage(oficinaId), JSON.stringify(bloques));
}

function agregarBloque(oficinaId, bloque) {
  const bloques = obtenerBloques(oficinaId);
  bloque.id = 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  bloque.seleccionado = true;
  bloques.push(bloque);
  guardarBloques(oficinaId, bloques);
  return bloque.id;
}

function eliminarBloque(oficinaId, bloqueId) {
  const bloques = obtenerBloques(oficinaId).filter(b => b.id !== bloqueId);
  guardarBloques(oficinaId, bloques);
}

function actualizarBloque(oficinaId, bloqueId, cambios) {
  const bloques = obtenerBloques(oficinaId);
  const b = bloques.find(x => x.id === bloqueId);
  if (b) Object.assign(b, cambios);
  guardarBloques(oficinaId, bloques);
}

// ---------- Render del panel de una oficina ----------
function renderOficina(oficina, soloLectura) {
  const bloques = obtenerBloques(oficina.id);

  let html = `<div class="tarjeta">
    <h2>${esc(oficina.nombre)} <span class="contador">${bloques.length} bloque(s)</span></h2>
    <div id="listaBloques-${oficina.id}">`;

  if (!bloques.length) {
    html += `<div class="placeholder-panel">Todavía no hay información cargada en esta oficina.</div>`;
  } else {
    bloques.forEach(b => { html += renderBloque(oficina.id, b, soloLectura); });
  }

  html += `</div>`;

  if (!soloLectura) {
    html += `
      <div class="acciones-oficina">
        <button class="btn-secundario" type="button" onclick="uiAgregarBloqueTabla('${oficina.id}')">+ Agregar tabla</button>
        <button class="btn-secundario" type="button" onclick="uiAgregarBloqueTexto('${oficina.id}')">+ Agregar texto</button>
        <label class="btn-secundario" style="cursor:pointer;">
          + Importar Excel
          <input type="file" class="input-archivo-oculto" accept=".xlsx,.xls,.csv" onchange="importarExcel(event, '${oficina.id}')">
        </label>
        <label class="btn-secundario" style="cursor:pointer;">
          + Importar Word
          <input type="file" class="input-archivo-oculto" accept=".docx" onchange="importarWord(event, '${oficina.id}')">
        </label>
      </div>`;
  }

  html += `
      <div style="margin-top:16px; border-top:1px solid var(--gris-100); padding-top:14px;">
        <button class="btn-primario" type="button" onclick="abrirModalExportarOficina('${oficina.id}', '${esc(oficina.nombre)}')">Exportar PDF</button>
      </div>
    </div>`;

  return html;
}

function renderBloque(oficinaId, b, soloLectura) {
  const disabled = soloLectura ? 'disabled' : '';
  let cuerpo = '';
  if (b.tipo === 'tabla') {
    cuerpo = renderTablaEditable(oficinaId, b, soloLectura);
  } else {
    const vacio = !b.contenido;
    cuerpo = `<div class="${soloLectura ? '' : 'bloque-doc-editable'}" style="${vacio ? 'color:var(--gris-500); font-style:italic;' : ''}" ${soloLectura ? '' : `contenteditable="true" onfocus="if(!this.textContent.trim()){this.innerHTML='';}" onblur="actualizarBloque('${oficinaId}','${b.id}',{contenido:this.innerHTML})"`}>${b.contenido || (soloLectura ? '(sin contenido)' : 'Hacé clic aquí para escribir...')}</div>`;
  }

  return `
    <div class="bloque-oficina" data-bloque-id="${b.id}">
      <div class="bloque-header">
        <input type="checkbox" ${b.seleccionado !== false ? 'checked' : ''}
          onchange="actualizarBloque('${oficinaId}','${b.id}',{seleccionado:this.checked})">
        <strong>${esc(b.titulo)}</strong>
        <span class="tipo-pill">${b.tipo === 'tabla' ? 'Tabla' : (b.tipo === 'texto' ? 'Texto' : 'Documento')}</span>
        <div class="bloque-acciones">
          <button type="button" ${disabled} onclick="if(confirm('¿Eliminar este bloque?')){eliminarBloque('${oficinaId}','${b.id}'); mostrarPestana(sessionStorage.getItem('novedades_dpsn_tab_actual'));}">✕</button>
        </div>
      </div>
      <div class="bloque-body">${cuerpo}</div>
    </div>
  `;
}

function renderTablaEditable(oficinaId, b, soloLectura) {
  const columnas = b.columnas || [];
  const filas = b.filas || [];
  let html = `<table class="tabla-datos tabla-editable"><thead><tr>`;
  columnas.forEach((c, ci) => { html += `<th>${esc(c)}</th>`; });
  html += `</tr></thead><tbody>`;
  filas.forEach((fila, fi) => {
    html += `<tr>`;
    fila.forEach((celda, ci) => {
      html += soloLectura
        ? `<td>${esc(celda)}</td>`
        : `<td contenteditable="true" onblur="editarCeldaTabla('${oficinaId}','${b.id}',${fi},${ci},this.textContent)">${esc(celda)}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  if (!soloLectura) {
    html += `
      <div class="tabla-editable-acciones">
        <button class="btn-secundario" type="button" onclick="agregarFilaTabla('${oficinaId}','${b.id}')">+ Fila</button>
        <button class="btn-secundario" type="button" onclick="agregarColumnaTabla('${oficinaId}','${b.id}')">+ Columna</button>
      </div>`;
  }
  return html;
}

function editarCeldaTabla(oficinaId, bloqueId, filaIdx, colIdx, valor) {
  const bloques = obtenerBloques(oficinaId);
  const b = bloques.find(x => x.id === bloqueId);
  if (!b) return;
  b.filas[filaIdx][colIdx] = valor;
  guardarBloques(oficinaId, bloques);
}

function agregarFilaTabla(oficinaId, bloqueId) {
  const bloques = obtenerBloques(oficinaId);
  const b = bloques.find(x => x.id === bloqueId);
  if (!b) return;
  b.filas.push(new Array(b.columnas.length).fill(''));
  guardarBloques(oficinaId, bloques);
  refrescarPestanaActual();
}

function agregarColumnaTabla(oficinaId, bloqueId) {
  const nombre = prompt('Nombre de la nueva columna:');
  if (!nombre) return;
  const bloques = obtenerBloques(oficinaId);
  const b = bloques.find(x => x.id === bloqueId);
  if (!b) return;
  b.columnas.push(nombre);
  b.filas.forEach(f => f.push(''));
  guardarBloques(oficinaId, bloques);
  refrescarPestanaActual();
}

// ---------- Acciones desde la UI ----------
function uiAgregarBloqueTabla(oficinaId) {
  const titulo = prompt('Título de la tabla:', 'Nueva tabla');
  if (!titulo) return;
  agregarBloque(oficinaId, {
    tipo: 'tabla',
    titulo,
    columnas: ['Concepto', 'Detalle', 'Fecha'],
    filas: [['', '', '']]
  });
  refrescarPestanaActual();
}

function uiAgregarBloqueTexto(oficinaId) {
  const titulo = prompt('Título del bloque de texto:', 'Nueva novedad');
  if (!titulo) return;
  agregarBloque(oficinaId, {
    tipo: 'texto',
    titulo,
    contenido: ''
  });
  refrescarPestanaActual();
}

// ---------- Importación de Excel (SheetJS) ----------
function importarExcel(evento, oficinaId) {
  const archivo = evento.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: 'array' });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '' });
    if (!datos.length) { alert('El archivo Excel está vacío.'); return; }
    const columnas = datos[0].map(String);
    const filas = datos.slice(1).map(f => columnas.map((_, i) => String(f[i] ?? '')));
    agregarBloque(oficinaId, {
      tipo: 'tabla',
      titulo: archivo.name.replace(/\.(xlsx|xls|csv)$/i, ''),
      columnas, filas
    });
    refrescarPestanaActual();
  };
  lector.readAsArrayBuffer(archivo);
  evento.target.value = '';
}

// ---------- Importación de Word (mammoth.js) ----------
function importarWord(evento, oficinaId) {
  const archivo = evento.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = (e) => {
    mammoth.convertToHtml({ arrayBuffer: e.target.result })
      .then(resultado => {
        agregarBloque(oficinaId, {
          tipo: 'documento',
          titulo: archivo.name.replace(/\.docx$/i, ''),
          contenido: resultado.value
        });
        refrescarPestanaActual();
      })
      .catch(() => alert('No se pudo leer el archivo Word. Verificá que sea un .docx válido.'));
  };
  lector.readAsArrayBuffer(archivo);
  evento.target.value = '';
}

function refrescarPestanaActual() {
  const idActual = sessionStorage.getItem('novedades_dpsn_tab_actual');
  if (idActual) mostrarPestana(idActual);
}
