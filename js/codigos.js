// ============================================================
// CÓDIGOS DE MEDIDAS ADOPTADAS
// ============================================================
const CODIGOS_MEDIDAS = [
  { codigo: "00", descripcion: "No se adoptaron." },
  { codigo: "10", descripcion: "Deficiencias subsanadas." },
  { codigo: "15", descripcion: "Deficiencias a ser subsanadas en el próximo puerto o cumplidas al reingreso a aguas jurisdiccionales." },
  { codigo: "16", descripcion: "Deficiencias a ser subsanadas en un plazo de 14 días." },
  { codigo: "17", descripcion: "El capitán instruido para subsanar las deficiencias antes del zarpe." },
  { codigo: "18", descripcion: "Rectificar incumplimientos dentro de los tres meses." },
  { codigo: "30", descripcion: "Buque con impedimento de salida (Detención)." },
  { codigo: "40", descripcion: "Próximo puerto informado." },
  { codigo: "50", descripcion: "Estado de bandera/Cónsul informado." },
  { codigo: "55", descripcion: "Estado de bandera consultado." },
  { codigo: "70", descripcion: "Sociedad de clasificación informada." },
  { codigo: "85", descripcion: "Investigación de una transgresión a exigencias de descarga (MARPOL 73/78)." },
  { codigo: "95", descripcion: "Emisión de la carta de advertencia." },
  { codigo: "99", descripcion: "Otros (especificar en un lenguaje claro)." }
];

function descripcionCodigo(codigo) {
  const c = CODIGOS_MEDIDAS.find(x => x.codigo === codigo);
  return c ? c.descripcion : '';
}
