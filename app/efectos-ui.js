const DEFAULTS = Object.freeze({
  usarMotorEfectos: true,
  selectorEfectos: 'automatico',
  intensidadEfectos: 'normal',
  maxEfectosVisuales: '12'
});

let crearUrlApiEfectos = null;
let previsualizando = false;

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
      <label class="effects-preview-input" for="effectsPreviewText">
        <span>Texto de prueba para previsualizar</span>
        <textarea id="effectsPreviewText" rows="3" placeholder="Ejemplo: el video arranca fuerte, aparece una idea clave y termina con una conclusión potente."></textarea>
      </label>
      <div class="effects-actions">
        <button id="previewEffectsButton" class="secondary-button effects-preview-button" type="button">Previsualizar efectos</button>
      </div>
      <p id="effectsSettingsSummary" class="mini-summary">Motor activo · Selector automático · Intensidad normal · Máximo 12 efectos</p>
      <pre id="effectsPreviewResult" class="effects-preview-result" hidden></pre>
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

function obtenerPerfilActual() {
  return $('profileSelect')?.value || 'general';
}

function obtenerPlataformaActual() {
  return $('platformInput')?.value || 'tiktok';
}

function obtenerFormatoActual() {
  const modo = $('modeInput')?.value || 'cuadrado-centro';
  if (modo === 'horizontal' || modo === 'youtube-horizontal') return '16:9';
  if (modo === 'cuadrado' || modo === 'square') return '1:1';
  return '9:16';
}

function construirPayloadPrevisualizacion() {
  const opciones = leerControles();
  return {
    perfil: obtenerPerfilActual(),
    plataforma: obtenerPlataformaActual(),
    formato: obtenerFormatoActual(),
    duracionSegundos: 38,
    selectorEfectos: opciones.selectorEfectos === 'automatico' ? 'local' : opciones.selectorEfectos,
    intensidadEfectos: opciones.intensidadEfectos,
    maxEfectosVisuales: opciones.maxEfectosVisuales,
    texto: $('effectsPreviewText')?.value || ''
  };
}

function escribirResultadoPrevisualizacion(texto) {
  const salida = $('effectsPreviewResult');
  if (!salida) return;
  salida.hidden = false;
  salida.textContent = texto;
}

function resumirPrevisualizacion(previsualizacion = {}) {
  const efectos = Array.isArray(previsualizacion.efectos) ? previsualizacion.efectos : [];
  const principales = efectos.slice(0, 8).map((efecto, index) => `${index + 1}. ${efecto.nombre || efecto.efectoId} · ${efecto.categoria} · ${efecto.inicio}s-${efecto.fin}s`).join('\n');
  const advertencias = previsualizacion.planResumen?.advertencias?.length || 0;
  return [
    `OK: ${previsualizacion.ok ? 'sí' : 'con advertencias'}`,
    `Perfil: ${previsualizacion.entrada?.perfil || 'general'}`,
    `Selector: ${previsualizacion.planResumen?.origen || 'local'}${previsualizacion.planResumen?.fallbackLocal ? ' · fallback local' : ''}`,
    `Intensidad: ${previsualizacion.entrada?.intensidadEfectos || 'normal'}`,
    `Efectos del plan: ${previsualizacion.planResumen?.total || 0}`,
    `Antes de optimizar: ${previsualizacion.planResumen?.totalAntesOptimizar || previsualizacion.planResumen?.total || 0}`,
    `Filtros FFmpeg: ${previsualizacion.filtrosAplicados || 0}`,
    `Advertencias: ${advertencias}`,
    principales ? `\nEfectos principales:\n${principales}` : '\nSin efectos principales.'
  ].join('\n');
}

async function leerRespuestaJsonSegura(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch (_error) {
    return { ok: false, mensaje: texto };
  }
}

async function previsualizarEfectosDesdeUI() {
  if (previsualizando) return;
  if (typeof crearUrlApiEfectos !== 'function') {
    escribirResultadoPrevisualizacion('No se pudo previsualizar: falta conexión con el servidor local.');
    return;
  }

  const boton = $('previewEffectsButton');
  previsualizando = true;
  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Previsualizando...';
  }
  escribirResultadoPrevisualizacion('Generando previsualización técnica de efectos...');

  try {
    const respuesta = await fetch(await crearUrlApiEfectos('/api/autovideo/efectos/previsualizar'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(construirPayloadPrevisualizacion())
    });
    const datos = await leerRespuestaJsonSegura(respuesta);
    if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo generar la previsualización.');
    escribirResultadoPrevisualizacion(resumirPrevisualizacion(datos.previsualizacion));
  } catch (error) {
    escribirResultadoPrevisualizacion(`Error de previsualización: ${error.message}`);
  } finally {
    previsualizando = false;
    if (boton) {
      boton.disabled = false;
      boton.textContent = 'Previsualizar efectos';
    }
  }
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
  ['useEffectsEngine', 'effectsSelector', 'effectsIntensity', 'maxVisualEffects', 'effectsPreviewText', 'previewEffectsButton'].forEach((id) => {
    const control = $(id);
    if (control) control.disabled = bloquear || previsualizando;
  });
}

export function inicializarEfectosUI({ crearUrlApi = null } = {}) {
  crearUrlApiEfectos = crearUrlApi;
  if (!asegurarControlesEfectos()) return false;
  ['useEffectsEngine', 'effectsSelector', 'effectsIntensity', 'maxVisualEffects'].forEach((id) => {
    const control = $(id);
    if (control) control.addEventListener('change', actualizarResumenEfectos);
  });
  const botonPreview = $('previewEffectsButton');
  if (botonPreview) botonPreview.addEventListener('click', previsualizarEfectosDesdeUI);
  actualizarResumenEfectos();
  return true;
}
