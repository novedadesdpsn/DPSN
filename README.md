# Novedades DPSN

Sistema de traspaso de novedades diario — Dirección de Policía de Seguridad de la Navegación (DPSN), Prefectura Naval Argentina.

## Estructura del proyecto

```
novedades-dpsn/
├── index.html              # Login (DNI + contraseña)
├── dashboard.html            # Único módulo: parte diario completo
├── css/style.css
├── js/
│   ├── firebase-config.js      # Credenciales de Firebase (completar)
│   ├── roles.js                 # Modelo de permisos
│   ├── auth.js                    # Login con DNI / sesión / modo demo
│   ├── datos-ejemplo.js             # Datos de muestra iniciales
│   ├── datos-guardia.js               # Carga directa + persistencia local
│   ├── mapa-buques.js                   # Mapa de buques con detención
│   ├── codigos.js                         # Códigos de deficiencia
│   ├── estadisticas.js                      # Pestaña Estadísticas
│   ├── asistente.js                           # Buscador por buque/fecha
│   ├── integraciones-config.js                  # Config del guardado en Drive
│   ├── exportacion-texto.js                       # Contenido limpio para el PDF
│   ├── pdf-export.js                                # Generación del PDF
│   └── app.js                                         # Navegación y paneles
├── embeds/
│   ├── mapa-inspectores.html    # Mapa de inspectores (ver más abajo)
│   └── tablero-inspectores.html # Panel completo con filtros
├── data/listado-inspectores.xlsx  # Fuente de datos del mapa de inspectores
├── apps-script/Code.gs           # Puente Sheets/Drive → Firestore
└── GUIA_GOOGLE_SHEETS.md          # Columnas de cada hoja de cálculo
```

## Cómo probarlo ahora (modo demo)

Abrí `index.html`. Mientras `js/firebase-config.js` tenga las claves de ejemplo, el login acepta:
- DNI: `30123456`
- Contraseña: `demo1234`

## El mapa de inspectores (columna derecha de Inicio)

`embeds/mapa-inspectores.html` se genera a partir de `data/listado-inspectores.xlsx`. Cuando necesites actualizar los inspectores por dependencia, actualizás ese Excel y volvés a generar el mapa con el mismo proceso que se usó para crearlo la primera vez (Folium/Python), reemplazando el archivo en `embeds/`. El botón "Ver panel" abre `embeds/tablero-inspectores.html`, el listado completo con filtros.

## Conectar Firebase de verdad (reemplaza el modo demo)

