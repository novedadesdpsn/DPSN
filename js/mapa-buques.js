// ============================================================
// MAPA DE BUQUES CON DETENCIÓN — Novedades DPSN
// ============================================================
// Mapa de Argentina (Leaflet + OpenStreetMap) donde se cargan las
// posiciones de los buques con detención. Cada carga desde acá se
// agrega automáticamente también a la tabla de la pestaña "Buques
// con Detención" (sin pisar lo que ya esté cargado ahí a mano),
// usando el mismo correlativo de N.º y el mismo sistema de
// deficiencias por código (17/30/99).
//
// Nota sobre el mapa base: los tiles de OpenStreetMap son
// generados por un servidor externo y traen sus propias etiquetas
// (en el caso de Malvinas, en inglés). Para que siempre se vea
// correcto para nosotros, se agrega una etiqueta propia fija
// encima del mapa con el nombre correcto — no depende del tile.
// ============================================================

let mapaBuquesDetencionInstancia = null;
let capaMarcadoresBuques = null;

function inicializarMapaBuquesDetencion() {
  const contenedor = document.getElementById('mapaBuquesDetencion');
  if (!contenedor) return;

  if (mapaBuquesDetencionInstancia) {
    mapaBuquesDetencionInstancia.remove();
    mapaBuquesDetencionInstancia = null;
  }

  mapaBuquesDetencionInstancia = L.map(contenedor, { scrollWheelZoom: false }).setView([-38.5, -63.5], 4);
  // Mapa base oficial del Instituto Geográfico Nacional (IGN Argentina):
  // muestra "Islas Malvinas" y los límites según la cartografía argentina.
  L.tileLayer('https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png', {
    attribution: 'Mapa base &copy; <a href="https://www.ign.gob.ar" target="_blank">Instituto Geográfico Nacional</a> + OpenStreetMap',
    minZoom: 3,
    maxZoom: 18
  }).addTo(mapaBuquesDetencionInstancia);

  capaMarcadoresBuques = L.layerGroup().addTo(mapaBuquesDetencionInstancia);
  dibujarMarcadoresBuquesDetencion();

  if (!SOLO_LECTURA_ACTUAL) {
    mapaBuquesDetencionInstancia.on('click', (e) => {
      uiAgregarBuqueDetencionMapa(e.latlng.lat.toFixed(5), e.latlng.lng.toFixed(5));
    });
  }
}

