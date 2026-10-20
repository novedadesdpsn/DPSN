// ============================================================
// JERARQUÍAS — Novedades DPSN
// ============================================================
// Escala de antigüedad de Personal Superior y Personal Subalterno,
// para ordenar automáticamente las tablas de Licencias (y su
// impresión en el PDF) sin necesidad de un desplegable gigante.
//
// El campo "Jerarquía" se carga como un código de 6 letras:
//   2 de Jerarquía + 2 de Cuerpo + 2 de Escalafón
// Ej: "PRCPJU" = Prefecto (PR) + Cuerpo Profesional (CP) + Jurídico (JU)
//     "CICXMY" = Cabo Primero (CI) + Cuerpo Auxiliar (CX) + Maestranza y Servicios (MY)
//
// Si el código no coincide con ninguna combinación conocida (typo,
// formato viejo en texto libre, etc.), esa persona no se pierde:
// queda al final de la lista, ordenada alfabéticamente por lo que
// se haya escrito.
// ============================================================

// ---- Personal Superior ----
const JERARQUIA_SUPERIOR = ['PG', 'PM', 'PP', 'PR', 'SP', 'OP', 'OX', 'OA'];
const ETIQUETAS_JERARQUIA_SUPERIOR = {
  PG: 'Prefecto General', PM: 'Prefecto Mayor', PP: 'Prefecto Principal', PR: 'Prefecto',
  SP: 'Subprefecto', OP: 'Oficial Principal', OX: 'Oficial Auxiliar', OA: 'Oficial Ayudante'
};
// Cuerpo/Escalafón combinados (4 letras), ya en orden de antigüedad.
const CUERPO_ESCALAFON_SUPERIOR = ['GEGE', 'GEIT', 'GEES', 'CPJU', 'CPSA', 'CPIN', 'CPTN', 'CPCT', 'CCTG'];
const ETIQUETAS_ESCALAFON_SUPERIOR = {
  GEGE: 'Gral. (GE) — Escalafón General (GE)',
  GEIT: 'Gral. (GE) — Escalafón Intendencia (IT)',
  GEES: 'Gral. (GE) — Escalafón Especial (ES)',
  CPJU: 'Profesional (CP) — Jurídico (JU)',
  CPSA: 'Profesional (CP) — Sanidad (SA)',
  CPIN: 'Profesional (CP) — Ingeniería (IN)',
  CPTN: 'Profesional (CP) — Técnica Naval (TN)',
  CPCT: 'Profesional (CP) — Científico Tecnológico (CT)',
  CCTG: 'Complementario (CC) — Técnica General (TG)'
};

// ---- Personal Subalterno ----
const JERARQUIA_SUBALTERNO = ['AM', 'AP', 'AI', 'AS', 'AT', 'CI', 'CS', 'MO'];
const ETIQUETAS_JERARQUIA_SUBALTERNO = {
  AM: 'Ayudante Mayor', AP: 'Ayudante Principal', AI: 'Ayudante de Primera', AS: 'Ayudante de Segunda',
  AT: 'Ayudante de Tercera', CI: 'Cabo Primero', CS: 'Cabo Segundo', MO: 'Marinero'
};
const CUERPO_ESCALAFON_SUBALTERNO = [
  'CGSG', 'CGNA', 'CGCM', 'CGCA', 'CGOF', 'CGAE',
  'CXSA', 'CXMU', 'CXMY',
  'CCSG', 'CCNA', 'CCCM', 'CCCA', 'CCOF', 'CCAE'
];
const ETIQUETAS_ESCALAFON_SUBALTERNO = {
  CGSG: 'Gral. (CG) — Seguridad (SG)', CGNA: 'Gral. (CG) — Navegación (NA)', CGCM: 'Gral. (CG) — Comunicaciones (CM)',
  CGCA: 'Gral. (CG) — Control de Averías e Incendios (CA)', CGOF: 'Gral. (CG) — Oficinista (OF)', CGAE: 'Gral. (CG) — Aeronáutico (AE)',
  CXSA: 'Auxiliar (CX) — Sanidad (SA)', CXMU: 'Auxiliar (CX) — Músicos (MU)', CXMY: 'Auxiliar (CX) — Maestranza y Servicios (MY)',
  CCSG: 'Complementario (CC) — Seguridad (SG)', CCNA: 'Complementario (CC) — Navegación (NA)', CCCM: 'Complementario (CC) — Comunicaciones (CM)',
  CCCA: 'Complementario (CC) — Control de Averías e Incendios (CA)', CCOF: 'Complementario (CC) — Oficinista (OF)', CCAE: 'Complementario (CC) — Aeronáutico (AE)'
};

