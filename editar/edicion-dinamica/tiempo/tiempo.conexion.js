import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../../comun/archivos.js';
import { crearMapaTiempoDesdeSegmentos } from './crear-mapa-tiempo.js';

function crearRespuestaSinMapa({ mensaje, carpetaTiempo }) {
  return { ok: true, omitido: true, etapa: 'edicion-dinamica-tiempo', mensaje, mapaTiempo: null, transcripcionAjustada: null, carpetaTiempo, creadoEn: new Date().toISOString() };
}

export async function procesarTiempoDinamico({ entrada, entendimiento, transcripcion = null, cortes = null, config, carpetaEdicionDinamica, opciones = {} } = {}) {
  const carpetaTiempo = path.join(carpetaEdicionDinamica, 'tiempo');
  asegurarCarpeta(carpetaTiempo);

  if (!cortes || cortes.omitido || !cortes.planCortes?.segmentosConservados?.length) {
    return crearRespuestaSinMapa({ mensaje: 'No se creó mapa de tiempo porque no se aplicaron cortes.', carpetaTiempo });
  }

  const plan = cortes.planCortes;
  const mapaTiempo = crearMapaTiempoDesdeSegmentos({ segmentosConservados: plan.segmentosConservados, duracionOriginal: plan.duracionOriginal || entendimiento?.analisis?.duracionSegundos || null, duracionEditada: plan.duracionEditada || null, cortes: plan.cortes || [] });

  const resultado = { ok: true, omitido: false, etapa: 'edicion-dinamica-tiempo', mensaje: 'Mapa de tiempo creado correctamente.', mapaTiempo, transcripcionAjustada: null, pendienteAjusteTranscripcion: Boolean(transcripcion), config: { intensidad: config?.intensidad || null }, opciones: { ajustarSubtitulos: true, ajustarTextosFlotantes: true, ajustarMomentosImportantes: true, ...opciones }, carpetaTiempo, proyectoId: entrada?.proyecto?.id || null, creadoEn: new Date().toISOString() };

  await escribirJson(path.join(carpetaTiempo, 'mapa-tiempo.json'), mapaTiempo);
  await escribirJson(path.join(carpetaTiempo, 'resultado-tiempo.json'), resultado);

  return resultado;
}

export default procesarTiempoDinamico;
