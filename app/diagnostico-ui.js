export function obtenerResumenDiagnostico(datos = {}) {
  const diagnostico = datos.diagnostico || datos.resultado?.diagnostico || null;

  if (!diagnostico) {
    return 'Diagnóstico: no recibido.';
  }

  if (diagnostico.bloqueante) {
    return `Diagnóstico: requiere atención. ${diagnostico.errores?.[0] || diagnostico.mensaje || ''}`.trim();
  }

  if (diagnostico.ok) {
    return 'Diagnóstico: FFmpeg, carpetas y módulos listos.';
  }

  return `Diagnóstico: modo seguro activo. ${diagnostico.advertencias?.[0] || diagnostico.mensaje || ''}`.trim();
}

export function actualizarEstadoDiagnosticoEnServidor(elemento, datos = {}) {
  if (!elemento || !datos?.diagnostico) return;
  const diagnostico = datos.diagnostico;
  if (diagnostico.bloqueante) {
    elemento.textContent = 'Servidor con diagnóstico pendiente';
    elemento.className = 'server-status server-status--error';
    return;
  }
  elemento.textContent = diagnostico.ok ? 'Servidor listo' : 'Servidor en modo seguro';
  elemento.className = diagnostico.ok ? 'server-status server-status--ok' : 'server-status server-status--checking';
}

export default { obtenerResumenDiagnostico, actualizarEstadoDiagnosticoEnServidor };
