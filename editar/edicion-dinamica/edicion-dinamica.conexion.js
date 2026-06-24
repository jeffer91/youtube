import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../comun/archivos.js';
import { reportarModulo } from '../../progreso/progreso-modulo.js';
import { obtenerConfigEdicionDinamica } from './edicion-dinamica.config.js';
import { procesarCortesDinamicos } from './cortes/cortes.conexion.js';
import { procesarTiempoDinamico } from './tiempo/tiempo.conexion.js';
import { crearReporteEdicionDinamica } from './reportes/crear-reporte-edicion-dinamica.js';
import { crearDiagnosticoEdicionDinamica } from './diagnostico/diagnostico-edicion-dinamica.service.js';

function crearRespuestaOmitida({ motivo, config, entrada }) {
  return {
    ok: true,
    omitido: true,
    etapa: 'edicion-dinamica',
    activo: false,
    motivo,
    config: {
      intensidad: config?.intensidad || null,
      modoSeguro: Boolean(config?.modoSeguro),
      cortes: Boolean(config?.cortes?.activo),
      visual: Boolean(config?.visual?.activo),
      sonidos: Boolean(config?.sonidos?.activo)
    },
    videoDinamico: null,
    audioDinamico: null,
    transcripcionAjustada: null,
    mapaTiempo: null,
    cortes: null,
    visual: { ok: true, omitido: true, mensaje: 'Visuales dinámicos omitidos porque cortes automáticos está desmarcado.' },
    sonidos: { ok: true, omitido: true, mensaje: 'Sonidos automáticos omitidos porque cortes automáticos está desmarcado.' },
    reportes: [],
    diagnostico: { ok: true, mensaje: motivo },
    proyectoId: entrada?.proyecto?.id || null,
    creadoEn: new Date().toISOString()
  };
}

function crearEstadoVisualDesdeConfig(config) {
  if (!config?.visual?.activo) {
    return {
      ok: true,
      omitido: true,
      mensaje: 'Visuales dinámicos omitidos por selección del usuario.',
      zooms: Boolean(config?.visual?.agregarZooms),
      barraProgreso: Boolean(config?.visual?.agregarBarraProgreso),
      etiquetasVisuales: Boolean(config?.visual?.agregarEtiquetasVisuales)
    };
  }

  return {
    ok: true,
    pendiente: true,
    mensaje: 'Los efectos visuales dinámicos se conectan en el módulo de edición final.',
    zooms: Boolean(config?.visual?.agregarZooms),
    barraProgreso: Boolean(config?.visual?.agregarBarraProgreso),
    etiquetasVisuales: Boolean(config?.visual?.agregarEtiquetasVisuales)
  };
}

function crearEstadoSonidosDesdeConfig(config) {
  if (!config?.sonidos?.activo) {
    return { ok: true, omitido: true, mensaje: 'Sonidos automáticos omitidos por selección del usuario.' };
  }

  return { ok: true, pendiente: true, mensaje: 'Los efectos de sonido se conectan en el módulo de edición final.' };
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

  if (!config.activo || !config.cortes?.activo) {
    const motivo = !config.activo ? 'La edición dinámica está desactivada.' : 'Cortes automáticos desactivados por selección del usuario.';

    await reportarModulo(progreso, {
      etapa: 'edicion-dinamica',
      porcentaje: 56,
      titulo: 'Edición dinámica omitida',
      detalle: motivo,
      archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js'
    });

    return crearRespuestaOmitida({ motivo, config, entrada });
  }

  await reportarModulo(progreso, {
    etapa: 'edicion-dinamica',
    porcentaje: 55,
    titulo: 'Iniciando edición dinámica',
    detalle: `Modo ${config.intensidad}: cortes, mapa de tiempo y ajuste de textos.`,
    archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js'
  });

  const carpetaEdicionDinamica = obtenerCarpetaEdicionDinamica(entrada);
  const cortes = await procesarCortesDinamicos({ entrada, entendimiento, audio, config, carpetaEdicionDinamica, opciones, progreso });
  const tiempo = await procesarTiempoDinamico({ entrada, entendimiento, transcripcion, cortes, config, carpetaEdicionDinamica, opciones, progreso });

  await reportarModulo(progreso, {
    etapa: 'edicion-dinamica',
    porcentaje: 75,
    titulo: 'Guardando reporte dinámico',
    detalle: 'Creando reporte y diagnóstico de edición dinámica.',
    archivo: 'editar/edicion-dinamica/reportes/crear-reporte-edicion-dinamica.js'
  });

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
    visual: crearEstadoVisualDesdeConfig(config),
    sonidos: crearEstadoSonidosDesdeConfig(config),
    reportes: { edicionDinamica: reporte },
    diagnostico,
    configSeleccionada: {
      cortes: Boolean(config.cortes?.activo),
      zooms: Boolean(config.visual?.agregarZooms),
      barraProgreso: Boolean(config.visual?.agregarBarraProgreso),
      etiquetasVisuales: Boolean(config.visual?.agregarEtiquetasVisuales),
      sonidos: Boolean(config.sonidos?.activo)
    },
    creadoEn: new Date().toISOString()
  };

  const rutaResumen = path.join(carpetaEdicionDinamica, 'edicion-dinamica.json');
  await escribirJson(rutaResumen, resultado);

  await reportarModulo(progreso, {
    etapa: 'edicion-dinamica',
    porcentaje: 76,
    titulo: 'Edición dinámica lista',
    detalle: diagnostico?.mensaje || 'Cortes y tiempos dinámicos preparados correctamente.',
    datos: {
      cortes: cortes?.resumen?.cantidadCortesAplicados || 0,
      segundosEliminados: cortes?.resumen?.segundosEliminados || 0,
      visual: !resultado.visual?.omitido,
      sonidos: !resultado.sonidos?.omitido
    },
    archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js'
  });

  return { ...resultado, rutaResumen };
}

export default { procesarEdicionDinamica };
