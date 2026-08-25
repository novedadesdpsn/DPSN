/**
 * ============================================================
 * PUENTE GOOGLE SHEETS → FIRESTORE — Novedades DPSN
 * ============================================================
 * Este script va PEGADO en el editor de Apps Script de tu
 * Google Sheet (Extensiones > Apps Script), no en el repositorio
 * de GitHub. Cada vez que se edita una celda, envía esa hoja
 * completa a Firestore, y el dashboard la lee en vivo desde ahí.
 *
 * CONFIGURACIÓN NECESARIA (una sola vez):
 * 1. En Firebase Console > Configuración del proyecto > Cuentas
 *    de servicio > Generar nueva clave privada (te descarga un
 *    JSON). NO subas ese archivo a ningún lado público.
 * 2. En este script: Configuración del proyecto (ícono de
 *    tuerca) > Propiedades del script > agregá:
 *      FIREBASE_PROJECT_ID   = el projectId de tu Firebase
 *      FIREBASE_CLIENT_EMAIL = el client_email del JSON
 *      FIREBASE_PRIVATE_KEY   = el private_key del JSON (completo,
 *                                 con los \n incluidos)
 * 3. Extensiones > Apps Script > Servicios > agregá la librería
 *    "OAuth2 for Apps Script" (ID: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF)
 *    — la necesitamos para autenticar contra Firestore.
 * 4. Ejecutá una vez la función `instalarTrigger` desde el editor
 *    (te va a pedir autorización) y listo: a partir de ahí, cada
 *    edición en la hoja sincroniza sola.
 *
 * QUÉ HOJA MAPEA A QUÉ COLECCIÓN:
 * Este ejemplo asume una hoja llamada "InspeccionesExtraordinarias"
 * con columnas: Bandera | Dependencia | Tipo | Buque_Tipo |
 * Buque_Nombre | Matricula | Codigos_Deficiencia | Nota
 * Podemos agregar una función mapeadora por cada hoja (Casos MAS,
 * Casos SAR, PSC, etc.) siguiendo el mismo patrón.
 * ============================================================
 */

function instalarTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('alEditarHoja')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

function alEditarHoja(e) {
  const hoja = e.range.getSheet().getName();
  if (hoja === 'InspeccionesExtraordinarias') {
    sincronizarInspeccionesExtraordinarias();
  } else if (hoja === 'CasosMAS') {
    sincronizarCasosMAS();
  } else if (hoja === 'Licencias') {
    sincronizarLicencias();
  }
  // Para el resto de las hojas (EstadoRectorPuerto, CasosSAR, Otros,
  // BuquesDetencion, InspeccionesTecnicas, ControlGestion, Cursos)
  // se agrega un "else if" más, siguiendo el mismo patrón que estas
  // tres: leer filas con encabezados, armar el objeto, y llamar a
  // escribirEnFirestore('parteDiario/<seccion>', { valor: tuObjeto })
  // — el { valor: ... } es obligatorio: así es como la plataforma
  // guarda y lee cada sección en Firestore. La guía completa con
  // las columnas exactas de cada hoja está en GUIA_GOOGLE_SHEETS.md.
}

/** Patrón "agrupado por dependencia + estado" — sirve de modelo para CasosSAR también. */
function sincronizarCasosMAS() {
  const hoja = SpreadsheetApp.getActive().getSheetByName('CasosMAS');
  const filas = hoja.getDataRange().getValues();
  const encabezados = filas.shift();

  const porDependencia = {};
  filas.filter(f => f.some(c => c !== '')).forEach(fila => {
    const it = {};
    encabezados.forEach((col, i) => { it[col] = fila[i]; });
    const dep = it.Dependencia || 'SIN_DEP';
    if (!porDependencia[dep]) porDependencia[dep] = [];
    porDependencia[dep].push({
      estado: String(it.Estado || 'pendiente').toLowerCase(),
      titulo: it.Titulo || '',
      asunto: it.Asunto || '',
      posicion: it.Posicion || '',
      novedad: it.Novedad || '',
      caracteristicas: it.Caracteristicas || '',
      situacion: it.Situacion || ''
    });
  });

  escribirEnFirestore('parteDiario/casosMAS', { valor: { porDependencia } });
}

/** Patrón "plano con columna de categoría" — sirve de modelo para Dragas, BuquesDetencion, ControlGestion, InspeccionesTecnicas, etc. */
function sincronizarLicencias() {
  const hoja = SpreadsheetApp.getActive().getSheetByName('Licencias');
  const filas = hoja.getDataRange().getValues();
  const encabezados = filas.shift();

  const licencias = { anuales: [], medicas: [], tareasAdecuadas: [], extraordinaria: [], comisiones: [], noComputables: [] };
  const mapaCategoria = {
    anual: 'anuales', medica: 'medicas', tareasadecuadas: 'tareasAdecuadas',
    extraordinaria: 'extraordinaria', comisiones: 'comisiones', nocomputable: 'noComputables'
  };

  filas.filter(f => f.some(c => c !== '')).forEach(fila => {
    const it = {};
    encabezados.forEach((col, i) => { it[col] = fila[i]; });
    const clave = mapaCategoria[String(it.Categoria || '').toLowerCase().replace(/\s/g, '')];
    if (!clave) return;
    licencias[clave].push({
      jerarquia: it.Jerarquia || '',
      nombre: it.Nombre || '',
      inicia: it.Inicia || '',
      vence: it.Vence || ''
    });
  });

  escribirEnFirestore('parteDiario/licencias', { valor: licencias });
}

