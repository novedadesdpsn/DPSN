// ============================================================
// DEPENDENCIAS DE LA PNA POR PREFECTURA DE ZONA — Novedades DPSN
// ============================================================
// Origen de los datos:
//  - Agrupación por zona: los mapas de zonas provistos por la DPSN.
//  - Cuatrigrama (cuatri): R.I. PNA 3-066 "Catálogo de Códigos
//    Administrativos de la P.N.A." (Edición 2026).
//  - Latitud/longitud: ubicación geográfica del puerto/localidad.
//    "aprox: true" = ubicación estimada (±10 km), conviene revisarla
//    y corregirla acá mismo si hace falta. Para editar una
//    dependencia, cambiá lat/lon en este archivo y listo.
// ============================================================

const DEPENDENCIAS_PNA = [
 {
  "zona": "PZRP",
  "nombre": "Río de la Plata",
  "dependencias": [
   {
    "cuatri": "BSAS",
    "nombre": "Buenos Aires",
    "lat": -34.6,
    "lon": -58.37,
    "aprox": false
   },
   {
    "cuatri": "BOCA",
    "nombre": "Boca del Riachuelo",
    "lat": -34.6333,
    "lon": -58.35,
    "aprox": false
   },
   {
    "cuatri": "DSUD",
    "nombre": "Dock Sud",
    "lat": -34.6667,
    "lon": -58.3333,
    "aprox": false
   },
   {
    "cuatri": "QUIL",
    "nombre": "Quilmes",
    "lat": -34.72,
    "lon": -58.25,
    "aprox": false
   },
   {
    "cuatri": "ISMS",
    "nombre": "Isla Monte Santiago",
    "lat": -34.82,
    "lon": -57.95,
    "aprox": true
   },
   {
    "cuatri": "LPLA",
    "nombre": "La Plata",
    "lat": -34.8667,
    "lon": -57.9,
    "aprox": false
   },
   {
    "cuatri": "ATAL",
    "nombre": "Punta Atalaya",
    "lat": -35.08,
    "lon": -57.45,
    "aprox": true
   },
   {
    "cuatri": "RSAL",
    "nombre": "Boca del Salado (ex Río Salado)",
    "lat": -36.28,
    "lon": -57.05,
    "aprox": true
   },
   {
    "cuatri": "GLAV",
    "nombre": "General Lavalle",
    "lat": -36.4167,
    "lon": -56.9333,
    "aprox": false
   },
   {
    "cuatri": "LATO",
    "nombre": "Las Toninas",
    "lat": -36.4833,
    "lon": -56.6833,
    "aprox": false
   },
   {
    "cuatri": "STER",
    "nombre": "Santa Teresita",
    "lat": -36.5333,
    "lon": -56.6833,
    "aprox": false
   },
   {
    "cuatri": "TUYU",
    "nombre": "Mar del Tuyú",
    "lat": -36.5833,
    "lon": -56.6833,
    "aprox": false
   },
   {
    "cuatri": "MAJO",
    "nombre": "Mar de Ajó",
    "lat": -36.7167,
    "lon": -56.6833,
    "aprox": false
   }
  ]
 },
 {
  "zona": "PZDE",
  "nombre": "Delta",
  "dependencias": [
   {
    "cuatri": "VOBL",
    "nombre": "Vuelta de Obligado",
    "lat": -33.65,
    "lon": -59.69,
    "aprox": true
   },
   {
    "cuatri": "SPED",
    "nombre": "San Pedro",
    "lat": -33.6786,
    "lon": -59.6678,
    "aprox": false
   },
   {
    "cuatri": "BARA",
    "nombre": "Baradero",
    "lat": -33.81,
    "lon": -59.51,
    "aprox": false
   },
   {
    "cuatri": "IBIC",
    "nombre": "Ibicuy",
    "lat": -33.7333,
    "lon": -59.1667,
    "aprox": false
   },
   {
    "cuatri": "BRLG",
    "nombre": "Brazo Largo",
    "lat": -33.77,
    "lon": -58.9,
    "aprox": true
   },
   {
    "cuatri": "AJAR",
    "nombre": "Ayudante Principal Enrique Arturo Jadón",
    "lat": -34.1,
    "lon": -58.8,
    "aprox": true
   },
   {
    "cuatri": "LPAL",
    "nombre": "La Paloma",
    "lat": -34.2,
    "lon": -58.55,
    "aprox": true
   },
   {
    "cuatri": "GUAZ",
    "nombre": "Guazú-Guazucito",
    "lat": -34.15,
    "lon": -58.55,
    "aprox": true
   },
   {
    "cuatri": "ZARA",
    "nombre": "Zárate",
    "lat": -34.0981,
    "lon": -59.0286,
    "aprox": false
   },
   {
    "cuatri": "CAMP",
    "nombre": "Campana",
    "lat": -34.1667,
    "lon": -58.9583,
    "aprox": false
   },
   {
    "cuatri": "MGAR",
    "nombre": "Martín García",
    "lat": -34.1833,
    "lon": -58.25,
    "aprox": false
   },
   {
    "cuatri": "MINI",
    "nombre": "Chana Miní",
    "lat": -34.22,
    "lon": -58.65,
    "aprox": true
   },
   {
    "cuatri": "ESCO",
    "nombre": "Escobar",
    "lat": -34.35,
    "lon": -58.75,
    "aprox": true
   },
   {
    "cuatri": "CILB",
    "nombre": "Cabo Primero José Luís Braga",
    "lat": -34.3,
    "lon": -58.6,
    "aprox": true
   },
   {
    "cuatri": "DLUJ",
    "nombre": "Dique Luján",
    "lat": -34.4167,
    "lon": -58.6833,
    "aprox": false
   },
   {
    "cuatri": "TIGR",
    "nombre": "Tigre",
    "lat": -34.4167,
    "lon": -58.5833,
    "aprox": false
   },
   {
    "cuatri": "SFER",
    "nombre": "San Fernando",
    "lat": -34.4425,
    "lon": -58.5322,
    "aprox": false
   },
   {
    "cuatri": "SISI",
    "nombre": "San Isidro",
    "lat": -34.4678,
    "lon": -58.5086,
    "aprox": false
   },
   {
    "cuatri": "OLIV",
    "nombre": "Olivos",
    "lat": -34.51,
    "lon": -58.48,
    "aprox": false
   }
  ]
 },
 {
  "zona": "PZBP",
  "nombre": "Bajo Paraná",
  "dependencias": [
   {
    "cuatri": "SAJV",
    "nombre": "San Javier",
    "lat": -30.5833,
    "lon": -59.9333,
    "aprox": false
   },
   {
    "cuatri": "LPAZ",
    "nombre": "La Paz",
    "lat": -30.75,
    "lon": -59.65,
    "aprox": false
   },
   {
    "cuatri": "HELV",
    "nombre": "Helvecia",
    "lat": -31.1667,
    "lon": -60.0833,
    "aprox": false
   },
   {
    "cuatri": "SELE",
    "nombre": "Santa Elena",
    "lat": -30.95,
    "lon": -59.8,
    "aprox": false
   },
   {
    "cuatri": "HERN",
    "nombre": "Hernandarias",
    "lat": -31.2167,
    "lon": -59.9833,
    "aprox": false
   },
   {
    "cuatri": "SAFE",
    "nombre": "Santa Fé",
    "lat": -31.6333,
    "lon": -60.7,
    "aprox": false
   },
   {
    "cuatri": "PARA",
    "nombre": "Paraná",
    "lat": -31.7333,
    "lon": -60.5333,
    "aprox": false
   },
   {
    "cuatri": "CNDA",
    "nombre": "Coronda",
    "lat": -31.9667,
    "lon": -60.9167,
    "aprox": false
   },
   {
    "cuatri": "DIAM",
    "nombre": "Diamante",
    "lat": -32.0667,
    "lon": -60.6333,
    "aprox": false
   },
   {
    "cuatri": "GABO",
    "nombre": "Puerto Gaboto",
    "lat": -32.4333,
    "lon": -60.8167,
    "aprox": false
   },
   {
    "cuatri": "TIMB",
    "nombre": "Timbues",
    "lat": -32.6667,
    "lon": -60.7833,
    "aprox": false
   },
   {
    "cuatri": "SLOR",
    "nombre": "San Lorenzo",
    "lat": -32.75,
    "lon": -60.7333,
    "aprox": false
   },
   {
    "cuatri": "ROSA",
    "nombre": "Rosario",
    "lat": -32.95,
    "lon": -60.6333,
    "aprox": false
   },
   {
    "cuatri": "PUNA",
    "nombre": "Punta Alvear",
    "lat": -33.05,
    "lon": -60.62,
    "aprox": true
   },
   {
    "cuatri": "ASEC",
    "nombre": "Arroyo Seco",
    "lat": -33.15,
    "lon": -60.5,
    "aprox": false
   },
   {
    "cuatri": "VICT",
    "nombre": "Victoria",
    "lat": -32.6167,
    "lon": -60.15,
    "aprox": false
   },
   {
    "cuatri": "VCON",
    "nombre": "Villa Constitución",
    "lat": -33.2333,
    "lon": -60.3333,
    "aprox": false
   },
   {
    "cuatri": "SNIC",
    "nombre": "San Nicolás",
    "lat": -33.3333,
    "lon": -60.2167,
    "aprox": false
   },
   {
    "cuatri": "RLLO",
    "nombre": "Ramallo",
    "lat": -33.4833,
    "lon": -60.0167,
    "aprox": false
   }
  ]
 },
 {
  "zona": "PZPP",
  "nombre": "Paraná Superior y Paraguay",
  "dependencias": [
   {
    "cuatri": "PILC",
    "nombre": "Pilcomayo",
    "lat": -25.2833,
    "lon": -57.7167,
    "aprox": false
   },
   {
    "cuatri": "BOUV",
    "nombre": "Bouvier",
    "lat": -25.65,
    "lon": -58.1,
    "aprox": true
   },
   {
    "cuatri": "DCIA",
    "nombre": "Dalmacia",
    "lat": -25.95,
    "lon": -58.2,
    "aprox": true
   },
   {
    "cuatri": "FORM",
    "nombre": "Formosa",
    "lat": -26.1775,
    "lon": -58.1781,
    "aprox": false
   },
   {
    "cuatri": "HERR",
    "nombre": "Herradura",
    "lat": -26.4833,
    "lon": -58.3,
    "aprox": false
   },
   {
    "cuatri": "CANO",
    "nombre": "Colonia Cano",
    "lat": -26.75,
    "lon": -58.45,
    "aprox": true
   },
   {
    "cuatri": "BERM",
    "nombre": "Bermejo",
    "lat": -26.9,
    "lon": -58.5,
    "aprox": false
   },
   {
    "cuatri": "LMAS",
    "nombre": "Las Palmas",
    "lat": -27.05,
    "lon": -58.68,
    "aprox": false
   },
   {
    "cuatri": "PPAT",
    "nombre": "Paso de la Patria",
    "lat": -27.3167,
    "lon": -58.5667,
    "aprox": false
   },
   {
    "cuatri": "ISCE",
    "nombre": "Isla del Cerrito",
    "lat": -27.3,
    "lon": -58.62,
    "aprox": false
   },
   {
    "cuatri": "PUGO",
    "nombre": "Puerto González",
    "lat": -27.35,
    "lon": -58.5,
    "aprox": true
   },
   {
    "cuatri": "PUCZ",
    "nombre": "Puerto Corazón",
    "lat": -27.33,
    "lon": -58.4,
    "aprox": true
   },
   {
    "cuatri": "BARR",
    "nombre": "Barranqueras",
    "lat": -27.4833,
    "lon": -58.9333,
    "aprox": false
   },
   {
    "cuatri": "ITAT",
    "nombre": "Itatí",
    "lat": -27.2667,
    "lon": -58.2333,
    "aprox": false
   },
   {
    "cuatri": "PUVI",
    "nombre": "Puerto Vilelas",
    "lat": -27.5167,
    "lon": -58.9,
    "aprox": false
   },
   {
    "cuatri": "CORR",
    "nombre": "Corrientes",
    "lat": -27.4806,
    "lon": -58.8341,
    "aprox": false
   },
   {
    "cuatri": "EMPE",
    "nombre": "Empedrado",
    "lat": -27.95,
    "lon": -58.8,
    "aprox": false
   },
   {
    "cuatri": "BVIS",
    "nombre": "Bella Vista",
    "lat": -28.5,
    "lon": -59.05,
    "aprox": false
   },
   {
    "cuatri": "GOYA",
    "nombre": "Goya",
    "lat": -29.1394,
    "lon": -59.2642,
    "aprox": false
   },
   {
    "cuatri": "RECO",
    "nombre": "Reconquista",
    "lat": -29.15,
    "lon": -59.65,
    "aprox": false
   },
   {
    "cuatri": "PUEG",
    "nombre": "Puerto Exterior Goya",
    "lat": -29.1,
    "lon": -59.2,
    "aprox": true
   },
   {
    "cuatri": "ESQU",
    "nombre": "Esquina",
    "lat": -30.0167,
    "lon": -59.5333,
    "aprox": false
   },
   {
    "cuatri": "RHON",
    "nombre": "Embalse Río Hondo",
    "lat": -27.5,
    "lon": -64.9,
    "aprox": false
   }
  ]
 },
 {
  "zona": "PZAP",
  "nombre": "Alto Paraná",
  "dependencias": [
   {
    "cuatri": "PAND",
    "nombre": "Puerto Andresito",
    "lat": -25.6,
    "lon": -53.9833,
    "aprox": true
   },
   {
    "cuatri": "IGUA",
    "nombre": "Iguazú",
    "lat": -25.5972,
    "lon": -54.5786,
    "aprox": false
   },
   {
    "cuatri": "PULI",
    "nombre": "Puerto Libertad",
    "lat": -25.9167,
    "lon": -54.6,
    "aprox": false
   },
   {
    "cuatri": "WAND",
    "nombre": "Wanda",
    "lat": -25.9667,
    "lon": -54.5667,
    "aprox": false
   },
   {
    "cuatri": "PUES",
    "nombre": "Puerto Esperanza",
    "lat": -25.9833,
    "lon": -54.6,
    "aprox": false
   },
   {
    "cuatri": "MADO",
    "nombre": "Mado",
    "lat": -26.1,
    "lon": -54.62,
    "aprox": true
   },
   {
    "cuatri": "VRIA",
    "nombre": "Victoria",
    "lat": -26.1833,
    "lon": -54.65,
    "aprox": false
   },
   {
    "cuatri": "ELDO",
    "nombre": "Eldorado",
    "lat": -26.4,
    "lon": -54.65,
    "aprox": false
   },
   {
    "cuatri": "PRAY",
    "nombre": "Piray",
    "lat": -26.48,
    "lon": -54.72,
    "aprox": false
   },
   {
    "cuatri": "MCAR",
    "nombre": "Montecarlo",
    "lat": -26.57,
    "lon": -54.77,
    "aprox": false
   },
   {
    "cuatri": "PARY",
    "nombre": "Paranay",
    "lat": -26.7,
    "lon": -54.85,
    "aprox": true
   },
   {
    "cuatri": "GARU",
    "nombre": "Puerto Garuhapé",
    "lat": -26.87,
    "lon": -55.05,
    "aprox": true
   },
   {
    "cuatri": "PUPE",
    "nombre": "Puerto Pescador",
    "lat": -26.95,
    "lon": -55.1,
    "aprox": true
   },
   {
    "cuatri": "ORVE",
    "nombre": "Oro Verde",
    "lat": -27.0,
    "lon": -55.13,
    "aprox": true
   },
   {
    "cuatri": "LIBE",
    "nombre": "Libertador General San Martín",
    "lat": -27.05,
    "lon": -55.2,
    "aprox": true
   },
   {
    "cuatri": "OASI",
    "nombre": "Puerto Oasis",
    "lat": -27.15,
    "lon": -55.2,
    "aprox": true
   },
   {
    "cuatri": "PULE",
    "nombre": "Puerto Leoni",
    "lat": -27.18,
    "lon": -55.25,
    "aprox": true
   },
   {
    "cuatri": "PUMI",
    "nombre": "Puerto Mineral",
    "lat": -27.2,
    "lon": -55.3,
    "aprox": true
   },
   {
    "cuatri": "POLA",
    "nombre": "Polana",
    "lat": -27.22,
    "lon": -55.4,
    "aprox": true
   },
   {
    "cuatri": "MANI",
    "nombre": "Puerto Maní",
    "lat": -27.25,
    "lon": -55.48,
    "aprox": true
   },
   {
    "cuatri": "SIGN",
    "nombre": "San Ignacio",
    "lat": -27.2575,
    "lon": -55.5333,
    "aprox": false
   },
   {
    "cuatri": "SANA",
    "nombre": "Santa Ana",
    "lat": -27.37,
    "lon": -55.58,
    "aprox": false
   },
   {
    "cuatri": "CAND",
    "nombre": "Candelaria",
    "lat": -27.46,
    "lon": -55.74,
    "aprox": false
   },
   {
    "cuatri": "POSA",
    "nombre": "Posadas",
    "lat": -27.3671,
    "lon": -55.8961,
    "aprox": false
   },
   {
    "cuatri": "OFNP",
    "nombre": "Oficial Nemesio Parma",
    "lat": -27.4,
    "lon": -56.15,
    "aprox": true
   },
   {
    "cuatri": "OMBU",
    "nombre": "Rincón del Ombú",
    "lat": -27.4,
    "lon": -56.2,
    "aprox": true
   },
   {
    "cuatri": "GAPE",
    "nombre": "Garapé",
    "lat": -27.36,
    "lon": -56.3,
    "aprox": true
   },
   {
    "cuatri": "SAPI",
    "nombre": "San Antonio de Apipé",
    "lat": -27.51,
    "lon": -56.82,
    "aprox": true
   },
   {
    "cuatri": "ITUZ",
    "nombre": "Ituzaingó",
    "lat": -27.5898,
    "lon": -56.6867,
    "aprox": false
   },
   {
    "cuatri": "VIZC",
    "nombre": "Vizcaíno",
    "lat": -27.63,
    "lon": -57.05,
    "aprox": true
   },
   {
    "cuatri": "ITAE",
    "nombre": "Itá Ibaté",
    "lat": -27.43,
    "lon": -57.3,
    "aprox": true
   },
   {
    "cuatri": "YHPE",
    "nombre": "Yahapé",
    "lat": -27.37,
    "lon": -57.5,
    "aprox": true
   }
  ]
 },
 {
  "zona": "PZAU",
  "nombre": "Alto Uruguay",
  "dependencias": [
   {
    "cuatri": "SAMO",
    "nombre": "Saltos del Moconá",
    "lat": -27.15,
    "lon": -53.9,
    "aprox": false
   },
   {
    "cuatri": "SOBR",
    "nombre": "El Soberbio",
    "lat": -27.3,
    "lon": -54.1967,
    "aprox": false
   },
   {
    "cuatri": "ALPO",
    "nombre": "Alba Posse",
    "lat": -27.5667,
    "lon": -54.6667,
    "aprox": false
   },
   {
    "cuatri": "PANA",
    "nombre": "Panambí",
    "lat": -27.7,
    "lon": -54.95,
    "aprox": true
   },
   {
    "cuatri": "SJAV",
    "nombre": "San Javier",
    "lat": -27.87,
    "lon": -55.13,
    "aprox": false
   },
   {
    "cuatri": "ITAC",
    "nombre": "Itacaruaré",
    "lat": -27.93,
    "lon": -55.25,
    "aprox": true
   },
   {
    "cuatri": "PBAR",
    "nombre": "Paso de la Barca",
    "lat": -27.97,
    "lon": -55.33,
    "aprox": true
   },
   {
    "cuatri": "SAMA",
    "nombre": "Santa María",
    "lat": -28.0,
    "lon": -55.4,
    "aprox": true
   },
   {
    "cuatri": "PUCO",
    "nombre": "Puerto Concepción",
    "lat": -28.06,
    "lon": -55.5,
    "aprox": true
   },
   {
    "cuatri": "MBNI",
    "nombre": "Marinero Benigno Niz",
    "lat": -28.12,
    "lon": -55.58,
    "aprox": true
   },
   {
    "cuatri": "GAVI",
    "nombre": "Garabí",
    "lat": -28.28,
    "lon": -55.77,
    "aprox": true
   },
   {
    "cuatri": "GARR",
    "nombre": "Garruchos",
    "lat": -28.1833,
    "lon": -55.65,
    "aprox": false
   },
   {
    "cuatri": "MEFI",
    "nombre": "Marinero Esteban Figueredo",
    "lat": -28.35,
    "lon": -55.9,
    "aprox": true
   },
   {
    "cuatri": "HORM",
    "nombre": "Paso Hormiguero",
    "lat": -28.45,
    "lon": -55.98,
    "aprox": true
   },
   {
    "cuatri": "TOME",
    "nombre": "Santo Tomé",
    "lat": -28.55,
    "lon": -56.0333,
    "aprox": false
   },
   {
    "cuatri": "",
    "nombre": "Mro. Lorenzo Romero",
    "lat": -28.65,
    "lon": -56.1,
    "aprox": true
   },
   {
    "cuatri": "RGDA",
    "nombre": "Marinero Ramón Guarda",
    "lat": -28.72,
    "lon": -56.15,
    "aprox": true
   },
   {
    "cuatri": "CUAY",
    "nombre": "Los Cuays",
    "lat": -28.8,
    "lon": -56.25,
    "aprox": true
   },
   {
    "cuatri": "ALVE",
    "nombre": "Alvear",
    "lat": -29.097,
    "lon": -56.553,
    "aprox": false
   },
   {
    "cuatri": "RTEN",
    "nombre": "Retén",
    "lat": -29.13,
    "lon": -56.6,
    "aprox": true
   },
   {
    "cuatri": "CRUZ",
    "nombre": "La Cruz",
    "lat": -29.175,
    "lon": -56.64,
    "aprox": false
   },
   {
    "cuatri": "AGUA",
    "nombre": "Aguapé",
    "lat": -29.27,
    "lon": -56.7,
    "aprox": true
   },
   {
    "cuatri": "GUVI",
    "nombre": "Guaviraví",
    "lat": -29.3667,
    "lon": -56.8167,
    "aprox": false
   },
   {
    "cuatri": "YAPE",
    "nombre": "Yapeyú",
    "lat": -29.4667,
    "lon": -56.8167,
    "aprox": false
   },
   {
    "cuatri": "LIBR",
    "nombre": "Paso de los Libres",
    "lat": -29.7125,
    "lon": -57.0875,
    "aprox": false
   },
   {
    "cuatri": "MALE",
    "nombre": "Marinero Martín Leiva",
    "lat": -29.82,
    "lon": -57.15,
    "aprox": true
   },
   {
    "cuatri": "LOSC",
    "nombre": "Los 108",
    "lat": -29.9,
    "lon": -57.25,
    "aprox": true
   },
   {
    "cuatri": "SANR",
    "nombre": "Santa Rosa",
    "lat": -30.0,
    "lon": -57.4,
    "aprox": true
   },
   {
    "cuatri": "JBOM",
    "nombre": "Juan Bompland",
    "lat": -30.1,
    "lon": -57.5,
    "aprox": true
   },
   {
    "cuatri": "MCAS",
    "nombre": "Monte Caseros",
    "lat": -30.25,
    "lon": -57.6333,
    "aprox": false
   },
   {
    "cuatri": "PGUA",
    "nombre": "Paniagua",
    "lat": -30.4,
    "lon": -57.8,
    "aprox": true
   },
   {
    "cuatri": "META",
    "nombre": "Mocoretá",
    "lat": -30.6,
    "lon": -57.9667,
    "aprox": false
   }
  ]
 },
 {
  "zona": "PZBU",
  "nombre": "Bajo Uruguay",
  "dependencias": [
   {
    "cuatri": "SELO",
    "nombre": "Santa Eloisa",
    "lat": -30.75,
    "lon": -57.9,
    "aprox": true
   },
   {
    "cuatri": "MOVI",
    "nombre": "Mandisoví",
    "lat": -30.85,
    "lon": -57.9,
    "aprox": true
   },
   {
    "cuatri": "FEDE",
    "nombre": "Federación",
    "lat": -30.9833,
    "lon": -57.9,
    "aprox": false
   },
   {
    "cuatri": "",
    "nombre": "Chaviyú",
    "lat": -31.12,
    "lon": -57.92,
    "aprox": true
   },
   {
    "cuatri": "SLGR",
    "nombre": "Represa Salto Grande",
    "lat": -31.27,
    "lon": -57.93,
    "aprox": false
   },
   {
    "cuatri": "CONC",
    "nombre": "Concordia",
    "lat": -31.3833,
    "lon": -58.0167,
    "aprox": false
   },
   {
    "cuatri": "YRUA",
    "nombre": "Yeruá",
    "lat": -31.5333,
    "lon": -58.1167,
    "aprox": true
   },
   {
    "cuatri": "LACA",
    "nombre": "La Calera",
    "lat": -31.7,
    "lon": -58.15,
    "aprox": true
   },
   {
    "cuatri": "CLON",
    "nombre": "Colón",
    "lat": -32.2167,
    "lon": -58.15,
    "aprox": false
   },
   {
    "cuatri": "AURQ",
    "nombre": "Arroyo Urquiza",
    "lat": -32.45,
    "lon": -58.2,
    "aprox": true
   },
   {
    "cuatri": "CURU",
    "nombre": "Concepción del Uruguay",
    "lat": -32.4833,
    "lon": -58.2333,
    "aprox": false
   },
   {
    "cuatri": "CMPI",
    "nombre": "Campichuelo",
    "lat": -32.65,
    "lon": -58.25,
    "aprox": true
   },
   {
    "cuatri": "GYCH",
    "nombre": "Gualeguaychú",
    "lat": -33.0092,
    "lon": -58.5172,
    "aprox": false
   },
   {
    "cuatri": "BGYC",
    "nombre": "Boca Gualeguaychú",
    "lat": -33.12,
    "lon": -58.4,
    "aprox": true
   },
   {
    "cuatri": "PURU",
    "nombre": "Puerto Ruiz",
    "lat": -33.2,
    "lon": -59.35,
    "aprox": true
   },
   {
    "cuatri": "PRTO",
    "nombre": "Paranacito",
    "lat": -33.7167,
    "lon": -58.65,
    "aprox": false
   },
   {
    "cuatri": "CANU",
    "nombre": "Canal Nuevo",
    "lat": -33.8,
    "lon": -58.6,
    "aprox": true
   }
  ]
 },
 {
  "zona": "PZLC",
  "nombre": "Lacustre y del Comahue",
  "dependencias": [
   {
    "cuatri": "CPIE",
    "nombre": "Casa de Piedra",
    "lat": -38.15,
    "lon": -67.2,
    "aprox": true
   },
   {
    "cuatri": "MMEN",
    "nombre": "Mari Menuco",
    "lat": -38.6,
    "lon": -68.7,
    "aprox": true
   },
   {
    "cuatri": "LPEL",
    "nombre": "Lago Pellegrini",
    "lat": -38.9,
    "lon": -68.0,
    "aprox": true
   },
   {
    "cuatri": "PEHU",
    "nombre": "Villa Pehuenia",
    "lat": -38.8833,
    "lon": -71.1833,
    "aprox": false
   },
   {
    "cuatri": "CHUE",
    "nombre": "Del Comahue (ex Neuquén)",
    "lat": -38.95,
    "lon": -68.0667,
    "aprox": true
   },
   {
    "cuatri": "VREG",
    "nombre": "Villa Regina",
    "lat": -39.1,
    "lon": -67.07,
    "aprox": false
   },
   {
    "cuatri": "LERM",
    "nombre": "Lago Exequiel Ramos Mexía",
    "lat": -39.5,
    "lon": -68.9,
    "aprox": true
   },
   {
    "cuatri": "PUCA",
    "nombre": "Puerto Canoa",
    "lat": -40.05,
    "lon": -71.5,
    "aprox": true
   },
   {
    "cuatri": "SMAN",
    "nombre": "San Martín de los Andes",
    "lat": -40.1572,
    "lon": -71.3534,
    "aprox": false
   },
   {
    "cuatri": "VTRA",
    "nombre": "Villa Traful",
    "lat": -40.6542,
    "lon": -71.3792,
    "aprox": false
   },
   {
    "cuatri": "VIAN",
    "nombre": "Villa La Angostura",
    "lat": -40.7632,
    "lon": -71.6451,
    "aprox": false
   },
   {
    "cuatri": "PUBL",
    "nombre": "Puerto Blest",
    "lat": -41.0167,
    "lon": -71.8167,
    "aprox": false
   },
   {
    "cuatri": "PANU",
    "nombre": "Puerto Pañuelo",
    "lat": -41.0583,
    "lon": -71.5333,
    "aprox": false
   },
   {
    "cuatri": "SCBA",
    "nombre": "San Carlos de Bariloche",
    "lat": -41.1335,
    "lon": -71.3103,
    "aprox": false
   },
   {
    "cuatri": "LPUE",
    "nombre": "Lago Puelo",
    "lat": -42.0833,
    "lon": -71.6167,
    "aprox": false
   },
   {
    "cuatri": "FUTA",
    "nombre": "Futalaufquen",
    "lat": -42.8667,
    "lon": -71.65,
    "aprox": false
   }
  ]
 },
 {
  "zona": "PZMN",
  "nombre": "Mar Argentino Norte",
  "dependencias": [
   {
    "cuatri": "PINA",
    "nombre": "Pinamar",
    "lat": -37.1083,
    "lon": -56.8556,
    "aprox": false
   },
   {
    "cuatri": "VIGE",
    "nombre": "Villa Gesell",
    "lat": -37.2639,
    "lon": -56.9733,
    "aprox": false
   },
   {
    "cuatri": "MPLA",
    "nombre": "Mar del Plata",
    "lat": -38.03,
    "lon": -57.52,
    "aprox": false
   },
   {
    "cuatri": "MMAR",
    "nombre": "Miramar",
    "lat": -38.2667,
    "lon": -57.8333,
    "aprox": false
   },
   {
    "cuatri": "QUEQ",
    "nombre": "Quequén",
    "lat": -38.5333,
    "lon": -58.7167,
    "aprox": false
   },
   {
    "cuatri": "CAYE",
    "nombre": "Balneario San Cayetano",
    "lat": -38.62,
    "lon": -59.2,
    "aprox": true
   },
   {
    "cuatri": "CLAR",
    "nombre": "Claromeco",
    "lat": -38.85,
    "lon": -60.0833,
    "aprox": false
   },
   {
    "cuatri": "PECO",
    "nombre": "Pehuen-có",
    "lat": -39.0167,
    "lon": -61.55,
    "aprox": false
   },
   {
    "cuatri": "MHER",
    "nombre": "Monte Hermoso",
    "lat": -38.9833,
    "lon": -61.2833,
    "aprox": false
   },
   {
    "cuatri": "BBLA",
    "nombre": "Bahía Blanca",
    "lat": -38.7183,
    "lon": -62.265,
    "aprox": false
   },
   {
    "cuatri": "PURO",
    "nombre": "Puerto Rosales",
    "lat": -38.9333,
    "lon": -62.0667,
    "aprox": false
   },
   {
    "cuatri": "SBLA",
    "nombre": "San Blas",
    "lat": -40.55,
    "lon": -62.2333,
    "aprox": false
   },
   {
    "cuatri": "PNES",
    "nombre": "Patagones",
    "lat": -40.8,
    "lon": -62.9833,
    "aprox": false
   },
   {
    "cuatri": "BRNE",
    "nombre": "Barra del Río Negro",
    "lat": -41.03,
    "lon": -62.8,
    "aprox": true
   },
   {
    "cuatri": "SANE",
    "nombre": "San Antonio Este",
    "lat": -40.7333,
    "lon": -64.8833,
    "aprox": false
   },
   {
    "cuatri": "SANT",
    "nombre": "San Antonio Oeste",
    "lat": -40.7333,
    "lon": -64.95,
    "aprox": false
   },
   {
    "cuatri": "LGRU",
    "nombre": "Las Grutas",
    "lat": -40.8167,
    "lon": -65.0833,
    "aprox": false
   },
   {
    "cuatri": "ELSA",
    "nombre": "Balneario Municipal El Salado",
    "lat": -41.2,
    "lon": -65.05,
    "aprox": true
   },
   {
    "cuatri": "PCOL",
    "nombre": "Punta Colorada",
    "lat": -41.7,
    "lon": -65.05,
    "aprox": true
   },
   {
    "cuatri": "GSJO",
    "nombre": "Golfo San José",
    "lat": -42.4,
    "lon": -64.45,
    "aprox": true
   },
   {
    "cuatri": "MADR",
    "nombre": "Puerto Madryn",
    "lat": -42.7692,
    "lon": -65.0386,
    "aprox": false
   },
   {
    "cuatri": "PIRA",
    "nombre": "Punta Pirámide",
    "lat": -42.5833,
    "lon": -64.2833,
    "aprox": false
   },
   {
    "cuatri": "RAWS",
    "nombre": "Rawson",
    "lat": -43.3,
    "lon": -65.1,
    "aprox": false
   }
  ]
 },
 {
  "zona": "PZMS",
  "nombre": "Mar Argentino Sur",
  "dependencias": [
   {
    "cuatri": "BCAM",
    "nombre": "Bahía Camarones",
    "lat": -44.8,
    "lon": -65.7,
    "aprox": false
   },
   {
    "cuatri": "CORD",
    "nombre": "Caleta Córdova",
    "lat": -45.75,
    "lon": -67.3667,
    "aprox": false
   },
   {
    "cuatri": "CRIV",
    "nombre": "Comodoro Rivadavia",
    "lat": -45.8667,
    "lon": -67.5,
    "aprox": false
   },
   {
    "cuatri": "TLLY",
    "nombre": "Rada Tilly",
    "lat": -45.9333,
    "lon": -67.55,
    "aprox": false
   },
   {
    "cuatri": "OLVA",
    "nombre": "Caleta Olivia",
    "lat": -46.4333,
    "lon": -67.5167,
    "aprox": false
   },
   {
    "cuatri": "LABA",
    "nombre": "Lago Buenos Aires",
    "lat": -46.6,
    "lon": -71.1,
    "aprox": true
   },
   {
    "cuatri": "DESE",
    "nombre": "Puerto Deseado",
    "lat": -47.75,
    "lon": -65.8833,
    "aprox": false
   },
   {
    "cuatri": "SJUL",
    "nombre": "San Julián",
    "lat": -49.3,
    "lon": -67.7167,
    "aprox": false
   },
   {
    "cuatri": "CLPB",
    "nombre": "Comandante Luís Piedrabuena",
    "lat": -49.9833,
    "lon": -68.9167,
    "aprox": false
   },
   {
    "cuatri": "SCRU",
    "nombre": "Santa Cruz",
    "lat": -50.0167,
    "lon": -68.5167,
    "aprox": false
   },
   {
    "cuatri": "PQUI",
    "nombre": "Punta Quilla",
    "lat": -50.1167,
    "lon": -68.4,
    "aprox": false
   },
   {
    "cuatri": "LARG",
    "nombre": "Lago Argentino",
    "lat": -50.3406,
    "lon": -72.2648,
    "aprox": false
   },
   {
    "cuatri": "RGAL",
    "nombre": "Río Gallegos e Islas Malvinas",
    "lat": -51.623,
    "lon": -69.2168,
    "aprox": false
   },
   {
    "cuatri": "LOYO",
    "nombre": "Punta Loyola",
    "lat": -51.6,
    "lon": -69.0,
    "aprox": false
   },
   {
    "cuatri": "CAVI",
    "nombre": "Cabo Vírgenes",
    "lat": -52.3,
    "lon": -68.35,
    "aprox": false
   },
   {
    "cuatri": "CULL",
    "nombre": "Cullen",
    "lat": -52.7,
    "lon": -68.6,
    "aprox": true
   },
   {
    "cuatri": "RGRA",
    "nombre": "Río Grande",
    "lat": -53.7877,
    "lon": -67.7095,
    "aprox": false
   },
   {
    "cuatri": "LFAG",
    "nombre": "Lago Fagnano",
    "lat": -54.5106,
    "lon": -67.1933,
    "aprox": false
   },
   {
    "cuatri": "PUAL",
    "nombre": "Puerto Almanza",
    "lat": -54.8667,
    "lon": -67.5833,
    "aprox": false
   },
   {
    "cuatri": "USHU",
    "nombre": "Ushuaia e Islas del Atlántico Sur",
    "lat": -54.8019,
    "lon": -68.303,
    "aprox": false
   },
   {
    "cuatri": "JUBE",
    "nombre": "Cabo Primero Julio Omar Benítez",
    "lat": -54.9,
    "lon": -67.7,
    "aprox": true
   },
   {
    "cuatri": "LAIA",
    "nombre": "Lapataia",
    "lat": -54.85,
    "lon": -68.55,
    "aprox": false
   },
   {
    "cuatri": "JOEL",
    "nombre": "Cabo Segundo Jorge Eduardo López",
    "lat": -54.95,
    "lon": -67.3,
    "aprox": true
   }
  ]
 }
];
