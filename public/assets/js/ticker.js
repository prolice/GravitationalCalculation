class Ticker {
  constructor() {
    // Utiliser explicitement window.PHYS pour éviter toute portée globale manquante
    const JY = (window.PHYS && window.PHYS.JULIAN_YEAR) ? window.PHYS.JULIAN_YEAR : 365.25 * 86400;
    const DAY_S = (window.PHYS && window.PHYS.DAY_S) ? window.PHYS.DAY_S : 86400;

    this._JY = JY;
    this._DAY_S = DAY_S;

    // DÉMARRER EN PAUSE PAR DÉFAUT
    this.running = false;
    this.speed = this._JY; // secondes simulées / seconde réelle
    this.simTime = 0;
    this.stepSize = this._DAY_S; // step = 1 jour
    this._last = performance.now();
    this._subs = new Set();
    this._raf = null;
    this._fps = 0; this._fpsAlpha = 0.12;
    this._loop = this._loop.bind(this);
  }
  on(fn) { this._subs.add(fn); }
  off(fn) { this._subs.delete(fn); }
  setSpeed(simSecondsPerSecond) { this.speed = Math.max(0, simSecondsPerSecond); }
  pause() { this.running = false; }
  play() { this.running = true; this._last = performance.now(); }
  toggle() { this.running ? this.pause() : this.play(); }
  step() { const dtSim = this.stepSize; this.simTime += dtSim; for (const fn of this._subs) fn({ dtReal: 0, dtSim, simTime: this.simTime }); }
  reset() { this.simTime = 0; }
  start() { if (this._raf == null) this._raf = requestAnimationFrame(this._loop); }
  _loop(now) {
    const dtReal = Math.min(0.05, (now - this._last) / 1000); this._last = now;
    if (this.running) {
      const dtSim = dtReal * this.speed; this.simTime += dtSim;
      for (const fn of this._subs) fn({ dtReal, dtSim, simTime: this.simTime });
    }
    const instFps = 1 / Math.max(1e-6, dtReal);
    this._fps = this._fps ? (this._fps * (1 - this._fpsAlpha) + instFps * this._fpsAlpha) : instFps;
    const fpsLabel = document.getElementById('fpsLabel');
    if (fpsLabel) fpsLabel.textContent = Math.round(this._fps);
    this._raf = requestAnimationFrame(this._loop);
  }
}
window.Ticker = Ticker;
