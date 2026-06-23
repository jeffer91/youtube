import path from 'path';
import { escribirJson } from '../../../comun/archivos.js';

export async function crearReporteSonidosEdicion({ carpetaSonidos, sonidos = null } = {}) {
  const reporte = {
    ok: true,
    tipo: 'reporte-sonidos-edicion',
    resumen: {
      aplicado: Boolean(sonidos && !sonidos.omitido),
      audioConSonidos: sonidos?.audioConSonidos || null,
      eventosSonido: sonidos?.eventosSonido?.length || 0,
      eventosDescartados: sonidos?.eventosDescartados || 0,
      volumen: sonidos?.config?.volumen || null,
      modo: sonidos?.config?.modo || null
    },
    mensaje: sonidos?.mensaje || 'Sin resultado de sonidos.',
    creadoEn: new Date().toISOString()
  };

  if (carpetaSonidos) {
    const rutaReporte = path.join(carpetaSonidos, 'reporte-sonidos.json');
    await escribirJson(rutaReporte, reporte);
    return { ...reporte, rutaReporte };
  }

  return reporte;
}

export default crearReporteSonidosEdicion;
