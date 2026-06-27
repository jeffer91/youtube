import { GEMINI_DEFAULTS, leerConfigGeminiLocal, guardarConfigGeminiLocal, describirEstadoGemini } from './gemini-config-storage.js';

const DEFAULTS = GEMINI_DEFAULTS;

function $(id) {
  return document.getElementById(id);
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
  elementos.resumen.textContent = describirEstadoGemini(config);
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
  return leerConfigGeminiLocal();
}

export function refrescarResumenGeminiPopup() {
  const elementos = obtenerElementos();
  const config = leerConfigGeminiLocal();
  aplicarConfigEnFormulario(elementos, config);
  return config;
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
  aplicarConfigEnFormulario(elementos, leerConfigGeminiLocal());
  elementos.openButton.addEventListener('click', () => {
    aplicarConfigEnFormulario(elementos, leerConfigGeminiLocal());
    abrirModal(elementos);
  });
  elementos.closeButton?.addEventListener('click', () => cerrarModal(elementos));
  elementos.saveButton?.addEventListener('click', () => {
    const nuevoConfig = guardarConfigGeminiLocal(leerConfigDesdeFormulario(elementos));
    aplicarConfigEnFormulario(elementos, nuevoConfig);
    cerrarModal(elementos);
    document.dispatchEvent(new CustomEvent('autovideo:gemini-config-actualizada', { detail: { estado: describirEstadoGemini(nuevoConfig) } }));
  });
  elementos.modal.addEventListener('click', (evento) => {
    if (evento.target === elementos.modal) cerrarModal(elementos);
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !elementos.modal.hidden) cerrarModal(elementos);
  });
  document.addEventListener('autovideo:gemini-config-actualizada', () => refrescarResumenGeminiPopup());
}

export default inicializarGeminiPopup;
