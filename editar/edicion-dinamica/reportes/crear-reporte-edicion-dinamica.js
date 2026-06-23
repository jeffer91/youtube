import path from 'path';
import { escribirJson } from '../../../comun/archivos.js';

export async function crearReporteEdicionDinamica({ carpetaEdicionDinamica, cortes = null, tiempo = null, config = null, opciones = {} } = {}) {
  const reporte = {
    ok: true,
    tipo: 'reporte-edicion-dinamica',
    version: '1.0.0',
    resumen: {
      activo: Boolean(config?.activo),
      intensidad: config?.intensidad || null,
      cortesAplicados: cortes?.resumen?.cantidadCortesAplicados || 0,
      silenciosDetectados: cortes?.resumen?.cantidadSilenciosDetectados || 0,
      segundosEliminados: cortes?.resumen?.segundosEliminados || 0,
      duracionOriginal: cortes?.resumen?.duracionOriginal || tiempo?.mapaTiempo?.duracionOriginal || null,
      duracionEditada: cortes?.resumen?.duracionEditada || tiempo?.mapaTiempo?.duracionEditada || null,
      tieneMapaTiempo: Boolean(tiempo?.mapaTiempo),
      transcripcionAjustada: Boolean(tiempo?.transcripcionAjustada),
      subtitulosAjustados: Boolean(tiempo?.subtitulosAjustados && !tiempo.subtitulosAjustados.omitido),
      textosFlotantesAjustados: Boolean(tiempo?.textosFlotantesAjustados && !tiempo.textosFlotantesAjustados.omitido)
    },
    cortes: cortes?.resumen || null,
    tiempo: {
      bloquesMapa: tiempo?.mapaTiempo?.bloques?.length || 0,
      pendienteAjusteTranscripcion: Boolean(tiempo?.pendienteAjusteTranscripcion),
      descartesTranscripcion: tiempo?.ajusteTranscripcion?.descartados || 0,
      descartesTextosFlotantes: tiempo?.textosFlotantesAjustados?.descartados || 0,
      descartesMomentos: tiempo?.momentosImportantesAjustados?.descartados || 0
    },
    opciones: {
      modoSeguro: config?.modoSeguro ?? true,
      plataforma: opciones?.plataforma || null,
      modo: opciones?.modo || null
    },
    creadoEn: new Date().toISOString()
  };

  if (carpetaEdicionDinamica) {
    const rutaReporte = path.join(carpetaEdicionDinamica, 'reporte-edicion-dinamica.json');
    await escribirJson(rutaReporte, reporte);
    return { ...reporte, rutaReporte };
  }

  return reporte;
}

export default crearReporteEdicionDinamica;
