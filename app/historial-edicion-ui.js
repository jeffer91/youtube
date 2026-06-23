function formatearHora(fechaIso) {
  try {
    return new Date(fechaIso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (_error) {
    return '';
  }
}

export function limpiarHistorialEdicion(elemento) {
  if (!elemento) return;
  elemento.innerHTML = '';
}

export function agregarEventoHistorial(elemento, evento = {}) {
  if (!elemento) return;

  const item = document.createElement('li');
  item.className = `progress-history__item progress-history__item--${evento.estado || evento.tipo || 'progreso'}`;

  const marca = document.createElement('span');
  marca.className = 'progress-history__mark';
  marca.textContent = evento.tipo === 'error' ? '!' : evento.estado === 'finalizado' ? '✓' : '•';

  const contenido = document.createElement('div');
  contenido.className = 'progress-history__content';

  const titulo = document.createElement('strong');
  titulo.textContent = evento.titulo || evento.etapa || 'Procesando';

  const detalle = document.createElement('small');
  detalle.textContent = [evento.detalle, evento.archivo ? `Archivo: ${evento.archivo}` : null, formatearHora(evento.fecha)].filter(Boolean).join(' · ');

  contenido.append(titulo, detalle);
  item.append(marca, contenido);
  elemento.prepend(item);
}

export default { limpiarHistorialEdicion, agregarEventoHistorial };
