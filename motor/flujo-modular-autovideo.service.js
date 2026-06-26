/*
  Bloques 8, 9 y 18
  Funcion: conectar los modulos nuevos al resultado del flujo actual sin romper el render existente.
*/

import { obtenerPerfil } from '../perfiles/perfiles.conexion.js';
import { prepararExportaciones, crearResultadoPlataformas } from '../exportacion/exportacion.conexion.js';
import { crearPlanAudio } from '../audio/audio.conexion.js';
import { crearSubtitulosMultiplataforma } from '../subtitulos/subtitulos.conexion.js';
import { detectarTextosRelevantes, generarTextosPantalla } from '../textos/textos.conexion.js';
import {
  detectarSujeto,
  detectarRostro,
  detectarZonasSeguras,
  crearPlanRemoverFondo,
  crearPlanFondo,
  crearPlanZoom,
  crearPlanAnimaciones,
  crearPlanEfectos,
  crearPlanEncuadreDinamico
} from '../visual/visual.conexion.js';
import { crearPaqueteGeminiEdicion, crearAnalisisTranscripcionFallback, ejecutarPaqueteGeminiEdicion } from '../gemini/gemini.conexion.js';
import { crearPlanProduccion } from '../produccion/produccion.conexion.js';
import { obtenerReglasAplicables } from '../aprendizaje/aprendizaje.conexion.js';

function extraerSegmentos(transcripcion = {}) {
  return transcripcion.transcripcion?.segmentos || transcripcion.segmentos || transcripcion.transcripcion?.segments || transcripcion.segments || [];
}

function normalizarPlataformas(opciones = {}) {
  if (Array.isArray(opciones.plataformas) && opciones.plataformas.length) return opciones.plataformas;
  if (typeof opciones.plataformas === 'string' && opciones.plataformas.trim()) return opciones.plataformas.split(',').map((item) => item.trim()).filter(Boolean);
  if (opciones.plataforma) return [opciones.plataforma];
  return ['tiktok', 'reels', 'shorts', 'youtube'];
}

function crearProyectoModular({ entrada = {}, opciones = {} } = {}) {
  const proyectoBase = entrada.proyecto || {};
  const perfil = opciones.perfil || proyectoBase.perfil || 'general';
  const plataformas = normalizarPlataformas(opciones);
  return {
    id: proyectoBase.id || opciones.proyectoId || `proyecto-${Date.now()}`,
    nombre: proyectoBase.nombre || opciones.nombreProyecto || 'Proyecto AutoVideoJeff',
    perfil,
    modoEdicion: opciones.modoEdicion || opciones.modoRevision || 'revision_completa',
    plataformas,
    rutas: proyectoBase.rutas || {}
  };
}

function crearMomentosDesdeSegmentos(segmentos = []) {
  return segmentos.slice(0, 10).map((segmento, indice) => ({
    id: segmento.id || `momento-${indice + 1}`,
    inicio: Number(segmento.inicio ?? segmento.start ?? indice * 4),
    fin: Number(segmento.fin ?? segmento.end ?? indice * 4 + 3),
    texto: String(segmento.texto ?? segmento.text ?? '').trim(),
    prioridad: indice < 3 ? 'alta' : 'media'
  })).filter((momento) => momento.texto);
}

function obtenerMomentosGemini(gemini = {}, fallback = []) {
  const data = gemini.resultados?.analisis?.data || {};
  return Array.isArray(data.momentosImportantes) && data.momentosImportantes.length ? data.momentosImportantes : fallback;
}

export async function crearIntegracionModularAutoVideoJeff({ entrada = {}, entendimiento = {}, audio = {}, transcripcion = {}, edicionDinamica = {}, edicion = {}, salida = {}, opciones = {} } = {}) {
  const proyecto = crearProyectoModular({ entrada, opciones });
  const perfil = obtenerPerfil(proyecto.perfil);
  const plataformas = proyecto.plataformas;
  const segmentos = extraerSegmentos(transcripcion);
  const momentosFallback = crearMomentosDesdeSegmentos(segmentos);
  const plataformaBase = { formato: salida.formato || '9:16', width: 1080, height: 1920, zonaSegura: { top: 170, bottom: 280, left: 80, right: 80 } };

  const exportaciones = prepararExportaciones({ ...proyecto, videoEditado: salida.rutaExportada || salida.rutaVideo || '', rutas: proyecto.rutas });
  const resultadoPlataformas = crearResultadoPlataformas({ salida, exportaciones, plataformas });
  const planAudio = crearPlanAudio({ analisisAudio: entendimiento.analisis?.audio || {} }, { usarMusicaBaja: true });
  const sujeto = detectarSujeto({ video: { width: plataformaBase.width, height: plataformaBase.height } });
  const rostro = detectarRostro({}, sujeto);
  const zonasSeguras = detectarZonasSeguras({ plataforma: plataformaBase, sujeto, rostro });
  const removerFondo = crearPlanRemoverFondo({ perfil: perfil.id, sujeto, opciones });
  const fondo = crearPlanFondo({ perfil: perfil.id, removerFondo });

  const subtitulosPorPlataforma = crearSubtitulosMultiplataforma({ plataformas, segmentos, sujeto, perfil: perfil.id });
  const textosDetectados = detectarTextosRelevantes({ segmentos, perfil: perfil.id });
  const textosPantalla = generarTextosPantalla({ textos: textosDetectados.textos, perfil: perfil.id, plataforma: plataformas[0] || 'tiktok' });

  const analisisGeminiFallback = crearAnalisisTranscripcionFallback({ transcripcion: { segmentos }, perfil: perfil.id });
  const paqueteGemini = crearPaqueteGeminiEdicion({ proyecto, perfil, transcripcion: { segmentos }, analisis: analisisGeminiFallback, plataformas, opciones });
  const gemini = await ejecutarPaqueteGeminiEdicion({ paquete: paqueteGemini, opciones });
  const momentos = obtenerMomentosGemini(gemini, momentosFallback);

  const zooms = crearPlanZoom({ momentos, perfil: perfil.id, sujeto });
  const animaciones = crearPlanAnimaciones({ elementos: momentos, perfil: perfil.id });
  const efectos = crearPlanEfectos({ momentos, perfil: perfil.id });
  const encuadre = crearPlanEncuadreDinamico({ perfil: perfil.id, plataforma: plataformaBase, sujeto, rostro });
  const reglasAprendizaje = await obtenerReglasAplicables({ perfil: perfil.id, texto: segmentos.map((seg) => seg.texto || seg.text).join(' ') });

  const planProduccion = crearPlanProduccion({
    proyecto,
    recursos: [],
    subtitulos: subtitulosPorPlataforma.flatMap((item) => item.subtitulos || []),
    textos: textosPantalla,
    graficos: [],
    tablas: [],
    visual: { fondo, zooms, efectos, animaciones, encuadre, zonasSeguras },
    audio: planAudio,
    gemini
  });

  return {
    ok: true,
    version: '1.1.0',
    proyecto,
    perfil,
    plataformas,
    exportaciones,
    resultadoPlataformas,
    audio: planAudio,
    subtitulosPorPlataforma,
    textos: textosPantalla,
    visual: { sujeto, rostro, zonasSeguras, removerFondo, fondo, zooms, animaciones, efectos, encuadre },
    gemini,
    produccion: planProduccion,
    aprendizaje: { reglasAplicables: reglasAprendizaje },
    estado: gemini.estado || 'MODULOS_CONECTADOS',
    creadoEn: new Date().toISOString()
  };
}
