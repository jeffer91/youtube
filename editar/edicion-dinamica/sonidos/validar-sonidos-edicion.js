import fs from 'fs';

export function validarSonidosEdicion({ rutaVideoBase, eventos = [], sonidosBase = null } = {}) {
  const errores = [];
  const advertencias = [];

  if (!rutaVideoBase || typeof rutaVideoBase !== 'string') {
    errores.push('Falta ruta del video base para mezclar sonidos.');
  } else if (!fs.existsSync(rutaVideoBase)) {
    errores.push(`No existe el video base para sonidos: ${rutaVideoBase}`);
  }

  if (!Array.isArray(eventos) || eventos.length === 0) {
    advertencias.push('No hay eventos de sonido para mezclar.');
  }

  for (const evento of eventos || []) {
    if (!Number.isFinite(Number(evento.tiempo)) || Number(evento.tiempo) < 0) {
      errores.push(`Evento de sonido con tiempo inválido: ${evento.id || 'sin-id'}`);
    }

    if (!evento.sonido) {
      errores.push(`Evento de sonido sin tipo de sonido: ${evento.id || 'sin-id'}`);
    }

    const rutaSonido = sonidosBase?.sonidos?.[evento.sonido]?.ruta;

    if (!rutaSonido || !fs.existsSync(rutaSonido)) {
      errores.push(`No existe archivo de sonido para ${evento.sonido}.`);
    }
  }

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
    mensaje: errores.length === 0 ? 'Sonidos de edición válidos.' : `Sonidos de edición inválidos: ${errores.join(', ')}`
  };
}

export default validarSonidosEdicion;
