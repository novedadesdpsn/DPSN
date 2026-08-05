// ============================================================
// DATOS DE EJEMPLO — sirven solo para previsualizar el dashboard.
// Cuando conectemos Firestore, estas estructuras son las mismas
// que va a usar app.js, pero completadas en vivo desde la base.
// ============================================================

const DATOS_EJEMPLO = {

  fechaParte: "03/08/2026 0700 a 04/08/2026 0700",

  inspeccionesExtraordinarias: {
    bandera: "argentina", // o "extranjera"
    porDependencia: {
      "FORM": [
        {
          tipo: "inicial",
          buque: { tipo: "L/M", nombre: "CORINA", matricula: "0467-M", bandera: "ARGENTINA" },
          nota: ""
        },
        {
          tipo: "inicial",
          buque: { tipo: "L/M", nombre: "VAP", matricula: "BOCA0306", bandera: "ARGENTINA" },
          nota: ""
        }
      ],
      "ZARA": [
        {
          tipo: "seguimiento",
          fechaInspMasDetallada: "02/08/2026",
          buque: { tipo: "B/A", nombre: "IRIS", matricula: "01644", bandera: "ARGENTINA" },
          asunto: 'CASO MAS PZDE Nº 22/26 — Inconveniente en máquina',
          deficiencias: [
            { codigo: "10", descripcion: "MMPP (YANMAR 1187) presenta falla en Turbo. Se reemplazó turbo del MMPP." },
            { codigo: "10", descripcion: "Salvavidas circular en popa sin identificación. Se verificó identificación." },
            { codigo: "10", descripcion: "Extintor de incendio en Sala de Máquinas descargado. Se reemplazó extintor." },
            { codigo: "10", descripcion: "Dos chalecos salvavidas sin identificación del buque. Se verificó identificación." }
          ],
          nota: ""
        }
      ]
    },
    resumen: { pesquerosOtros: 0, porAveria: 2, cargaPasaje: 0, convoyesExtr: 0, convoyArgentino: 0, totalDiario: 2, totalAnual: 591 }
  },

  estadoRectorPuerto: {
    porDependencia: {
      "LPLA": [
        {
          tipo: "seguimiento",
          fechaInspMasDetallada: "05/07/2026",
          buque: { tipo: "B/T", nombre: "AYSEN STAR", matricula: "IMO 9419199", bandera: "LIBERIA" },
          deficiencias: [
            { codigo: "99", descripcion: "Generador/Motor Auxiliar N.º 1 fuera de servicio por mantenimiento. Dispensa de bandera hasta el 21/08/2026." }
          ],
          nota: "Próx. puerto a confirmar."
        }
      ],
      "SLOR": [
        {
          tipo: "inicial",
          buque: { tipo: "B/M", nombre: "MDS APHRODITE", matricula: "IMO 9480708", bandera: "ISLAS MARSHALL" },
          nota: "Próx. puerto: Brasil."
        }
      ]
    },
    resumen: { buquesIngresados: 6, factiblesDiario: 3, inspeccionadosDiario: 1, factiblesAnual: 1803, inspeccionadosAnual: 882 }
  },

  casosMAS: {
    porDependencia: {
      "DIAM": [
        {
          estado: "pendiente",
          titulo: "R/E KOETI",
          asunto: 'CASO MAS PZBP N.º 38/26 – Inconveniente en motor propulsor de babor. R/E "KOETI" (Mat. 2267) B/Paraguay.',
          posicion: "Km 484 M.D.R.P.",
          novedad: "Personal de SCL NAVAL continúa con el montaje del eje de la caja reductora del motor propulsor de babor, sin lograr finalizar los trabajos.",
          caracteristicas: "Eslora 174,20 m; Manga 12 m; Calado 7 pies; Potencia 2.500 HP; Convoy: 4 barcazas con 468,95 TN de carga general.",
          situacion: "FH 141205 el capitán informó que no logró poner en marcha el motor propulsor de babor. Continúan tareas de reparación desde el 15/07. CASO MAS PENDIENTE."
        }
      ],
      "GOYA": [
        {
          estado: "pendiente",
          titulo: "B/T EMPUJE OLIMPO",
          asunto: 'CASO MAS PZPP N.º 20/26 – Inconveniente en motor propulsor banda de estribor. B/T "OLIMPO" (1284-BM) B/Paraguay.',
          posicion: "Km 994 M.D.R.P.",
          novedad: "Se aguarda documentación para recambio de turbocompresor.",
          caracteristicas: "Agencia Marítima: Atalaya Servicios Fluviales.",
          situacion: "FH 030630 informó amarre por inconveniente en motor propulsor de estribor. CASO MAS PENDIENTE."
        }
      ]
    }
  },

  casosSAR: {
    porDependencia: {
      "BBLA": [
        {
          estado: "pendiente",
          numeroCaso: "34/2026",
          subcentroVTS: "KSBB",
          titulo: "Tripulante Enfermo — B/P MISS TIDE",
          nombreBuque: "MISS TIDE",
          matricula: "02439",
          bandera: "ARGENTINA",
          fechaInicio: "03/08/2026",
          fechaCierre: "",
          posicion: "Lat. 41°35'S Long. 058°13'W",
          novedad: "Tripulante estable, con menor dolor. Previsto despegue de PA-40 para aeroevacuación con luz diurna.",
          caracteristicas: "Buque navegando destino Puerto Bahía Blanca, ETA 04/08 0750.",
          situacion: "FH 031310 capitán informó tripulante con dolor en pecho y brazo izquierdo. Diagnóstico presuntivo: dolor precordial. CASO SAR PENDIENTE."
        }
      ],
      "CRIV": [
        {
          estado: "pendiente",
          numeroCaso: "115-26",
          subcentroVTS: "KSCR",
          titulo: "Tripulante Accidentado — B/P SANTIAGO I",
          nombreBuque: "SANTIAGO I",
          matricula: "02280",
          bandera: "ARGENTINA",
          fechaInicio: "03/08/2026",
          fechaCierre: "",
          posicion: "Rumbo a MADR",
          novedad: "Recomendación médica: medicación, vendaje, hielo, reposo y desembarco.",
          caracteristicas: "ETA 04/08 1130.",
          situacion: "FH 032040 capitán informó tripulante con traumatismo en tobillo derecho. CASO SAR PENDIENTE."
        }
      ]
    }
  },

  otros: {
    porDependencia: {
      "DSUD": [
        { tipoBloque: "texto", titulo: "Desmoronamiento en sitio técnico de muelle IP Exolgan", contenido: "Se tomó conocimiento del socavamiento y desmoronamiento del margen del Sitio 0 de la IP Exolgan, afectando el Arco Megaport. No obstruye el canal de navegación. Continúan tareas de izado y traslado de estructuras afectadas." }
      ],
      "SNIC": [
        { tipoBloque: "texto", titulo: "Fisura en forro de casco — B/M KAPADOKYA", contenido: "Fisura de unos 30 cm en banda de babor con egreso de agua de tanque de lastre, sin comprometer estabilidad ni seguridad del buque. Se solicitó inspección ERP especialidad Casco." }
      ]
    }
  },

  alturaAgua: [
    { punto: "Puerto Rosario", fecha: "03/08/2026", altura: "2.97", escala: "C" }
  ],

  buquesDetencion: [
    { numero: 1, dependencia: "PZMN — RAWS", buque: 'B/P "CIUDAD DE NIJAR" (03338)', fecha: "16/04/2026", tipoInsp: "ID", deficiencias: "Cód. 30 (02) / Cód. 17 (02)" },
    { numero: 2, dependencia: "PZDE — DLUJ", buque: 'L/P "MARIA ANGELICA VI" (0402M)', fecha: "20/05/2026", tipoInsp: "ID", deficiencias: "Cód. 30 (10) / Cód. 17 (06)" },
    { numero: 3, dependencia: "PZMN — BBLA", buque: 'L/M "IMPACIENTE" (0783)', fecha: "23/05/2026", tipoInsp: "ID", deficiencias: "Cód. 30 (12) / Cód. 17 (21)" }
  ],

  inspeccionesTecnicas: [
    {
      especialidad: "CASCO",
      embarcacion: 'B/M "MAKENITA H" (03347) — Tanque',
      requerimiento: "Verificación de planos (Tr. 101611)",
      lugar: "TANDANOR",
      inspector: "SP DE LA ROSA, CARLOS (MOI DPSN)",
      extranjero: false,
      salida: {}, regreso: {}
    },
    {
      especialidad: "CASCO / MÁQUINAS / ELECTRICIDAD / ARMAMENTO",
      embarcacion: 'B/M "ARGENTINA II" (02456) — Tanque',
      requerimiento: "1° II",
      lugar: "PARAGUAY",
      inspector: "PR RODRIGUEZ, MARCOS",
      extranjero: true,
      salida: { fechaHora: "02/08/2026 06:40", vuelo: "AR1340", destino: "Asunción (PY)" },
      regreso: { fechaHora: "05/08/2026 09:45", vuelo: "AR1341", destino: "Aeroparque (AEP)" }
    }
  ],

  divisionControlGestion: [
    { tipoAuditoria: "S.G.S. (Sistema de Gestión de la Seguridad)", embarcacion: "VALENTINA H (03183)", alcance: "Renovación", lugar: "Asunción (Paraguay)", auditor: "SP LOPEZ, NOELIA MARIEL (DPSN)" }
  ],

  licencias: {
    anuales: [
      { jerarquia: "PPCGGE", nombre: "INSAURRALDE, CESAR ADRIAN (SNAV)", inicia: "27/07/2026", vence: "05/08/2026" },
      { jerarquia: "PPCGESMA", nombre: "SOSA, MARIO ALEJANDRO (PRAC)", inicia: "27/07/2026", vence: "05/08/2026" }
    ],
    medicas: [
      { jerarquia: "CICGOF", nombre: "HERMOSILLA, FÁTIMA MARÍA (RNBU) — Traumatismo tobillo derecho", inicia: "02/07/2026", vence: "Turno médico 05/08/2026" }
    ],
    tareasAdecuadas: [
      { jerarquia: "PRCPIN", nombre: "ETCHEVERRY, ALFREDO (TNAV) — Diag. IAM c/colocación de stent", inicia: "20/07/2026", vence: "Turno médico 07/08/2026" }
    ],
    extraordinaria: [
      { jerarquia: "PMCPRSIN", nombre: "CUBISINO, JUAN CARLOS (RPOL)", inicia: "01/03/2026", vence: "31/08/2026" }
    ],
    comisiones: [
      { jerarquia: "ASCGNA", nombre: "LIZONDO, CRISTIAN (RNBU) — Comisión Aguas Blancas", inicia: "10/06/2026", vence: "08/08/2026" }
    ],
    noComputables: [
      { jerarquia: "ATCGOF", nombre: "ROBLEDO, DARIO MAXIMILIANO (TNAV)", inicia: "03/08/2026", vence: "07/08/2026" }
    ]
  },

  guardia: {
    saliente: [
      { rol: "Jefe de Servicio", nombre: "SP ALBINO, Gisela Marina" },
      { rol: "Oficial de Guardia", nombre: "OP PICCOLI, Leonardo Agustín" },
      { rol: "Ayte. de Guardia", nombre: "AI GONZALEZ, Elvio" }
    ],
    entrante: [
      { rol: "Jefe de Servicio", nombre: "SP BADARACCO, Arturo Federico" },
      { rol: "Oficial de Guardia", nombre: "OP SCHULZ, Alexis Daniel" },
      { rol: "Ayte. de Guardia", nombre: "AS SOSA, Javier" }
    ]
  }
};