/**
 * ============================================================
 * GUARDAR EL PDF EXPORTADO EN GOOGLE DRIVE
 * ============================================================
 * El dashboard, además de descargar el PDF al navegador, le hace
 * un POST a este mismo script (desplegado como "Aplicación web")
 * con el archivo en base64. Esta función lo recibe y lo guarda en
 * la carpeta de Drive que vos indiques.
 *
 * CÓMO DESPLEGARLO:
 * 1. En el editor de Apps Script: Implementar > Nueva implementación.
 * 2. Tipo: "Aplicación web".
 * 3. Ejecutar como: "Yo" (tu cuenta — así el archivo se guarda con
 *    tus permisos de Drive, sin pedirle login a cada usuario).
 * 4. Quién tiene acceso: "Cualquier usuario" (el propio sistema
 *    ya controla el acceso con el login de Firebase; esta URL solo
 *    recibe el PDF, no expone datos).
 * 5. Copiá la URL que te da y pegala en
 *    js/integraciones-config.js (APPS_SCRIPT_WEBAPP_URL).
 * 6. Reemplazá también CARPETA_DRIVE_ID en ese mismo archivo con
 *    el ID de la carpeta de Drive (lo sacás de la URL de la carpeta:
 *    drive.google.com/drive/folders/ESTE_ES_EL_ID).
 * ============================================================
 */
function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    const carpeta = DriveApp.getFolderById(datos.carpetaId);
    const bytes = Utilities.base64Decode(datos.archivoBase64);
    const blob = Utilities.newBlob(bytes, 'application/pdf', datos.nombreArchivo);
    carpeta.createFile(blob);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sincronizarInspeccionesExtraordinarias() {
  const hoja = SpreadsheetApp.getActive().getSheetByName('InspeccionesExtraordinarias');
  const filas = hoja.getDataRange().getValues();
  const encabezados = filas.shift(); // primera fila = nombres de columna

  const items = filas
    .filter(fila => fila.some(celda => celda !== ''))
    .map(fila => {
      const obj = {};
      encabezados.forEach((col, i) => { obj[col] = fila[i]; });
      return obj;
    });

  // Se agrupan por bandera + dependencia, tal como espera el dashboard
  const porBandera = { argentina: {}, extranjera: {} };
  items.forEach(it => {
    const bandera = String(it.Bandera || '').toLowerCase().includes('extr') ? 'extranjera' : 'argentina';
    const dep = it.Dependencia || 'SIN_DEP';
    if (!porBandera[bandera][dep]) porBandera[bandera][dep] = [];
    porBandera[bandera][dep].push({
      tipo: String(it.Tipo || 'inicial').toLowerCase(),
      buque: {
        tipo: it.Buque_Tipo || '',
        nombre: it.Buque_Nombre || '',
        matricula: it.Matricula || '',
        bandera: it.Bandera || ''
      },
      deficiencias: String(it.Codigos_Deficiencia || '')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
        .map(c => ({ codigo: c, descripcion: '' })),
      nota: it.Nota || ''
    });
  });

  escribirEnFirestore('parteDiario/inspeccionesExtraordinarias', { valor: porBandera });
}

/**
 * Escribe un documento en Firestore usando la API REST,
 * autenticando con la cuenta de servicio (JWT con OAuth2 library).
 */
function escribirEnFirestore(rutaDocumento, datos) {
  const token = obtenerTokenAcceso();
  const projectId = PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID');
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${rutaDocumento}`;

  const payload = { fields: convertirAFirestoreFields(datos) };

  UrlFetchApp.fetch(url + '?updateMask.fieldPaths=' + Object.keys(payload.fields).join('&updateMask.fieldPaths='), {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function obtenerTokenAcceso() {
  const service = OAuth2.createService('firestoreSync')
    .setTokenUrl('https://oauth2.googleapis.com/token')
    .setPrivateKey(PropertiesService.getScriptProperties().getProperty('FIREBASE_PRIVATE_KEY'))
    .setIssuer(PropertiesService.getScriptProperties().getProperty('FIREBASE_CLIENT_EMAIL'))
    .setPropertyStore(PropertiesService.getScriptProperties())
    .setScope('https://www.googleapis.com/auth/datastore');
  service.reset();
  service.hasAccess();
  return service.getAccessToken();
}

/** Convierte un objeto JS plano al formato de "fields" que exige la API REST de Firestore. */
function convertirAFirestoreFields(obj) {
  const fields = {};
  Object.entries(obj).forEach(([k, v]) => { fields[k] = convertirValor(v); });
  return fields;
}

function convertirValor(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(convertirValor) } };
  if (typeof v === 'object') return { mapValue: { fields: convertirAFirestoreFields(v) } };
  return { stringValue: String(v) };
}
