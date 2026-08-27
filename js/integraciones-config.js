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

const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwHDXNIPqC1kGx8vLwJqd2i0fCgbjf0iY_74b3XxOviWNQu_VXdFj6y4oZTgtnIHNmZRQ/exec";
const CARPETA_DRIVE_ID = "https://drive.google.com/drive/u/2/folders/1GaqmTYmW5R8T5c9prozdVPBY68PoxxlD";

const GUARDADO_EN_DRIVE_ACTIVO =
  APPS_SCRIPT_WEBAPP_URL !== "https://script.google.com/macros/s/AKfycbwHDXNIPqC1kGx8vLwJqd2i0fCgbjf0iY_74b3XxOviWNQu_VXdFj6y4oZTgtnIHNmZRQ/exec" &&
  CARPETA_DRIVE_ID !== "https://drive.google.com/drive/u/2/folders/1GaqmTYmW5R8T5c9prozdVPBY68PoxxlD";
