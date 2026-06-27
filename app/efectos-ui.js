const DEFAULTS = Object.freeze({
  usarMotorEfectos: true,
  selectorEfectos: 'automatico',
  intensidadEfectos: 'normal',
  maxEfectosVisuales: '12'
});

function $(id) {
  return document.getElementById(id);
}

function obtenerAdvancedGrid() {
  return document.querySelector('.advanced-grid');
}

function crearMarkup() {
  return `
    <section id="effectsControlsCard" class="form-section options-card effects-card">
      <div class="options-header">
        <div>
          <h2>Efectos visuales</h2>
          <p>Controla el motor de 50+ efectos. Si Gemini no responde, se usa selector local.</p>
        </div>
      </div>
      <label class="toggle-row" for="useEffectsEngine">
        <input id="useEffectsEngine" name="usarMotorEfectos" type="checkbox" checked />
        <span><strong>Usar motor de efectos</strong><small>Planificador + catálogo + FFmpeg.</small></span>
      </label>
      <label class="select-row" for="effectsSelector">
        <span>Selector</span>
        <select id="effectsSelector" name="selectorEfectos">
          <option value="automatico" selected>Automático</option>
          <option value="local">Local seguro</option>
          <option value="gemini">Gemini</option>
        </select>
      </label>
      <label class="select-row" for="effectsIntensity">
        <span>Intensidad</span>
        <select id="effectsIntensity" name="intensidadEfectos">
          <option value="suave">Suave</option>
          <option value="normal" selected>Normal</option>
          <option value="fuerte">Fuerte</option>
        </select>
      </label>
      <label class="select-row" for="maxVisualEffects">
        <span>Máximo efectos</span>
        <select id="maxVisualEffects" name="maxEfectosVisuales">
          <option value="8">8</option>
          <option value="12" selected>12</option>
          <option value="16">16</option>
          <option value="20">20</option>
        </select>
      </label>
      <p id="effectsSettingsSummary" class="mini-summary">Motor activo · Selector automático · Intensidad normal · Máximo 12 efectos</p>
    </section>
  `;
}

function asegurarControlesEfectos() {
  if ($('effectsControlsCard')) return true;
  const contenedor = obtenerAdvancedGrid();
  if (!contenedor) return false;
  contenedor.insertAdjacentHTML('beforeend', crearMarkup());
  return true;
}

function normalizarOpciones(datos = {}) {
  return {
    usarMotorEfectos: datos.usarMotorEfectos !== false,
    selectorEfectos: datos.selectorEfectos || DEFAULTS.selectorEfectos,
    motorEfectosIA: datos.selectorEfectos || DEFAULTS.selectorEfectos,
    intensidadEfectos: datos.intensidadEfectos || DEFAULTS.intensidadEfectos,
    maxEfectosVisuales: String(datos.maxEfectosVisuales || DEFAULTS.maxEfectosVisuales)
  };
}

function leerControles() {
  return normalizarOpciones({
    usarMotorEfectos: $('useEffectsEngine')?.checked !== false,
    selectorEfectos: $('effectsSelector')?.value || DEFAULTS.selectorEfectos,
    intensidadEfectos: $('effectsIntensity')?.value || DEFAULTS.intensidadEfectos,
    maxEfectosVisuales: $('maxVisualEffects')?.value || DEFAULTS.maxEfectosVisuales
  });
}

export function obtenerOpcionesEfectos() {
  asegurarControlesEfectos();
  const opciones = leerControles();
  return {
    usarMotorEfectos: opciones.usarMotorEfectos ? 'true' : 'false',
    selectorEfectos: opciones.selectorEfectos,
    motorEfectosIA: opciones.motorEfectosIA,
    intensidadEfectos: opciones.intensidadEfectos,
    maxEfectosVisuales: opciones.maxEfectosVisuales
  };
}

export function actualizarResumenEfectos() {
  asegurarControlesEfectos();
  const resumen = $('effectsSettingsSummary');
  if (!resumen) return null;
  const opciones = leerControles();
  const estado = opciones.usarMotorEfectos ? 'Motor activo' : 'Motor apagado';
  const selector = opciones.selectorEfectos === 'gemini' ? 'Gemini' : opciones.selectorEfectos === 'local' ? 'Local seguro' : 'Automático';
  resumen.textContent = `${estado} · Selector ${selector} · Intensidad ${opciones.intensidadEfectos} · Máximo ${opciones.maxEfectosVisuales} efectos`;
  return opciones;
}

export function bloquearControlesEfectos(bloquear) {
  asegurarControlesEfectos();
  ['useEffectsEngine', 'effectsSelector', 'effectsIntensity', 'maxVisualEffects'].forEach((id) => {
    const control = $(id);
    if (control) control.disabled = bloquear;
  });
}

export function inicializarEfectosUI() {
  if (!asegurarControlesEfectos()) return false;
  ['useEffectsEngine', 'effectsSelector', 'effectsIntensity', 'maxVisualEffects'].forEach((id) => {
    const control = $(id);
    if (control) control.addEventListener('change', actualizarResumenEfectos);
  });
  actualizarResumenEfectos();
  return true;
}