1. Con tu Gmail nuevo, entrá a [console.firebase.google.com](https://console.firebase.google.com) y creá un proyecto.
2. **Authentication** > "Sign-in method" > habilitá "Correo electrónico/contraseña".
3. **Firestore Database** > "Crear base de datos" > modo producción.
4. **Configuración del proyecto** > "Tus apps" > Web (`</>`) > copiá el objeto y pegalo en `js/firebase-config.js`.
5. **Authentication > Users > Add user**: el login pide **DNI**, pero Firebase solo acepta e-mails. En el campo "Email" de cada usuario poné `{DNI}@dpsn.pna.gob.ar` (ej: `30123456@dpsn.pna.gob.ar`). A la persona solo le decís su DNI y la contraseña.
6. Por cada usuario, copiá su **UID** y en Firestore creá `usuarios/{uid}`:
   ```
   { nombre: "Apellido, Nombre", jerarquia: "PR", administradorGlobal: false, permisos: { guardias: "admin" } }
   ```

## Carga directa de datos — ahora en vivo con Firestore

Inspecciones Extraordinarias, Estado Rector de Puerto, Casos MAS, Casos SAR, Otros, Buques con Detención (tabla y mapa), Inspecciones Técnicas, Control de Gestión, Licencias y Cursos se cargan directamente desde el dashboard. Cada sección es un documento en la colección `parteDiario` de Firestore. En cuanto completes las credenciales reales en `js/firebase-config.js` (ver más abajo), todo lo que se cargue queda:
- **Guardado de verdad**, no en el navegador.
- **Compartido en vivo**: si una persona carga algo desde una computadora, a los demás usuarios conectados se les actualiza solo, sin recargar la página.

Mientras el proyecto siga en modo demo, sigue funcionando igual que antes pero guardado solo en ese navegador (localStorage) — es el mismo comportamiento de siempre, ya no hace falta ningún cambio de código para pasar de uno a otro: se activa solo apenas completes `firebase-config.js`.

## Guardar copia del PDF exportado en Drive

1. Desplegá `apps-script/Code.gs` como Aplicación web (los pasos están comentados arriba de la función `doPost` en ese mismo archivo).
2. Completá `js/integraciones-config.js` con la URL del despliegue y el ID de la carpeta de Drive.
3. Cada exportación de PDF desde Guardias descarga el archivo en la computadora **y** manda una copia a esa carpeta de Drive automáticamente.
4. Con eso configurado, en el topbar aparece el botón **"PDFs archivados"**: lista todos los PDFs guardados en Drive, con link para abrir cada uno.

**Si ya tenías el Apps Script desplegado de antes**, hace falta volver a implementarlo para que tome la función nueva (`doGet`, la que lista los archivos): en el editor de Apps Script, **Implementar > Administrar implementaciones** → ícono de lápiz sobre la implementación existente → "Versión: Nueva versión" → Implementar. La URL no cambia, así que no hace falta tocar `integraciones-config.js`.

## Vincular Google Sheets (opcional, alternativa a la carga directa)

Ver `GUIA_GOOGLE_SHEETS.md` para las columnas exactas de cada hoja, y `apps-script/Code.gs` para el puente hacia Firestore.

## Cómo subir a GitHub Pages

1. Creá un repositorio (ej: `novedades-dpsn`) y subí todo el contenido de esta carpeta manteniendo la estructura.
2. **Settings > Pages** > Branch `main`, carpeta `/ (root)` > Save.
3. GitHub te da una URL tipo `https://tu-usuario.github.io/novedades-dpsn/` — esa es la que compartís con el personal.

## Asistente de Búsqueda

Busca por nombre de buque o por fecha cruzando Inspecciones Extraordinarias, PSC, Casos MAS y SAR. Es un buscador por coincidencia de texto sobre los datos ya cargados — no una inteligencia artificial conversacional (eso requeriría un servidor propio con clave de API).

## Guía paso a paso — conectar Firestore de verdad

Esto es lo único que falta para que el sistema quede compartido entre todas las computadoras. Son pasos manuales en tu cuenta de Google/Firebase (yo no puedo hacerlos por vos), pero el código ya está listo esperando que los completes.

### Paso 1 — Crear el proyecto de Firebase (si todavía no lo hiciste)
1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) con el Gmail que vas a usar para este sistema.
2. "Crear un proyecto" → nombre sugerido `novedades-dpsn` → seguís los pasos (podés desactivar Google Analytics, no hace falta).

### Paso 2 — Habilitar Authentication
1. En el menú de la izquierda: **Compilación > Authentication** → "Comenzar".
2. Pestaña "Sign-in method" → "Correo electrónico/contraseña" → habilitarlo → Guardar.

### Paso 3 — Crear la base de datos Firestore
1. **Compilación > Firestore Database** → "Crear base de datos".
2. Elegí "Modo producción" (más seguro; las reglas del Paso 6 son las que van a permitir el acceso correcto).
3. Región: cualquiera cercana (ej. `southamerica-east1`, San Pablo) — no se puede cambiar después, pero para este uso no es crítico cuál elijas.

