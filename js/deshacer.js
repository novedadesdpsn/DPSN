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
// de texto).
// ============================================================

const UNDO = {
  pila: [],
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
    this.base = ahora;
    this.actualizarBoton();
  },

  deshacer() {
    if (!this.pila.length) return;
    if (document.getElementById('modalFormulario') || document.getElementById('modalInspeccion')) return;
    const anterior = JSON.parse(this.pila.pop());
    SECCIONES_PERSISTIDAS.forEach(clave => { if (anterior[clave] !== undefined) DATOS_EJEMPLO[clave] = anterior[clave]; });
    this.ignorarProximo = true;
    persistirDatosGuardia();
    this.ignorarProximo = false;
    this.base = this.foto();
    this.actualizarBoton();
    if (typeof refrescarPestanaActual === 'function') refrescarPestanaActual();
    this.aviso('Se deshizo el último cambio.');
  },

  actualizarBoton() {
    const b = document.getElementById('btnDeshacer');
    if (!b) return;
    b.disabled = !this.pila.length;
    b.textContent = this.pila.length ? `↶ Deshacer (${this.pila.length})` : '↶ Deshacer';
    b.title = this.pila.length ? 'Deshace el último cambio (Ctrl+Z)' : 'No hay cambios para deshacer';
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
      if (SOLO_LECTURA_ACTUAL) { b.classList.add('oculto'); return; }
      b.addEventListener('click', () => this.deshacer());
    }
    document.addEventListener('keydown', (e) => {
      if (SOLO_LECTURA_ACTUAL) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        const t = e.target && e.target.tagName;
        if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
        e.preventDefault();
        this.deshacer();
      }
    });
    this.pila = [];
    this.reiniciar();
  }
};
