// ============================================================
// DESHACER — Novedades DPSN
// ============================================================
// Deshace el último cambio hecho en cualquier parte del sistema
// (cargar, editar o borrar inspecciones, licencias, casos, etc.,
// y también "Finalizar Guardia"). Funciona con "fotos" del estado
// completo del parte: cada vez que se guarda algo, se conserva la
// foto anterior. Se pueden deshacer hasta 40 cambios seguidos, en
// esta sesión (si se recarga la página, el historial de deshacer
// arranca de nuevo). Atajo de teclado: Ctrl+Z (fuera de un campo
// de texto). También hay "Rehacer" (Ctrl+Y) para volver a aplicar un
// cambio que se deshizo de más.
// ============================================================

const UNDO = {
  pila: [],
  rehacerPila: [],
  base: null,
  ignorarProximo: false,
  MAX: 40,

  foto() {
    const paquete = {};
    SECCIONES_PERSISTIDAS.forEach(clave => { paquete[clave] = DATOS_EJEMPLO[clave]; });
    return JSON.stringify(paquete);
  },

  /** Toma la foto de partida (después de cargar los datos o de recibir cambios de otro usuario). */
  reiniciar() { this.base = this.foto(); this.actualizarBoton(); },

  /** Se llama desde persistirDatosGuardia() cada vez que se guarda. */
  registrar(ahora) {
    if (this.ignorarProximo) { this.ignorarProximo = false; this.base = ahora; this.actualizarBoton(); return; }
    if (this.base === null) { this.base = ahora; return; }
    if (ahora === this.base) return;
    this.pila.push(this.base);
    if (this.pila.length > this.MAX) this.pila.shift();
    this.rehacerPila = []; // un cambio nuevo invalida lo que se podía rehacer
    this.base = ahora;
    this.actualizarBoton();
  },

  /** Aplica una foto completa del parte y la guarda (sin generar historial de deshacer). */
  aplicarFoto(fotoStr) {
    const f = JSON.parse(fotoStr);
    SECCIONES_PERSISTIDAS.forEach(clave => { if (f[clave] !== undefined) DATOS_EJEMPLO[clave] = f[clave]; });
    this.ignorarProximo = true;
    persistirDatosGuardia();
    this.ignorarProximo = false;
    this.base = this.foto();
    if (typeof refrescarPestanaActual === 'function') refrescarPestanaActual();
  },

  hayModalAbierto() { return !!(document.getElementById('modalFormulario') || document.getElementById('modalInspeccion')); },

  deshacer() {
    if (!this.pila.length || this.hayModalAbierto()) return;
    this.rehacerPila.push(this.foto());
    this.aplicarFoto(this.pila.pop());
    this.actualizarBoton();
    this.aviso('Se deshizo el último cambio.');
  },

  rehacer() {
    if (!this.rehacerPila.length || this.hayModalAbierto()) return;
    this.pila.push(this.foto());
    this.aplicarFoto(this.rehacerPila.pop());
    this.actualizarBoton();
    this.aviso('Se rehizo el cambio.');
  },

  actualizarBoton() {
    const b = document.getElementById('btnDeshacer');
    if (!b) return;
    b.disabled = !this.pila.length;
    b.textContent = this.pila.length ? `↶ Deshacer (${this.pila.length})` : '↶ Deshacer';
    b.title = this.pila.length ? 'Deshace el último cambio (Ctrl+Z)' : 'No hay cambios para deshacer';
    const r = document.getElementById('btnRehacer');
    if (r) {
      r.disabled = !this.rehacerPila.length;
      r.textContent = this.rehacerPila.length ? `↷ Rehacer (${this.rehacerPila.length})` : '↷ Rehacer';
      r.title = this.rehacerPila.length ? 'Vuelve a aplicar el cambio deshecho (Ctrl+Y)' : 'No hay cambios para rehacer';
    }
  },

  aviso(texto) {
    const d = document.createElement('div');
    d.textContent = texto;
    d.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#0b1626; color:#fff; padding:10px 18px; border-radius:8px; font-size:13px; z-index:300; box-shadow:0 6px 20px rgba(0,0,0,.3);';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2200);
  },

  iniciar() {
    const b = document.getElementById('btnDeshacer');
    if (b) {
      if (SOLO_LECTURA_ACTUAL) { b.classList.add('oculto'); const r0 = document.getElementById('btnRehacer'); if (r0) r0.classList.add('oculto'); return; }
      b.addEventListener('click', () => this.deshacer());
      const r = document.getElementById('btnRehacer');
      if (r) r.addEventListener('click', () => this.rehacer());
    }
    document.addEventListener('keydown', (e) => {
      if (SOLO_LECTURA_ACTUAL) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.deshacer(); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.rehacer(); }
    });
    this.pila = [];
    this.rehacerPila = [];
    this.reiniciar();
  }
};
