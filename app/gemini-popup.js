const STORAGE_KEY = 'AutoVideoJeff.gemini.config.v1';

const DEFAULTS = Object.freeze({
  usarGemini: false,
  usarFallbackGemini: true,
  geminiCredencial: '',
  geminiModelo: 'gemini-1.5-flash',
  geminiGuia: 'Detecta los momentos más importantes del video. Crea textos flotantes cortos, claros, llamativos y útiles para retener la atención.',
  geminiTemperatura: '0.35',
  geminiTimeoutMs: '60000'
});

function $(id) {
  return document.getElementById(id);
}

function leerStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (_error) {
    return { ...DEFAULTS };
  }
}

function guardarStorage(config) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function obtenerElementos() {
  return {
    modal: $('geminiModal'),
    openButton: $('openGeminiButton'),
    closeButton: $('closeGeminiModal'),
    saveButton: $('saveGeminiSettings'),
    usarGemini: $('useGemini'),
    usarFallbackGemini: $('useFallbackGemini'),
    credencial: $('geminiCredencial'),
    modelo: $('geminiModelo'),
    guia: $('geminiGuia'),
    temperatura: $('geminiTemperatura'),
    timeoutMs: $('geminiTimeoutMs'),
    resumen: $('geminiSettingsSummary')
  };
}

function actualizarResumen(elementos, config) {
  if (!elementos.resumen) return;
  const estado = config.usarGemini ? (config.geminiCredencial ? `Gemini activo · Modelo ${config.geminiModelo}` : 'Gemini activo, falta ingresar credencial') : 'Gemini desactivado · Se usará fallback local';
  elementos.resumen.textContent = estado;
}

function aplicarConfigEnFormulario(elementos, config) {
  if (elementos.usarGemini) elementos.usarGemini.checked = Boolean(config.usarGemini);
  if (elementos.usarFallbackGemini) elementos.usarFallbackGemini.checked = Boolean(config.usarFallbackGemini);
  if (elementos.credencial) elementos.credencial.value = config.geminiCredencial || '';
  if (elementos.modelo) elementos.modelo.value = config.geminiModelo || DEFAULTS.geminiModelo;
  if (elementos.guia) elementos.guia.value = config.geminiGuia || DEFAULTS.geminiGuia;
  if (elementos.temperatura) elementos.temperatura.value = config.geminiTemperatura || DEFAULTS.geminiTemperatura;
  if (elementos.timeoutMs) elementos.timeoutMs.value = config.geminiTimeoutMs || DEFAULTS.geminiTimeoutMs;
  actualizarResumen(elementos, config);
}

function leerConfigDesdeFormulario(elementos) {
  return {
    usarGemini: Boolean(elementos.usarGemini?.checked),
    usarFallbackGemini: Boolean(elementos.usarFallbackGemini?.checked),
    geminiCredencial: elementos.credencial?.value?.trim() || '',
    geminiModelo: elementos.modelo?.value?.trim() || DEFAULTS.geminiModelo,
    geminiGuia: elementos.guia?.value?.trim() || DEFAULTS.geminiGuia,
    geminiTemperatura: elementos.temperatura?.value?.trim() || DEFAULTS.geminiTemperatura,
    geminiTimeoutMs: elementos.timeoutMs?.value?.trim() || DEFAULTS.geminiTimeoutMs
  };
}

function abrirModal(elementos) {
  if (!elementos.modal) return;
  elementos.modal.hidden = false;
  elementos.credencial?.focus();
}

function cerrarModal(elementos) {
  if (!elementos.modal) return;
  elementos.modal.hidden = true;
}

export function obtenerConfiguracionGemini() {
  const elementos = obtenerElementos();
  if (elementos.modal) return leerConfigDesdeFormulario(elementos);
  return leerStorage();
}

export function bloquearControlesGemini(bloquear) {
  const elementos = obtenerElementos();
  [elementos.openButton, elementos.closeButton, elementos.saveButton, elementos.usarGemini, elementos.usarFallbackGemini, elementos.credencial, elementos.modelo, elementos.guia, elementos.temperatura, elementos.timeoutMs].forEach((elemento) => {
    if (elemento) elemento.disabled = bloquear;
  });
}

export function inicializarGeminiPopup() {
  const elementos = obtenerElementos();
  if (!elementos.modal || !elementos.openButton) return;
  aplicarConfigEnFormulario(elementos, leerStorage());
  elementos.openButton.addEventListener('click', () => {
    aplicarConfigEnFormulario(elementos, leerStorage());
    abrirModal(elementos);
  });
  elementos.closeButton?.addEventListener('click', () => cerrarModal(elementos));
  elementos.saveButton?.addEventListener('click', () => {
    const nuevoConfig = leerConfigDesdeFormulario(elementos);
    guardarStorage(nuevoConfig);
    actualizarResumen(elementos, nuevoConfig);
    cerrarModal(elementos);
  });
  elementos.modal.addEventListener('click', (evento) => {
    if (evento.target === elementos.modal) cerrarModal(elementos);
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !elementos.modal.hidden) cerrarModal(elementos);
  });
}

export default inicializarGeminiPopup;
