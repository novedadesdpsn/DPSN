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
  }
  // Acá se van a ir agregando los "if" para las demás hojas:
  // CasosMAS, CasosSAR, EstadoRectorPuerto, Licencias, etc.
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

  escribirEnFirestore('parteDiario/inspeccionesExtraordinarias', porBandera);
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
