import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../comun/archivos.js';
import { reportarModulo } from '../../progreso/progreso-modulo.js';
import { obtenerConfigEdicionDinamica } from './edicion-dinamica.config.js';
import { procesarCortesDinamicos } from './cortes/cortes.conexion.js';
import { procesarTiempoDinamico } from './tiempo/tiempo.conexion.js';
import { crearReporteEdicionDinamica } from './reportes/crear-reporte-edicion-dinamica.js';
import { crearDiagnosticoEdicionDinamica } from './diagnostico/diagnostico-edicion-dinamica.service.js';

function crearRespuestaOmitida({ motivo, config, entrada, error = null }) {
  return {
    ok: true,
    omitido: true,
    etapa: 'edicion-dinamica',
    activo: false,
    motivo,
    config: {
      intensidad: config?.intensidad || null,
      modoSeguro: Boolean(config?.modoSeguro)
    },
    videoDinamico: null,
    audioDinamico: null,
    transcripcionAjustada: null,
    mapaTiempo: null,
    cortes: null,
    tiempo: null,
    visual: null,
    sonidos: null,
    reportes: [],
    diagnostico: {
      ok: true,
      bloqueante: false,
      mensaje: motivo
    },
    errorControlado: error
      ? {
          modulo: 'edicion-dinamica',
          mensaje: error.message || String(error),
          archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js'
        }
      : null,
    proyectoId: entrada?.proyecto?.id || null,
    creadoEn: new Date().toISOString()
  };
}

function obtenerCarpetaEdicionDinamica(entrada) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede procesar edición dinámica sin carpeta del proyecto.');
  const carpeta = path.join(carpetaProyecto, 'edicion-dinamica');
  asegurarCarpeta(carpeta);
  return carpeta;
}

export async function procesarEdicionDinamica({ entrada, entendimiento, audio = null, transcripcion = null, opciones = {}, progreso = null } = {}) {
  const config = obtenerConfigEdicionDinamica(opciones);

  try {
    if (!config.activo) {
      await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 56, titulo: 'Edición dinámica omitida', detalle: 'La edición dinámica está desactivada.', archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js' });
      return crearRespuestaOmitida({ motivo: 'La edición dinámica está desactivada.', config, entrada });
    }

    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 55, titulo: 'Iniciando edición dinámica', detalle: `Modo ${config.intensidad}: cortes, mapa de tiempo y ajuste de textos.`, archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js' });

    const carpetaEdicionDinamica = obtenerCarpetaEdicionDinamica(entrada);
    const cortes = await procesarCortesDinamicos({ entrada, entendimiento, audio, config, carpetaEdicionDinamica, opciones, progreso });
    const tiempo = await procesarTiempoDinamico({ entrada, entendimiento, transcripcion, cortes, config, carpetaEdicionDinamica, opciones, progreso });

    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 75, titulo: 'Guardando reporte dinámico', detalle: 'Creando reporte y diagnóstico de edición dinámica.', archivo: 'editar/edicion-dinamica/reportes/crear-reporte-edicion-dinamica.js' });
    const reporte = await crearReporteEdicionDinamica({ carpetaEdicionDinamica, cortes, tiempo, config, opciones });
    const diagnostico = await crearDiagnosticoEdicionDinamica({ carpetaEdicionDinamica, cortes, tiempo, config });

    const resultado = {
      ok: true,
      omitido: false,
      etapa: 'edicion-dinamica',
      activo: true,
      proyectoId: entrada?.proyecto?.id || null,
      carpetaEdicionDinamica,
      videoDinamico: cortes?.videoDinamico || null,
      audioDinamico: cortes?.audioDinamico || null,
      transcripcionAjustada: tiempo?.transcripcionAjustada || null,
      mapaTiempo: tiempo?.mapaTiempo || null,
      cortes,
      tiempo,
      visual: { ok: true, pendiente: true, mensaje: 'Los efectos visuales dinámicos se conectan en el siguiente bloque.' },
      sonidos: { ok: true, pendiente: true, mensaje: 'Los efectos de sonido se conectan en el bloque de sonidos.' },
      reportes: { edicionDinamica: reporte },
      diagnostico,
      errorControlado: null,
      creadoEn: new Date().toISOString()
    };

    const rutaResumen = path.join(carpetaEdicionDinamica, 'edicion-dinamica.json');
    await escribirJson(rutaResumen, resultado);

    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 76, titulo: 'Edición dinámica lista', detalle: `${cortes?.resumen?.cantidadCortesAplicados || 0} cortes · mapa de tiempo: ${tiempo?.mapaTiempo ? 'sí' : 'no'}.`, datos: { cortes: cortes?.resumen || null, mapaTiempo: Boolean(tiempo?.mapaTiempo) }, archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js' });

    return { ...resultado, rutaResumen };
  } catch (error) {
    console.warn('[edicion-dinamica] Módulo omitido por error controlado:', error.message);
    await reportarModulo(progreso, { etapa: 'edicion-dinamica', porcentaje: 76, titulo: 'Edición dinámica omitida', detalle: 'La edición continuará sin cortes dinámicos.', archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js' });
    return crearRespuestaOmitida({
      motivo: 'No se pudo aplicar edición dinámica. La edición continuará sin cortes dinámicos.',
      config,
      entrada,
      error
    });
  }
}

export default procesarEdicionDinamica;
