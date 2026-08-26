// ============================================================
// MAPA DE BUQUES CON DETENCIÓN — Novedades DPSN
// ============================================================
// Mapa de Argentina (Leaflet + OpenStreetMap) donde se cargan las
// posiciones de los buques con detención. Los datos se guardan
// junto con el resto de la carga directa (ver datos-guardia.js).
// ============================================================

let mapaBuquesDetencionInstancia = null;
let capaMarcadoresBuques = null;

function inicializarMapaBuquesDetencion() {
  const contenedor = document.getElementById('mapaBuquesDetencion');
  if (!contenedor) return;

  // Si ya había una instancia (por navegar entre pestañas), se destruye
  // y se vuelve a crear sobre el nuevo contenedor del DOM.
  if (mapaBuquesDetencionInstancia) {
    mapaBuquesDetencionInstancia.remove();
    mapaBuquesDetencionInstancia = null;
  }

  mapaBuquesDetencionInstancia = L.map(contenedor, { scrollWheelZoom: false }).setView([-38.5, -63.5], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
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
    const codigos = (b.deficiencias || []).map(d => `Cód. ${esc(d.codigo)} — ${esc(d.descripcion)}`).join('<br>');
    marker.bindPopup(`
      <div style="font-family:inherit; font-size:12.5px; min-width:200px;">
        <strong>${esc(b.tipoBuque)} "${esc(b.nombre)}"</strong><br>
        Matrícula: ${esc(b.matricula)} · Bandera: ${esc(b.bandera)}<br>
        Puerto: ${esc(b.puerto)}<br>
        Deficiencias (${b.deficiencias ? b.deficiencias.length : 0}):<br>${codigos || '—'}
        ${!SOLO_LECTURA_ACTUAL ? `<div style="margin-top:8px;"><button onclick="eliminarBuqueDetencionMapa(${idx})" style="background:var(--rojo,#dc4a3f); color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Eliminar</button></div>` : ''}
      </div>
    `);
  });
}

function uiAgregarBuqueDetencionMapa(latPrecargada, lonPrecargada) {
  abrirModalFormulario('Agregar buque con detención', [
    { id: 'lat', label: 'Latitud', default: latPrecargada || '' },
    { id: 'lon', label: 'Longitud', default: lonPrecargada || '' },
    { id: 'tipoBuque', label: 'Tipo de buque (L/M, B/P, B/M, B/T...)' },
    { id: 'nombre', label: 'Nombre del buque' },
    { id: 'matricula', label: 'Matrícula' },
    { id: 'bandera', label: 'Bandera' },
    { id: 'puerto', label: 'Puerto' },
    { id: 'codigosDeficiencia', label: 'Códigos de deficiencia (separados por coma)' }
  ], {}, (datos) => {
    const lat = parseFloat(datos.lat);
    const lon = parseFloat(datos.lon);
    if (isNaN(lat) || isNaN(lon)) { alert('Latitud y longitud tienen que ser números.'); return; }
    D.buquesDetencionMapa.push({
      lat, lon,
      tipoBuque: datos.tipoBuque, nombre: datos.nombre, matricula: datos.matricula,
      bandera: datos.bandera, puerto: datos.puerto,
      deficiencias: construirDeficiencias(datos.codigosDeficiencia)
    });
    persistirDatosGuardia();
    refrescarPestanaActual();
  });
}

function eliminarBuqueDetencionMapa(idx) {
  if (!confirm('¿Eliminar este buque del mapa?')) return;
  D.buquesDetencionMapa.splice(idx, 1);
  persistirDatosGuardia();
  refrescarPestanaActual();
}