// Ayuda-memoria de siglas de Escalafón solo (sin Jerarquía ni Cuerpo, que ya se saben de memoria).
const AYUDA_ESCALAFON_SUPERIOR = [
  ['GE', 'General'], ['IT', 'Intendencia'], ['ES', 'Especial'],
  ['JU', 'Jurídico'], ['SA', 'Sanidad'], ['IN', 'Ingeniería'], ['TN', 'Técnica Naval'], ['CT', 'Científico Tecnológico'],
  ['TG', 'Técnica General']
];
const AYUDA_ESCALAFON_SUBALTERNO = [
  ['SG', 'Seguridad'], ['NA', 'Navegación'], ['CM', 'Comunicaciones'], ['CA', 'Control de Averías e Incendios'], ['OF', 'Oficinista'], ['AE', 'Aeronáutico'],
  ['SA', 'Sanidad'], ['MU', 'Músicos'], ['MY', 'Maestranza y Servicios']
];

/**
 * Descompone un código de jerarquía de 6 letras (ej. "PRCPJU") y devuelve su posición
 * en la escala de antigüedad, o null si no se reconoce (texto libre, typo, código viejo).
 * { escala: 0 (Superior) | 1 (Subalterno), clave: número — menor es más antiguo }
 */
function rangoJerarquia(codigoCrudo) {
  const codigo = String(codigoCrudo || '').trim().toUpperCase().replace(/[^A-ZÑ]/g, '');
  if (codigo.length !== 6) return null;
  const jer = codigo.slice(0, 2);
  const resto = codigo.slice(2, 6);

  let idxJer = JERARQUIA_SUPERIOR.indexOf(jer);
  if (idxJer !== -1) {
    const idxCombo = CUERPO_ESCALAFON_SUPERIOR.indexOf(resto);
    if (idxCombo === -1) return null;
    return { escala: 0, clave: idxJer * CUERPO_ESCALAFON_SUPERIOR.length + idxCombo };
  }

  idxJer = JERARQUIA_SUBALTERNO.indexOf(jer);
  if (idxJer !== -1) {
    const idxCombo = CUERPO_ESCALAFON_SUBALTERNO.indexOf(resto);
    if (idxCombo === -1) return null;
    return { escala: 1, clave: idxJer * CUERPO_ESCALAFON_SUBALTERNO.length + idxCombo };
  }

  return null;
}

/** Compara dos códigos de jerarquía para ordenar de más antiguo a más moderno (Superior primero, Subalterno después, no reconocidos al final). */
function compararPorJerarquia(a, b) {
  const ra = rangoJerarquia(a);
  const rb = rangoJerarquia(b);
  const escalaA = ra ? ra.escala : 2;
  const escalaB = rb ? rb.escala : 2;
  if (escalaA !== escalaB) return escalaA - escalaB;
  if (escalaA === 2) return String(a || '').toUpperCase().localeCompare(String(b || '').toUpperCase(), 'es');
  return ra.clave - rb.clave;
}

/** Ordena (sin mutar) una lista de registros con campo .jerarquia según la escala de antigüedad. */
function ordenarPorJerarquia(lista) {
  return lista.slice().sort((a, b) => compararPorJerarquia(a.jerarquia, b.jerarquia));
}
