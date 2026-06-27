import { leerConfigGeminiLocal, guardarConfigGeminiLocal, limpiarClaveGeminiLocal, describirEstadoGemini, GEMINI_DEFAULTS } from './gemini-config-storage.js';

let crearUrlApiAjustes = null;
let probando = false;
let inicializado = false;

function $(id) {
  return document.getElementById(id);
}

async function crearUrlApiLocal(ruta) {
  const estadoElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof estadoElectron === 'function') {
    try {
      const estado = await estadoElectron();
      if (estado?.url) return `${estado.url}${ruta}`;
    } catch (_error) {}
  }
  return `${window.location.origin}${ruta}`;
}

function obtenerElementos() {
  return {
    card: $('ajustesGeminiCard'),
    usarGemini: $('ajustesUseGemini'),
    usarFallback: $('ajustesUseFallbackGemini'),
    clave: $('ajustesGeminiCredencial'),
    modelo: $('ajustesGeminiModelo'),
    guia: $('ajustesGeminiGuia'),
    temperatura: $('ajustesGeminiTemperatura'),
    timeout: $('ajustesGeminiTimeoutMs'),
    guardar: $('ajustesSaveGemini'),
    probar: $('ajustesTestGemini'),
    limpiar: $('ajustesClearGemini'),
    estado: $('ajustesGeminiEstado')
  };
}

function aplicarConfig(config = leerConfigGeminiLocal()) {
  const e = obtenerElementos();
  if (!e.card) return false;
  e.usarGemini.checked = Boolean(config.usarGemini);
  e.usarFallback.checked = config.usarFallbackGemini !== false;
  e.clave.value = config.geminiCredencial || '';
  e.modelo.value = config.geminiModelo || GEMINI_DEFAULTS.geminiModelo;
  e.guia.value = config.geminiGuia || GEMINI_DEFAULTS.geminiGuia;
  e.temperatura.value = config.geminiTemperatura || GEMINI_DEFAULTS.geminiTemperatura;
  e.timeout.value = config.geminiTimeoutMs || GEMINI_DEFAULTS.geminiTimeoutMs;
  e.estado.textContent = describirEstadoGemini(config);
  return true;
}

function leerFormulario() {
  const e = obtenerElementos();
  return {
    usarGemini: Boolean(e.usarGemini?.checked),
    usarFallbackGemini: Boolean(e.usarFallback?.checked),
    geminiCredencial: e.clave?.value?.trim() || '',
    geminiModelo: e.modelo?.value?.trim() || GEMINI_DEFAULTS.geminiModelo,
    geminiGuia: e.guia?.value?.trim() || GEMINI_DEFAULTS.geminiGuia,
    geminiTemperatura: e.temperatura?.value?.trim() || GEMINI_DEFAULTS.geminiTemperatura,
    geminiTimeoutMs: e.timeout?.value?.trim() || GEMINI_DEFAULTS.geminiTimeoutMs
  };
}

function escribirEstado(texto, tipo = 'normal') {
  const e = obtenerElementos();
  if (!e.estado) return;
  e.estado.textContent = texto;
  e.estado.dataset.estado = tipo;
}

async function leerRespuestaJsonSegura(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try { return JSON.parse(texto); } catch (_error) { return { ok: false, mensaje: texto }; }
}

async function probarConexionGemini() {
  if (probando) return;
  const e = obtenerElementos();
  const config = leerFormulario();
  if (!config.geminiCredencial) {
    escribirEstado('Pega la clave API antes de probar conexión.', 'error');
    return;
  }

  probando = true;
  if (e.probar) {
    e.probar.disabled = true;
    e.probar.textContent = 'Probando...';
  }
  escribirEstado('Probando conexión real con Gemini...', 'probando');

  try {
    const respuesta = await fetch(await crearUrlApiAjustes('/api/autovideo/gemini/probar'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, usarGemini: true })
    });
    const datos = await leerRespuestaJsonSegura(respuesta);
    if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'Gemini no respondió correctamente.');
    escribirEstado(datos.estado || 'Gemini conectado correctamente.', 'ok');
  } catch (error) {
    escribirEstado(`Error Gemini: ${error.message}`, 'error');
  } finally {
    probando = false;
    if (e.probar) {
      e.probar.disabled = false;
      e.probar.textContent = 'Probar conexión';
    }
  }
}

function guardarDesdeAjustes() {
  const config = guardarConfigGeminiLocal(leerFormulario());
  escribirEstado(`Guardado · ${describirEstadoGemini(config)}`, 'ok');
  document.dispatchEvent(new CustomEvent('autovideo:gemini-config-actualizada', { detail: { estado: describirEstadoGemini(config) } }));
}

function limpiarClave() {
  const config = limpiarClaveGeminiLocal();
  aplicarConfig(config);
  escribirEstado('Clave eliminada de esta computadora.', 'normal');
  document.dispatchEvent(new CustomEvent('autovideo:gemini-config-actualizada', { detail: { estado: describirEstadoGemini(config) } }));
}

function conectarEventos() {
  const e = obtenerElementos();
  e.guardar?.removeEventListener('click', guardarDesdeAjustes);
  e.probar?.removeEventListener('click', probarConexionGemini);
  e.limpiar?.removeEventListener('click', limpiarClave);
  e.guardar?.addEventListener('click', guardarDesdeAjustes);
  e.probar?.addEventListener('click', probarConexionGemini);
  e.limpiar?.addEventListener('click', limpiarClave);
  [e.usarGemini, e.usarFallback, e.modelo, e.temperatura, e.timeout].forEach((control) => {
    control?.addEventListener('change', () => escribirEstado(describirEstadoGemini(leerFormulario())));
  });
}

export function inicializarAjustesGeminiUI({ crearUrlApi = null } = {}) {
  if (inicializado) return;
  inicializado = true;
  crearUrlApiAjustes = crearUrlApi || crearUrlApiLocal;
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'ajustes') {
      setTimeout(() => {
        if (aplicarConfig()) conectarEventos();
      }, 0);
    }
  });
  if (aplicarConfig()) conectarEventos();
}

document.addEventListener('DOMContentLoaded', () => inicializarAjustesGeminiUI());
