// ============================================================
// CONFIGURACIÓN — Guardado del PDF en Google Drive
// ============================================================
// 1. Desplegá apps-script/Code.gs como "Aplicación web" (los
//    pasos exactos están comentados en ese mismo archivo, arriba
//    de la función doPost).
// 2. Pegá acá la URL que te da el despliegue.
// 3. Pegá el ID de la carpeta de Drive donde querés que se
//    guarden las copias de los partes exportados.
// ============================================================

const APPS_SCRIPT_WEBAPP_URL = "REEMPLAZAR_URL_WEBAPP_APPS_SCRIPT";
const CARPETA_DRIVE_ID = "REEMPLAZAR_ID_CARPETA_DRIVE";

const GUARDADO_EN_DRIVE_ACTIVO =
  APPS_SCRIPT_WEBAPP_URL !== "REEMPLAZAR_URL_WEBAPP_APPS_SCRIPT" &&
  CARPETA_DRIVE_ID !== "REEMPLAZAR_ID_CARPETA_DRIVE";