### Paso 4 — Conectar la app al proyecto
1. En la página principal del proyecto, ícono `</>` ("Agregar app" → Web).
2. Ponele un apodo (ej. "Dashboard DPSN") → "Registrar app".
3. Te va a mostrar un bloque de código con un objeto `firebaseConfig = {...}`. Copiá esos valores.
4. Abrí `js/firebase-config.js` del proyecto y reemplazá cada `"REEMPLAZAR_..."` por el valor real correspondiente (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
5. Guardá el archivo. **Apenas hagas esto, el modo demo se apaga solo** — el login va a dejar de aceptar `30123456` / `demo1234` y va a pedir un usuario real (que armamos en el paso siguiente).

### Paso 5 — Crear los usuarios reales
Por cada persona que vaya a usar el sistema:
1. **Authentication > Users > Add user**.
2. Campo "Email": `{DNI}@dpsn.pna.gob.ar` (ejemplo, para el DNI 30.123.456: `30123456@dpsn.pna.gob.ar`). El correo es solo interno — a la persona nunca se lo mencionás, ella entra con su DNI y contraseña común.
3. Contraseña: una provisoria (se la pasás vos, ella la puede cambiar después si querés agregar esa función más adelante).
4. Guardar. Te va a quedar listado con un **UID** (una cadena larga de letras y números) — copialo, lo necesitás ahora.
5. Andá a **Firestore Database > Datos** → "Iniciar colección" (si es la primera vez) → ID de la colección: `usuarios`.
6. ID del documento: pegá el UID que copiaste (NO le pongas nombre vos, tiene que ser exactamente ese UID).
7. Agregás estos campos al documento:
   - `nombre` (string) → ej. `"Piccoli, Leonardo Agustín"`
   - `jerarquia` (string) → ej. `"OP"`
   - `administradorGlobal` (boolean) → `true` solo para Director/jefes de depto-división; el resto `false`
   - `permisos` (map) → adentro un campo `guardias` (string) con valor `"admin"` o `"lector"` según corresponda
8. Guardar. Repetís esto por cada persona.

### Paso 6 — Reglas de seguridad de Firestore
Por defecto, "Modo producción" bloquea todo. Hay que decirle a Firestore quién puede leer/escribir:
1. **Firestore Database > Reglas**.
2. Reemplazá todo el contenido por el que está en `firestore.rules` (incluido en este proyecto).
3. "Publicar".

Estas reglas hacen que: cualquier usuario logueado pueda leer los datos del parte, pero solo quienes tengan `administradorGlobal: true` o `permisos.guardias: "admin"` puedan escribir — el mismo criterio que ya aplica la interfaz, ahora reforzado también del lado del servidor (así nadie puede saltearse el permiso editando el HTML a mano).

### Paso 7 — Probar
1. Abrí el sistema (local o ya subido a GitHub Pages) en el navegador.
2. Entrá con el DNI y la contraseña de un usuario real que hayas creado.
3. Cargá algo de prueba en cualquier pestaña (ej. una inspección extraordinaria).
4. Abrí el mismo link en **otra computadora, o en una ventana de incógnito** (para simular otro usuario), logueate con otro usuario real, y confirmá que lo que cargaste en el paso 3 ya aparece ahí — sin que vos hayas hecho nada más que guardarlo.
5. Si algo no aparece: abrí la consola del navegador (F12 → pestaña "Console") en ambas ventanas — cualquier error de permisos o de conexión con Firestore va a aparecer ahí, y suele indicar si el problema es de reglas (Paso 6) o de configuración (Paso 4).

### Qué queda afuera todavía
- Si dos personas editan la **misma sección** al mismo tiempo desde dos computadoras distintas, gana el último que guarda (no hay fusión automática de cambios). Para el volumen de uso de una guardia esto no debería ser un problema real, pero es bueno saberlo.
- Los usuarios se siguen creando a mano en la consola de Firebase — no hay todavía una pantalla dentro del sistema para que un administrador dé de alta gente sin entrar a Firebase. Se puede construir más adelante si lo necesitás.
