const EXTENSIONES_VIDEO = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm']);

function obtenerExtension(nombre = '') {
  const ultimoPunto = nombre.lastIndexOf('.');
  return ultimoPunto >= 0 ? nombre.slice(ultimoPunto).toLowerCase() : '';
}

export function validarVideoSeleccionado(archivo) {
  if (!archivo) throw new Error('Selecciona un video antes de procesar.');
  const extension = obtenerExtension(archivo.name || '');
  const tipo = archivo.type || '';
  if (!tipo.startsWith('video/') && !EXTENSIONES_VIDEO.has(extension)) throw new Error('El archivo seleccionado no parece ser un video válido.');
  const limiteBytes = 2 * 1024 * 1024 * 1024;
  if (archivo.size > limiteBytes) throw new Error('El video supera el límite de 2 GB.');
  return true;
}

export default validarVideoSeleccionado;
