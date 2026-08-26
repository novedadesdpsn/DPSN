# Guía de Google Sheets — Novedades DPSN

Un archivo de Google Sheets, con **una hoja (pestaña) por sección**. El nombre de la pestaña tiene que ser EXACTAMENTE el que figura acá (sin tildes, sin espacios), porque `apps-script/Code.gs` lo usa para saber qué sincronizar. La primera fila de cada hoja son los encabezados de columna; a partir de la fila 2 va el contenido.

## Módulo Guardias (parte diario)

### Hoja `InspeccionesExtraordinarias`
| Columna | Valores esperados |
|---|---|
| Bandera | `Argentina` o `Extranjera` |
| Dependencia | Sigla (FORM, ZARA, SLOR, etc.) |
| Tipo | `Inicial`, `Detallada` o `Seguimiento` |
| Buque_Tipo | L/M, B/P, B/M, B/T, etc. |
| Buque_Nombre | Nombre del buque |
| Matricula | Matrícula, IMO o MMSI |
| Categoria | `pesquerosOtros`, `porAveria`, `cargaPasaje`, `convoyesExtr` o `convoyArgentino` |
| Codigos_Deficiencia | Códigos separados por coma (ej: `10,17`) — vacío si es Inicial |
| Asunto | Solo si aplica (casos derivados de un MAS, etc.) |
| FechaInspMasDetallada | Solo si Tipo = Seguimiento |
| Nota | Aclaración libre |

*(Ya está sincronizada en el Apps Script como modelo — es la que ya probamos.)*

### Hoja `EstadoRectorPuerto`
| Columna | Valores esperados |
|---|---|
| Dependencia | Sigla |
| Tipo | `IISD`, `IICD` o `IS` |
| Buque_Tipo, Buque_Nombre, Matricula, Bandera | Igual que arriba |
| Codigos_Deficiencia | Códigos separados por coma |
| FechaInspMasDetallada | Solo si Tipo = IS |
| Nota | Aclaración libre |

### Hoja `ResumenPSC` (una sola fila de datos)
| Columna | Descripción |
|---|---|
| BuquesIngresados | Buques extranjeros ingresados |
| FactiblesDiario | Buques factibles de inspección (hoy) |
| InspeccionadosDiario | Buques inspeccionados (hoy) |
| FactiblesAnual | Acumulado anual de factibles |
| InspeccionadosAnual | Acumulado anual de inspeccionados |

### Hoja `CasosMAS`
| Columna | Valores esperados |
|---|---|
| Dependencia | Sigla |
| Estado | `pendiente` o `cerrado` |
| Titulo | Ej: "R/E KOETI" |
| Asunto | Texto tipo "CASO MAS PZBP N.º 38/26 – ..." |
| Posicion | Lat/lon o referencia |
| Novedad | Última actualización |
| Caracteristicas | Datos del buque/convoy |
| Situacion | Relato cronológico completo |

*(Ya sincronizada en el Apps Script como modelo del patrón "agrupado por dependencia".)*

### Hoja `CasosSAR`
| Columna | Valores esperados |
|---|---|
| Dependencia | Sigla |
| Estado | `pendiente` o `cerrado` |
| NumeroCaso | Ej: "34/2026" |
| SubcentroVTS | Ej: KSBB, KSCR |
| Titulo, NombreBuque, Matricula, Bandera | — |
| FechaInicio, FechaCierre | — |
| Posicion, Novedad, Caracteristicas, Situacion | Igual que Casos MAS |

### Hoja `Otros`
| Columna | Descripción |
|---|---|
| Dependencia | Sigla |
| Titulo | Título de la novedad |
| Contenido | Texto libre |

### Hoja `AlturaAgua`
| Columna | Descripción |
|---|---|
| Punto | Ej: "Puerto Rosario" |
| Fecha | dd/mm/aaaa |
| Altura | Valor numérico |
| Escala | Letra de escala (ej: "C") |

### Hoja `CaladosNavegacion`
| Columna | Descripción |
|---|---|
| Tramo | Ej: "San Lorenzo Norte y Centro" |
| Referencia | Ej: "EP. Bella Vista / Copello Km 452,6" |
| Calado | Valor numérico |

### Hoja `Dragas`
| Columna | Descripción |
|---|---|
| Nombre | Nombre de la draga |
| DiasOperando | Número de días |

### Hoja `BuquesDetencion`
| Columna | Descripción |
|---|---|
| Numero | Correlativo |
| Dependencia | Sigla + subdependencia (ej: "PZMN — RAWS") |
| Buque | Nombre y matrícula |
| Fecha | dd/mm/aaaa |
| TipoInsp | Ej: "ID" |
| Deficiencias | Ej: "Cód. 30 (02) / Cód. 17 (02)" |

### Hoja `InspeccionesTecnicas`
| Columna | Descripción |
|---|---|
| Especialidad | Casco, Máquinas, etc. |
| Embarcacion | Nombre/empresa |
| Requerimiento | Ej: "Verificación de planos" |
| Lugar | Ej: "TANDANOR" |
| Inspector | Nombre y jerarquía |
| Extranjero | `SI` o `NO` |
| SalidaFechaHora, SalidaVuelo, SalidaDestino | Solo si Extranjero = SI |
| RegresoFechaHora, RegresoVuelo, RegresoDestino | Solo si Extranjero = SI |

### Hoja `ControlGestion`
| Columna | Descripción |
|---|---|
| TipoAuditoria | Ej: "S.G.S." |
| Embarcacion | Nombre/matrícula |
| Alcance | Ej: "Renovación" |
| Lugar | — |
| Auditor | Nombre y jerarquía |

### Hoja `Licencias`
| Columna | Valores esperados |
|---|---|
| Categoria | `anual`, `medica`, `tareasAdecuadas`, `extraordinaria`, `comisiones` o `noComputable` |
| Jerarquia | Ej: "PR" |
| Nombre | Apellido, Nombre |
| Inicia, Vence | dd/mm/aaaa |

*(Ya sincronizada en el Apps Script como modelo del patrón "plano con columna de categoría".)*

### Hoja `Guardia`
| Columna | Valores esperados |
|---|---|
| Turno | `saliente` o `entrante` |
| Rol | Jefe de Servicio, Oficial de Guardia, Ayte. de Guardia |
| Nombre | Jerarquía y apellido/nombre |

## Cómo se integra cada hoja nueva al programa

1. Creá la hoja con el nombre exacto y las columnas de esta guía.
2. En `apps-script/Code.gs`, agregá un `else if` más en la función `alEditarHoja`, apuntando a una función `sincronizarNombreHoja()` nueva.
3. Esa función nueva se escribe copiando el patrón de `sincronizarCasosMAS()` (si los datos se agrupan por dependencia) o de `sincronizarLicencias()` (si es una tabla plana con una columna de categoría) — son los dos moldes que ya están armados en el archivo.
4. Al final de esa función, llamás a `escribirEnFirestore('parteDiario/nombreDeLaSeccion', tuObjeto)`.
5. Ejecutás de nuevo `instalarTrigger()` una sola vez si es la primera vez que tocás el script (no es necesario si el trigger ya está instalado).

**Importante:** con esto los datos ya viajan de tu Sheet a Firestore. El paso que todavía falta — y que vamos a hacer juntos en la próxima etapa — es conectar el **dashboard** para que lea esos datos en vivo desde Firestore en lugar de los datos de ejemplo (`js/datos-ejemplo.js`). Ese es el próximo paso lógico una vez que tengas las hojas y el Apps Script funcionando.
