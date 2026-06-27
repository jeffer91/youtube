/*
  Nueva etapa estructural - Bloque 1
  Función: convertir datos técnicos, transcripción y fotogramas en entendimiento editorial.
*/

import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function clasificarDuracion(segundos = 0) {
  const duracion = numero(segundos, 0);
  if (duracion <= 0) return 'desconocida';
  if (duracion <= 30) return 'corto';
  if (duracion <= 90) return 'medio';
  return 'largo';
}

function detectarFormato(analisis = {}) {
  const orientacion = analisis.orientacion || 'desconocida';
  if (orientacion === 'vertical') return 'redes_verticales';
  if (orientacion === 'horizontal') return 'youtube_horizontal_o_recorte_vertical';
  if (orientacion === 'cuadrada') return 'formato_cuadrado';
  return 'formato_desconocido';
}

function crearMomentosBase(analisis = {}, fotogramas = {}) {
  const duracion = numero(analisis.duracionSegundos, 0);
  const frames = Array.isArray(fotogramas.fotogramas) ? fotogramas.fotogramas : [];
  const momentos = [];

  if (duracion > 0) {
    momentos.push({ id: 'hook-inicial', inicio: 0, fin: Math.min(4, duracion), tipo: 'hook', prioridad: 10, motivo: 'Primeros segundos para enganchar.' });
    if (duracion > 12) momentos.push({ id: 'idea-media', inicio: Number((duracion * 0.35).toFixed(2)), fin: Number((duracion * 0.45).toFixed(2)), tipo: 'idea', prioridad: 35, motivo: 'Zona media para reforzar ritmo visual.' });
    if (duracion > 20) momentos.push({ id: 'cierre', inicio: Number(Math.max(0, duracion - 6).toFixed(2)), fin: duracion, tipo: 'cierre', prioridad: 30, motivo: 'Cierre para resumen, marca o llamado final.' });
  }

  frames.slice(0, 6).forEach((frame, index) => {
    momentos.push({ id: `fotograma-${index + 1}`, inicio: frame.segundo, fin: Number(Math.min(duracion || frame.segundo + 2, frame.segundo + 2).toFixed(2)), tipo: 'fotograma', prioridad: 40 + index, motivo: `Fotograma clave extraído en ${frame.segundo}s.` });
  });

  return momentos.sort((a, b) => a.inicio - b.inicio || a.prioridad - b.prioridad);
}

function crearNecesidades({ analisis, transcripcion, fotogramas }) {
  const necesidades = ['revisar_hook_inicial', 'mantener_ritmo_visual'];
  if (!analisis?.tieneAudio) necesidades.push('video_sin_audio_detectado');
  if (!transcripcion?.textoCompleto) necesidades.push('transcripcion_real_pendiente');
  if (!fotogramas?.ok) necesidades.push('analisis_fotogramas_pendiente');
  if (analisis?.orientacion === 'horizontal') necesidades.push('adaptar_a_formato_vertical_si_es_para_tiktok');
  if (clasificarDuracion(analisis?.duracionSegundos) === 'largo') necesidades.push('dividir_en_bloques_de_idea');
  return necesidades;
}

function crearResumenEditorial({ entrada, analisis, transcripcion, fotogramas, opciones }) {
  const perfil = texto(opciones?.perfil || entrada?.proyecto?.perfil, 'general');
  const plataforma = texto(opciones?.plataforma || entrada?.proyecto?.plataforma, 'tiktok');
  const duracion = numero(analisis?.duracionSegundos, 0);
  const textoDisponible = texto(transcripcion?.textoCompleto, '');
  return {
    perfil,
    plataforma,
    formatoDetectado: detectarFormato(analisis),
    duracionTipo: clasificarDuracion(duracion),
    duracionSegundos: duracion || null,
    tieneAudio: Boolean(analisis?.tieneAudio),
    tieneTranscripcionReal: Boolean(textoDisponible),
    fotogramasExtraidos: fotogramas?.cantidadExtraida || 0,
    lectura: textoDisponible ? `Video con texto detectado para guiar edición en perfil ${perfil}.` : `Video preparado para edición en perfil ${perfil}, pero requiere transcripción real para títulos y textos precisos.`,
    recomendacionInicial: 'Antes de editar, confirmar transcripción, fotogramas clave y objetivo de plataforma.'
  };
}

export async function analizarVideoEditorial({ entrada, analisis, transcripcion, fotogramas, opciones = {} } = {}) {
  const momentos = crearMomentosBase(analisis, fotogramas);
  const necesidades = crearNecesidades({ analisis, transcripcion, fotogramas });
  const resumenEditorial = crearResumenEditorial({ entrada, analisis, transcripcion, fotogramas, opciones });
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;

  const resultado = {
    ok: true,
    etapa: 'entender-analisis-video',
    tipo: 'analisis-editorial-video',
    resumenEditorial,
    momentosClave: momentos,
    necesidades,
    decisionesPendientes: [
      'Confirmar transcripción real para generar subtítulos y textos.',
      'Revisar fotogramas antes de agregar imágenes o animaciones.',
      'Definir línea de tiempo de producción antes del render final.'
    ],
    mensaje: 'Análisis editorial del video generado.',
    creadoEn: new Date().toISOString()
  };

  if (carpetaProyecto) await escribirJson(path.join(carpetaProyecto, 'entendimiento', 'analisis-editorial-video.json'), resultado);
  return resultado;
}

export default analizarVideoEditorial;
