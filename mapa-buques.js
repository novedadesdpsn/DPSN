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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 18
  }).addTo(mapaBuquesDetencionInstancia);

  // Etiqueta propia y fija — "Islas Malvinas", sin depender de cómo
  // las nombre el servidor de tiles.
  L.marker([-51.7, -59.5], {
    icon: L.divIcon({
      className: 'etiqueta-malvinas',
      html: '<div style="background:rgba(11,22,38,0.85); color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:3px; white-space:nowrap;">Islas Malvinas (Arg.)</div>',
      iconSize: [0, 0]
    }),
    interactive: false
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
          <div class="campo"><label>Latitud</label><input type="text" id="mbLat" value="${esc(latPrecargada || '')}"></div>
          <div class="campo"><label>Longitud</label><input type="text" id="mbLon" value="${esc(lonPrecargada || '')}"></div>
        </div>
        <div class="fila-doble">
          <div class="campo"><label>Prefectura de Zona</label><input type="text" id="mbPrefecturaZona" placeholder="Ej: PZDE"></div>
          <div class="campo"><label>Dependencia</label><input type="text" id="mbDependencia" placeholder="Ej: DLUJ"></div>
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

    const prefecturaZona = document.getElementById('mbPrefecturaZona').value.trim();
    const dependencia = document.getElementById('mbDependencia').value.trim();
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