function dibujarMarcadoresBuquesDetencion() {
  if (!capaMarcadoresBuques) return;
  capaMarcadoresBuques.clearLayers();

  D.buquesDetencionMapa.forEach((b, idx) => {
    const marker = L.marker([b.lat, b.lon]).addTo(capaMarcadoresBuques);
    const defs = (b.deficienciasLista && b.deficienciasLista.length) ? textoDeficienciasDetencion(b.deficienciasLista) : '—';
    marker.bindPopup(`
      <div style="font-family:inherit; font-size:12.5px; min-width:200px;">
        <strong>${esc(b.tipoBuque)} "${esc(b.nombre)}"</strong><br>
        Matrícula: ${esc(b.matricula)} · Bandera: ${esc(b.bandera)}<br>
        Puerto: ${esc(b.puerto)}<br>
        Dependencia: ${esc(b.prefecturaZona)} — ${esc(b.dependencia)}<br>
        Fecha: ${esc(b.fecha)} · Tipo Insp.: ${esc(b.tipoInsp)}<br>
        Deficiencias: ${defs}
        ${!SOLO_LECTURA_ACTUAL ? `<div style="margin-top:8px;"><button onclick="eliminarBuqueDetencionMapa(${idx})" style="background:var(--rojo,#dc4a3f); color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Eliminar</button></div>` : ''}
      </div>
    `);
  });
}

function uiAgregarBuqueDetencionMapa(latPrecargada, lonPrecargada) {
  cerrarModalInspeccion();
  let lista = [];
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modalInspeccion';
  modal.innerHTML = `
    <div class="modal-caja ancho">
      <div class="modal-header"><h3>Agregar buque con detención</h3><button type="button" onclick="cerrarModalInspeccion()">✕</button></div>
      <div class="modal-campos">
        <div class="fila-doble">
          <div class="campo"><label>Prefectura de Zona</label>
            <select id="mbPrefecturaZona">
              <option value="">— Elegí la zona —</option>
              ${DEPENDENCIAS_PNA.map(z => `<option value="${z.zona}">${z.zona} — ${esc(z.nombre)}</option>`).join('')}
              <option value="__otra">Otra ubicación (cargar a mano)</option>
            </select>
          </div>
          <div class="campo"><label>Dependencia</label>
            <select id="mbDependencia" disabled><option value="">— Primero elegí la zona —</option></select>
          </div>
        </div>
        <div class="campo oculto" id="mbBloqueLibre"><label>Dependencia / lugar (texto libre)</label><input type="text" id="mbDependenciaLibre" placeholder="Ej: Zona de fondeo Recalada"></div>
        <div id="mbAvisoPos" style="font-size:11.5px; color:var(--gris-500); margin:-4px 0 10px;"></div>
        <div class="fila-doble">
          <div class="campo"><label>Latitud</label><input type="text" id="mbLat" value="${esc(latPrecargada || '')}"></div>
          <div class="campo"><label>Longitud</label><input type="text" id="mbLon" value="${esc(lonPrecargada || '')}"></div>
        </div>
        <div class="fila-doble">
          <div class="campo"><label>Tipo de buque</label><input type="text" id="mbTipoBuque" placeholder="L/M, B/P, B/M, B/T..."></div>
          <div class="campo"><label>Nombre del buque</label><input type="text" id="mbNombre"></div>
        </div>
        <div class="fila-doble">
          <div class="campo"><label>Matrícula</label><input type="text" id="mbMatricula"></div>
          <div class="campo"><label>Bandera</label><input type="text" id="mbBandera"></div>
        </div>
        <div class="fila-doble">
          <div class="campo"><label>Puerto</label><input type="text" id="mbPuerto"></div>
          <div class="campo"><label>Fecha</label><input type="text" id="mbFecha" value="${esc(fechaHoy().replace(/-/g, '/'))}"></div>
        </div>
        <div class="campo"><label>Tipo de inspección (ej: ID)</label><input type="text" id="mbTipoInsp"></div>
        <div class="campo">
          <label>Deficiencias cargadas</label>
          <div id="mbListaDeficiencias" style="margin-bottom:10px;"></div>
          <div style="background:var(--gris-100); border-radius:var(--radio); padding:12px;">
            <div class="fila-doble">
              <div class="campo" style="margin-bottom:8px;"><label>Cantidad</label><select id="mbCantidad">${opcionesCantidadHtml()}</select></div>
              <div class="campo" style="margin-bottom:8px;"><label>Código</label>
                <select id="mbCodigo">${CODIGOS_DETENCION.map(cod => `<option value="${cod}">Cód. ${cod} — ${esc(descripcionCodigo(cod))}</option>`).join('')}</select>
              </div>
            </div>
            <button type="button" class="btn-secundario" id="mbBtnAgregarDef">+ Agregar deficiencia</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secundario" type="button" onclick="cerrarModalInspeccion()">Cancelar</button>
        <button class="btn-primario" type="button" id="mbBtnGuardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Zona → dependencias (cuatrigrama) → el pin se ubica solo.
  const selZona = document.getElementById('mbPrefecturaZona');
  const selDep = document.getElementById('mbDependencia');
  const aviso = document.getElementById('mbAvisoPos');
  if (latPrecargada) { selZona.value = '__otra'; document.getElementById('mbBloqueLibre').classList.remove('oculto'); aviso.textContent = 'Ubicación tomada del clic en el mapa. Podés elegir una dependencia para que se ubique sola.'; }
  selZona.addEventListener('change', () => {
    document.getElementById('mbBloqueLibre').classList.toggle('oculto', selZona.value !== '__otra');
    const zona = DEPENDENCIAS_PNA.find(z => z.zona === selZona.value);
    if (!zona) {
      selDep.innerHTML = '<option value="">' + (selZona.value === '__otra' ? '— Usá el texto libre —' : '— Primero elegí la zona —') + '</option>';
      selDep.disabled = true;
      return;
    }
    selDep.disabled = false;
    selDep.innerHTML = '<option value="">— Elegí la dependencia —</option>' +
      zona.dependencias.map((d, i) => `<option value="${i}">${d.cuatri ? esc(d.cuatri) + ' — ' : ''}${esc(d.nombre)}</option>`).join('');
  });
  selDep.addEventListener('change', () => {
    const zona = DEPENDENCIAS_PNA.find(z => z.zona === selZona.value);
    const d = zona && zona.dependencias[parseInt(selDep.value, 10)];
    if (!d) return;
    document.getElementById('mbLat').value = d.lat;
    document.getElementById('mbLon').value = d.lon;
    aviso.textContent = d.aprox ? 'Ubicación aproximada de la dependencia — podés ajustar latitud/longitud si hace falta.' : 'Ubicación cargada automáticamente.';
  });

  function renderizarLista() {
    const cont = document.getElementById('mbListaDeficiencias');
    if (!lista.length) { cont.innerHTML = '<div style="font-size:12px; color:var(--gris-500);">Todavía no agregaste ninguna.</div>'; return; }
    cont.innerHTML = lista.map((d, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid var(--gris-300); border-radius:6px; padding:6px 10px; margin-bottom:6px; font-size:12px;">
        <span>Cód. ${esc(d.codigo)} (${String(d.cantidad).padStart(2, '0')})</span>
        <button type="button" data-idx="${i}" class="mbQuitar" style="background:none;border:none;color:var(--rojo);font-size:14px;">✕</button>
      </div>`).join('');
    cont.querySelectorAll('.mbQuitar').forEach(btn => {
      btn.addEventListener('click', () => { lista.splice(parseInt(btn.dataset.idx, 10), 1); renderizarLista(); });
    });
  }
  renderizarLista();

  document.getElementById('mbBtnAgregarDef').addEventListener('click', () => {
    lista.push({ cantidad: parseInt(document.getElementById('mbCantidad').value, 10), codigo: document.getElementById('mbCodigo').value });
    renderizarLista();
  });

  document.getElementById('mbBtnGuardar').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('mbLat').value);
    const lon = parseFloat(document.getElementById('mbLon').value);
    if (isNaN(lat) || isNaN(lon)) { alert('Latitud y longitud tienen que ser números.'); return; }

    const zonaSel = DEPENDENCIAS_PNA.find(z => z.zona === selZona.value);
    const depSel = zonaSel && zonaSel.dependencias[parseInt(selDep.value, 10)];
    const prefecturaZona = zonaSel ? zonaSel.zona : '';
    const dependencia = depSel ? (depSel.cuatri || depSel.nombre) : document.getElementById('mbDependenciaLibre').value.trim();
    const tipoBuque = document.getElementById('mbTipoBuque').value.trim();
    const nombre = document.getElementById('mbNombre').value.trim();
    const matricula = document.getElementById('mbMatricula').value.trim();
    const bandera = document.getElementById('mbBandera').value.trim();
    const puerto = document.getElementById('mbPuerto').value.trim();
    const fecha = document.getElementById('mbFecha').value.trim();
    const tipoInsp = document.getElementById('mbTipoInsp').value.trim();

    const idVinculo = 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    D.buquesDetencionMapa.push({
      lat, lon, prefecturaZona, dependencia, tipoBuque, nombre, matricula, bandera, puerto,
      fecha, tipoInsp, deficienciasLista: lista, idVinculo
    });

    // Se agrega sola a la tabla de Buques con Detención, sin pisar lo que ya haya.
    D.buquesDetencion.push({
      numero: D.buquesDetencion.length + 1,
      dependencia: [prefecturaZona, dependencia].filter(Boolean).join(' — '),
      buque: `${tipoBuque} "${nombre}" (${matricula})`,
      fecha, tipoInsp, deficienciasLista: lista, idVinculo
    });

    cerrarModalInspeccion();
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarBuqueDetencionMapa(idx) {
  if (!confirm('¿Eliminar este buque del mapa? (También se va a sacar de la tabla de Buques con Detención si se agregó junto con esto.)')) return;
  const entrada = D.buquesDetencionMapa[idx];
  D.buquesDetencionMapa.splice(idx, 1);

  if (entrada && entrada.idVinculo) {
    const i = D.buquesDetencion.findIndex(b => b.idVinculo === entrada.idVinculo);
    if (i !== -1) {
      D.buquesDetencion.splice(i, 1);
      D.buquesDetencion.forEach((b, j) => { b.numero = j + 1; });
    }
  }
  persistirDatosGuardia();
  refrescarPestanaActual();
}
