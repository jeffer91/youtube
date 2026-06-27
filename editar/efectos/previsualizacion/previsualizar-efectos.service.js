/*
  Bloque 11: Previsualización técnica de efectos
  Función: probar catálogo, planificador y compilador sin renderizar un video real.
*/

import { planificarEfectos } from '../planificador/index.js';
import { compilarPlanFfmpeg } from '../ffmpeg/index.js';
import { crearDiagnosticoEfectos } from '../../../diagnostico/efectos/diagnostico-efectos.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function dividirTextoEnSegmentos(textoBase = '', duracion = 30) {
  const frases = texto(textoBase, 'Este video tiene una idea importante. Luego aparece un punto clave. Cerramos con una conclusión clara.')
    .split(/[.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  const duracionVideo = Math.max(8, numero(duracion, 30));
  const espacio = Math.max(3, duracionVideo / Math.max(frases.length + 1, 2));

  return frases.map((frase, index) => {
    const inicio = Math.min(duracionVideo - 1.5, 1 + index * espacio);
    return {
      inicio: Number(inicio.toFixed(2)),
      fin: Number(Math.min(duracionVideo, inicio + 2.8).toFixed(2)),
      texto: frase
    };
  });
}

function crearDatosPrevisualizacion(opciones = {}) {
  const duracion = Math.max(8, numero(opciones.duracionSegundos || opciones.duracion, 35));
  const perfil = texto(opciones.perfil, 'general').toLowerCase();
  const plataforma = texto(opciones.plataforma, 'tiktok').toLowerCase();
  const segmentos = dividirTextoEnSegmentos(opciones.texto || opciones.guion || opciones.descripcion, duracion);

  return {
    entrada: {
      proyecto: {
        id: 'preview-efectos',
        nombre: 'Previsualización de efectos',
        perfil,
        plataforma
      }
    },
    entendimiento: {
      ok: true,
      analisis: {
        duracionSegundos: duracion,
        orientacion: opciones.formato === '16:9' ? 'horizontal' : 'vertical',
        tieneAudio: true
      }
    },
    transcripcion: {
      ok: true,
      transcripcion: {
        cantidadSegmentos: segmentos.length,
        segmentos
      },
      textosFlotantes: {
        cantidad: Math.min(3, segmentos.length),
        textos: segmentos.slice(0, 3).map((segmento, index) => ({
          inicio: segmento.inicio,
          fin: segmento.fin,
          texto: segmento.texto.slice(0, 42),
          prioridad: 10 + index
        }))
      }
    },
    edicionDinamica: { activo: false, omitido: true },
    opciones: {
      perfil,
      plataforma,
      selectorEfectos: texto(opciones.selectorEfectos || opciones.selector, 'local').toLowerCase(),
      motorEfectosIA: texto(opciones.selectorEfectos || opciones.selector, 'local').toLowerCase(),
      intensidadEfectos: texto(opciones.intensidadEfectos || opciones.intensidad, 'normal').toLowerCase(),
      maxEfectosVisuales: Math.max(3, Math.min(24, Math.round(numero(opciones.maxEfectosVisuales || opciones.maxEfectos, 12)))),
      usarMotorEfectos: true,
      usarGemini: opciones.usarGemini === true || String(opciones.usarGemini || '').toLowerCase() === 'true',
      geminiCredencial: opciones.geminiCredencial || '',
      geminiModelo: opciones.geminiModelo || 'gemini-1.5-flash'
    }
  };
}

function filtroBasePorFormato(formato = '9:16') {
  if (formato === '16:9') return { width: 1920, height: 1080, filtro: 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,setsar=1,format=yuv420p' };
  if (formato === '1:1') return { width: 1080, height: 1080, filtro: 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,fps=30,setsar=1,format=yuv420p' };
  return { width: 1080, height: 1920, filtro: 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,format=yuv420p' };
}

export async function previsualizarEfectos(opciones = {}) {
  const datos = crearDatosPrevisualizacion(opciones);
  const formato = texto(opciones.formato, '9:16');
  const base = filtroBasePorFormato(formato);
  const plan = await planificarEfectos(datos);
  const compilado = compilarPlanFfmpeg({
    filtroBase: base.filtro,
    plan,
    width: base.width,
    height: base.height,
    duracionSegundos: datos.entendimiento.analisis.duracionSegundos
  });

  const resultado = {
    ok: Boolean(plan.ok && compilado.ok),
    omitido: !compilado.ok || compilado.filtrosAplicados === 0,
    motor: 'efectos-v1-preview',
    filtroVideo: compilado.filtroVideo,
    filtrosAplicados: compilado.filtrosAplicados,
    plan,
    compilado,
    detalle: {
      perfil: plan?.perfil?.id || datos.opciones.perfil,
      intensidad: plan?.intensidad?.id || datos.opciones.intensidadEfectos,
      origen: plan?.origen || 'local',
      fallbackLocal: Boolean(plan?.fallbackLocal),
      totalPlan: plan?.total || 0,
      filtrosAplicados: compilado.filtrosAplicados || 0,
      omitidos: compilado.omitidos?.length || 0
    },
    mensaje: compilado.mensaje,
    creadoEn: new Date().toISOString()
  };

  return {
    ok: resultado.ok,
    tipo: 'previsualizacion-efectos',
    entrada: {
      perfil: datos.opciones.perfil,
      plataforma: datos.opciones.plataforma,
      formato,
      duracionSegundos: datos.entendimiento.analisis.duracionSegundos,
      selectorEfectos: datos.opciones.selectorEfectos,
      intensidadEfectos: datos.opciones.intensidadEfectos,
      maxEfectosVisuales: datos.opciones.maxEfectosVisuales
    },
    planResumen: {
      origen: plan.origen,
      fallbackLocal: plan.fallbackLocal,
      optimizado: plan.optimizado,
      total: plan.total,
      totalAntesOptimizar: plan.totalAntesOptimizar,
      advertencias: plan.advertencias
    },
    efectos: plan.efectos,
    filtrosAplicados: compilado.filtrosAplicados,
    filtroVideo: compilado.filtroVideo,
    diagnostico: crearDiagnosticoEfectos(resultado),
    mensaje: resultado.ok ? 'Previsualización de efectos generada.' : 'Previsualización generada con advertencias.'
  };
}

export default previsualizarEfectos;
