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

## Notas

- El diseño toma la paleta institucional (azul marino / dorado) y evita depender de imágenes externas — todo funciona con HTML/CSS/JS puro, sin necesidad de instalar nada ni usar build tools, para que sea simple de mantener y desplegar en GitHub Pages.
- Los botones "Editar", "+ Agregar caso" y "+ Agregar bloque" están deshabilitados a propósito: se activan cuando conectemos la escritura real a Firestore.
