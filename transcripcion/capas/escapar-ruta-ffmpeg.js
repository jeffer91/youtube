import path from 'path';

export function normalizarRutaParaFfmpeg(rutaArchivo) {
  if (!rutaArchivo || typeof rutaArchivo !== 'string') return '';
  return path.resolve(rutaArchivo).replace(/\\/g, '/').replace(/:/g, '\\:');
}

export function envolverRutaFiltro(rutaArchivo) {
  const normalizada = normalizarRutaParaFfmpeg(rutaArchivo);
  return normalizada ? `'${normalizada}'` : '';
}

export default normalizarRutaParaFfmpeg;
