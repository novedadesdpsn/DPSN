# Novedades DPSN

Sistema de traspaso de novedades diario — Dirección de Policía de Seguridad de la Navegación (DPSN), Prefectura Naval Argentina.

## Estado actual (versión 1 — esqueleto navegable)

Esta primera versión ya tiene:
- Pantalla de login (`index.html`)
- Pantalla de selección de módulo: **Oficinas DPSN** / **Guardias DPSN** (`seleccion.html`), habilitada según los permisos del usuario
- Dashboard con **todas las pestañas** definidas hasta ahora, mostrando **datos de ejemplo** tomados del parte del 03/08/2026, para que se pueda ver cómo va a quedar la interfaz:
  - Inicio (resumen del día)
  - Inspecciones Extraordinarias (Bandera Argentina / Extranjera)
  - Inspecciones por Estado Rector de Puerto
  - Casos MAS
  - Casos SAR
  - Otros
  - Altura de Agua
  - Buques con Detención
  - Inspecciones Técnicas
  - División Control de Gestión
  - Licencias (Anual, Médica, Tareas Adecuadas, Extraordinaria, Comisiones, No Computables)
  - Relevo de Guardia (Saliente / Entrante)

**Todavía NO está conectado a Firebase real** (login funciona en "modo demo") ni a Google Sheets/Firestore. Eso es el paso siguiente.

## Cómo probarlo ahora (modo demo)

1. Abrí `index.html` en el navegador (o subilo a GitHub Pages).
2. Ingresá con:
   - Usuario: `demo@pna.gob.ar`
   - Contraseña: `demo1234`
3. Vas a poder navegar entre Oficinas DPSN y Guardias DPSN (el usuario demo tiene administrador en ambos) y recorrer todas las pestañas.

Este modo demo se desactiva solo en cuanto completes las credenciales reales en `js/firebase-config.js`.

## Próximos pasos (en orden)

1. **Crear el proyecto de Firebase** con el Gmail nuevo (instrucciones detalladas dentro de `js/firebase-config.js`).
2. **Completar `js/firebase-config.js`** con las credenciales reales.
3. **Cargar los usuarios** en la colección `usuarios` de Firestore, con su estructura de permisos (ver comentarios en `js/roles.js`).
4. **Reemplazar los datos de ejemplo** (`js/datos-ejemplo.js`) por lectura en vivo desde Firestore (`onSnapshot`).
5. **Armar el puente Google Sheets/Docs → Firestore** con Google Apps Script, para que sigas cargando la información como ya lo hacés hoy (planilla/documento) y se refleje solo en el sistema.
6. **Subir a GitHub Pages** para que el sistema tenga una URL pública (solo accesible con login).

## Estructura del proyecto

```
novedades-dpsn/
├── index.html          # Login
├── seleccion.html       # Selección de módulo (Oficinas / Guardias)
├── dashboard.html        # Dashboard con todas las pestañas
├── css/
│   └── style.css         # Estilos (paleta institucional PNA)
├── js/
│   ├── firebase-config.js  # Credenciales de Firebase (completar)
│   ├── roles.js             # Modelo de permisos por usuario
│   ├── auth.js               # Login / sesión / modo demo
│   ├── datos-ejemplo.js       # Datos de muestra para previsualizar
│   └── app.js                  # Render de pestañas y paneles
└── README.md
```

## Cómo subir el repositorio a GitHub y publicarlo (GitHub Pages)

1. Con el Gmail nuevo, entrá a [github.com](https://github.com) y creá una cuenta (si no la tenés ya).
2. Click en **"New repository"**. Nombre sugerido: `novedades-dpsn`. Dejalo en **Público** o **Privado** — con Privado, GitHub Pages también funciona, pero te va a pedir que el repo tenga GitHub Pages habilitado para organizaciones/plan pago en algunos casos; si da problemas, lo hacemos Público (de todos modos, quien no tenga login del sistema no puede ver los datos, así que no es un problema de seguridad real).
3. Subí todo el contenido de esta carpeta (`novedades-dpsn/`) al repositorio. Se puede hacer:
   - Desde la web de GitHub: botón "Add file" > "Upload files", y arrastrás todos los archivos y carpetas (manteniendo la estructura `css/`, `js/`, `assets/`).
   - O con Git desde la terminal, si preferís (`git init`, `git remote add origin ...`, `git add .`, `git commit`, `git push`).
4. Una vez subido: **Settings** (del repositorio) > **Pages** (en el menú de la izquierda) > en "Branch" elegís `main` y la carpeta `/ (root)` > Save.
5. GitHub te va a dar una URL del tipo `https://tu-usuario.github.io/novedades-dpsn/`. Puede demorar 1-2 minutos en estar activa la primera vez.
6. Esa URL es la que vas a compartir con el personal para que entren al sistema.

**Importante**: la carpeta `apps-script/` (el puente con Google Sheets) NO va dentro de este repositorio de GitHub — ese código se pega directamente en el editor de Apps Script de tu Google Sheet (Extensiones > Apps Script), como se explica en el propio archivo `apps-script/Code.gs`.

## Puente con Google Sheets (Apps Script)

En `apps-script/Code.gs` está el script que sincroniza tu hoja de cálculo con Firestore cada vez que se edita una celda. Incluye instrucciones detalladas de configuración (cuenta de servicio de Firebase, propiedades del script, trigger de edición) en los comentarios del propio archivo. Por ahora tiene armado el mapeo de la hoja "InspeccionesExtraordinarias" como modelo — vamos agregando el resto de las hojas (Casos MAS, Casos SAR, Estado Rector de Puerto, Licencias, etc.) siguiendo el mismo patrón, una vez que confirmemos cómo van a estar organizadas tus planillas reales.

