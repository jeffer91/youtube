import { crearEventoProgreso, crearEventoError, crearEventoFinalizado } from '../progreso/progreso-eventos.js';
import { crearJobId, crearTrabajoProgreso, emitirEventoProgreso, crearResumenTrabajo } from '../progreso/progreso-registro.js';

function verificarCondicion(condicion, mensaje, errores) {
  if (!condicion) errores.push(mensaje);
}

export async function verificarProgresoReal() {
  const errores = [];
  const advertencias = [];
  const jobId = crearJobId();

  const eventoInicio = crearEventoProgreso({ jobId, etapa: 'inicio', porcentaje: 1, titulo: 'Prueba inicio', detalle: 'Evento de prueba.' });
  const eventoFallo = crearEventoError({ jobId, etapa: 'cortes', error: new Error('Error de prueba en cortes.') });
  const eventoFinal = crearEventoFinalizado({ jobId, detalle: 'Prueba finalizada.' });

  verificarCondicion(eventoInicio.tipo === 'progreso', 'El evento de progreso no tiene tipo progreso.', errores);
  verificarCondicion(eventoInicio.porcentaje === 1, 'El porcentaje de progreso no se conserva correctamente.', errores);
  verificarCondicion(eventoFallo.tipo === 'fallo', 'El evento de error debe emitirse como tipo fallo para no chocar con EventSource.onerror.', errores);
  verificarCondicion(eventoFallo.archivo === 'editar/edicion-dinamica/cortes/cortes.conexion.js', 'El evento de fallo en cortes no sugiere el archivo correcto.', errores);
  verificarCondicion(eventoFinal.tipo === 'finalizado', 'El evento finalizado no tiene tipo finalizado.', errores);
  verificarCondicion(eventoFinal.porcentaje === 100, 'El evento finalizado debe cerrar en 100%.', errores);

  const trabajo = crearTrabajoProgreso(jobId);
  emitirEventoProgreso(jobId, { etapa: 'diagnostico', porcentaje: 5, titulo: 'Prueba diagnóstico', detalle: 'Evento registrado.' });
  const resumen = crearResumenTrabajo(jobId);

  verificarCondicion(Boolean(trabajo), 'No se creó el trabajo de progreso.', errores);
  verificarCondicion(Boolean(resumen), 'No se pudo leer el resumen del trabajo de progreso.', errores);
  verificarCondicion((resumen?.eventos || []).length >= 2, 'El trabajo no guardó el historial de eventos.', errores);
  verificarCondicion(resumen?.eventos?.some((evento) => evento.etapa === 'diagnostico'), 'El historial no registró la etapa diagnóstico.', errores);

  return {
    ok: errores.length === 0,
    tipo: 'verificacion-progreso-real',
    jobId,
    resumen: {
      eventosRevisados: 4,
      eventosRegistrados: resumen?.eventos?.length || 0,
      falloUsaEventoSeparado: eventoFallo.tipo === 'fallo',
      finalizadoUsaEventoSeparado: eventoFinal.tipo === 'finalizado'
    },
    eventos: {
      inicio: eventoInicio,
      fallo: eventoFallo,
      finalizado: eventoFinal
    },
    errores,
    advertencias,
    mensaje: errores.length === 0 ? 'Progreso real verificado correctamente.' : `Progreso real con errores: ${errores.join(' ')}`,
    creadoEn: new Date().toISOString()
  };
}

export default verificarProgresoReal;
