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

## Carga directa de datos (sin depender de Google Sheets)

Inspecciones Extraordinarias, Estado Rector de Puerto, Casos MAS, Casos SAR y los Buques con Detención del mapa se cargan directamente desde el dashboard (botones "+ Agregar..."). Se guardan en el navegador (localStorage): sobreviven a un refresco de página o a cerrar el navegador, pero por ahora quedan en esa computadora puntual — no se sincronizan todavía entre usuarios distintos. Eso llega cuando esta misma lógica se conecte a Firestore en lugar de localStorage.

## Guardar copia del PDF exportado en Drive

Ver `apps-script/Code.gs` (función `doPost`) y completar `js/integraciones-config.js` con la URL del despliegue y el ID de la carpeta de Drive.

## Vincular Google Sheets (opcional, alternativa a la carga directa)

Ver `GUIA_GOOGLE_SHEETS.md` para las columnas exactas de cada hoja, y `apps-script/Code.gs` para el puente hacia Firestore.

## Cómo subir a GitHub Pages

1. Creá un repositorio (ej: `novedades-dpsn`) y subí todo el contenido de esta carpeta manteniendo la estructura.
2. **Settings > Pages** > Branch `main`, carpeta `/ (root)` > Save.
3. GitHub te da una URL tipo `https://tu-usuario.github.io/novedades-dpsn/` — esa es la que compartís con el personal.

## Asistente de Búsqueda

Busca por nombre de buque o por fecha cruzando Inspecciones Extraordinarias, PSC, Casos MAS y SAR. Es un buscador por coincidencia de texto sobre los datos ya cargados — no una inteligencia artificial conversacional (eso requeriría un servidor propio con clave de API).
