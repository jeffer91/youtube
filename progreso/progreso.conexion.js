import { emitirEventoProgreso, emitirErrorProgreso, finalizarTrabajoProgreso } from './progreso-registro.js';

export function crearReporteroProgreso(jobId) {
  return async function reportarProgreso(evento = {}) {
    return emitirEventoProgreso(jobId, evento);
  };
}

export function reportarErrorProgreso(jobId, error, extras = {}) {
  return emitirErrorProgreso(jobId, { error, ...extras });
}

export function reportarFinalizadoProgreso(jobId, datos = {}) {
  return finalizarTrabajoProgreso(jobId, datos);
}

export default { crearReporteroProgreso, reportarErrorProgreso, reportarFinalizadoProgreso };
