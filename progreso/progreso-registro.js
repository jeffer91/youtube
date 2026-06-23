import { crearEventoProgreso, crearEventoError, crearEventoFinalizado } from './progreso-eventos.js';

const trabajos = new Map();
const TIEMPO_LIMPIEZA_MS = 60 * 60 * 1000;

export function crearJobId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function obtenerTrabajoProgreso(jobId) {
  return trabajos.get(jobId) || null;
}

export function crearTrabajoProgreso(jobId = crearJobId()) {
  const existente = trabajos.get(jobId);
  if (existente) return existente;

  const trabajo = {
    jobId,
    estado: 'esperando',
    eventos: [],
    clientes: new Set(),
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    temporizadorLimpieza: null
  };

  trabajos.set(jobId, trabajo);
  emitirEventoProgreso(jobId, { etapa: 'inicio', porcentaje: 0, titulo: 'Esperando video', detalle: 'Trabajo de edición creado.', estado: 'esperando' });
  return trabajo;
}

function escribirSse(res, evento) {
  try {
    res.write(`event: ${evento.tipo || 'progreso'}\n`);
    res.write(`data: ${JSON.stringify(evento)}\n\n`);
  } catch (_error) {
    // El cliente probablemente cerró la conexión.
  }
}

export function emitirEventoProgreso(jobId, payload = {}) {
  const trabajo = crearTrabajoProgreso(jobId);
  const evento = crearEventoProgreso({ jobId, ...payload });
  trabajo.estado = evento.estado || trabajo.estado;
  trabajo.eventos.push(evento);
  trabajo.actualizadoEn = new Date().toISOString();
  for (const cliente of trabajo.clientes) escribirSse(cliente, evento);
  return evento;
}

export function emitirErrorProgreso(jobId, { error, etapa = null, detalle = null, archivo = null, datos = {} } = {}) {
  const trabajo = crearTrabajoProgreso(jobId);
  const evento = crearEventoError({ jobId, etapa, error, detalle, archivo, datos });
  trabajo.estado = 'error';
  trabajo.eventos.push(evento);
  trabajo.actualizadoEn = new Date().toISOString();
  for (const cliente of trabajo.clientes) escribirSse(cliente, evento);
  programarLimpiezaTrabajo(jobId);
  return evento;
}

export function finalizarTrabajoProgreso(jobId, { detalle = 'Video listo.', datos = {} } = {}) {
  const trabajo = crearTrabajoProgreso(jobId);
  const evento = crearEventoFinalizado({ jobId, detalle, datos });
  trabajo.estado = 'finalizado';
  trabajo.eventos.push(evento);
  trabajo.actualizadoEn = new Date().toISOString();
  for (const cliente of trabajo.clientes) escribirSse(cliente, evento);
  programarLimpiezaTrabajo(jobId);
  return evento;
}

export function suscribirClienteProgreso(jobId, res) {
  const trabajo = crearTrabajoProgreso(jobId);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(': conectado\n\n');

  trabajo.clientes.add(res);
  for (const evento of trabajo.eventos) escribirSse(res, evento);

  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_error) { clearInterval(ping); }
  }, 15000);

  res.on('close', () => {
    clearInterval(ping);
    trabajo.clientes.delete(res);
  });
}

function programarLimpiezaTrabajo(jobId) {
  const trabajo = trabajos.get(jobId);
  if (!trabajo || trabajo.temporizadorLimpieza) return;
  trabajo.temporizadorLimpieza = setTimeout(() => {
    const actual = trabajos.get(jobId);
    if (!actual) return;
    for (const cliente of actual.clientes) {
      try { cliente.end(); } catch (_error) {}
    }
    trabajos.delete(jobId);
  }, TIEMPO_LIMPIEZA_MS);
}

export function crearResumenTrabajo(jobId) {
  const trabajo = trabajos.get(jobId);
  if (!trabajo) return null;
  return {
    jobId,
    estado: trabajo.estado,
    eventos: trabajo.eventos,
    creadoEn: trabajo.creadoEn,
    actualizadoEn: trabajo.actualizadoEn
  };
}

export default { crearJobId, crearTrabajoProgreso, emitirEventoProgreso, emitirErrorProgreso, finalizarTrabajoProgreso, suscribirClienteProgreso, crearResumenTrabajo };
