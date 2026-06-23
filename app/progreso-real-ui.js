import { agregarEventoHistorial, limpiarHistorialEdicion } from './historial-edicion-ui.js';

export function crearJobIdFrontend() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function obtenerElementosProgreso() {
  return {
    area: document.getElementById('progressArea'),
    title: document.getElementById('progressTitle'),
    text: document.getElementById('progressText'),
    percent: document.getElementById('progressPercent'),
    bar: document.getElementById('progressBar'),
    history: document.getElementById('progressHistory')
  };
}

export function prepararProgresoReal() {
  const elementos = obtenerElementosProgreso();
  if (elementos.area) elementos.area.hidden = false;
  if (elementos.title) elementos.title.textContent = 'Preparando edición automática';
  if (elementos.text) elementos.text.textContent = 'Creando trabajo de edición.';
  if (elementos.percent) elementos.percent.textContent = '0%';
  if (elementos.bar) elementos.bar.style.width = '0%';
  limpiarHistorialEdicion(elementos.history);
}

export function actualizarProgresoReal(evento = {}) {
  const elementos = obtenerElementosProgreso();
  const porcentaje = Math.max(0, Math.min(100, Number(evento.porcentaje || 0)));
  if (elementos.area) elementos.area.hidden = false;
  if (elementos.title) elementos.title.textContent = evento.titulo || evento.etapa || 'Procesando';
  if (elementos.text) elementos.text.textContent = evento.detalle || 'Procesando video.';
  if (elementos.percent) elementos.percent.textContent = `${Math.round(porcentaje)}%`;
  if (elementos.bar) elementos.bar.style.width = `${porcentaje}%`;
  agregarEventoHistorial(elementos.history, evento);
}

export function conectarProgresoReal({ url, onEvento, onError, onFinalizado } = {}) {
  if (!url || typeof EventSource === 'undefined') {
    return { cerrar() {} };
  }

  const source = new EventSource(url);

  source.addEventListener('progreso', (mensaje) => {
    const evento = JSON.parse(mensaje.data);
    actualizarProgresoReal(evento);
    if (typeof onEvento === 'function') onEvento(evento);
  });

  source.addEventListener('fallo', (mensaje) => {
    const evento = JSON.parse(mensaje.data);
    actualizarProgresoReal(evento);
    if (typeof onError === 'function') onError(evento);
    source.close();
  });

  source.addEventListener('finalizado', (mensaje) => {
    const evento = JSON.parse(mensaje.data);
    actualizarProgresoReal(evento);
    if (typeof onFinalizado === 'function') onFinalizado(evento);
    source.close();
  });

  source.onerror = () => {
    if (source.readyState === EventSource.CLOSED) source.close();
  };

  return {
    cerrar() {
      source.close();
    }
  };
}

export default { crearJobIdFrontend, prepararProgresoReal, actualizarProgresoReal, conectarProgresoReal };
