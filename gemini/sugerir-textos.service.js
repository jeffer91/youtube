/*
  Modulo: gemini
  Funcion: preparar sugerencias de textos en pantalla, frases, titulos y datos clave.
*/

import { obtenerConfigGemini } from './gemini.config.js';
import { detectarTextosRelevantes } from '../textos/detectar-textos-relevantes.service.js';
import { generarTextosPantalla } from '../textos/generar-textos-pantalla.service.js';

export function prepararSugerenciaTextos({ transcripcion = {}, analisis = {}, perfil = {}, plataforma = 'tiktok', opciones = {} } = {}) {
  const config = obtenerConfigGemini(opciones);

  return {
    ok: true,
    tarea: config.tareas.sugerirTextos,
    modelo: config.modelo,
    payload: {
      perfil: perfil.id || 'general',
      plataforma,
      instruccionesPerfil: perfil.instruccionesGemini || '',
      momentosImportantes: analisis.momentosImportantes || [],
      segmentos: (transcripcion.segmentos || transcripcion.segments || []).slice(0, 80),
      salidaEsperada: {
        titulos: true,
        frases: true,
        datosClave: true,
        avisos: true,
        posicionSegura: true
      }
    },
    instrucciones: [
      'Crear textos cortos, claros y utiles para pantalla.',
      'No saturar el video.',
      'Adaptar cantidad y estilo al perfil.',
      'Indicar inicio, fin, texto, tipo y motivo.'
    ],
    creadoEn: new Date().toISOString()
  };
}

export function crearTextosFallback({ transcripcion = {}, perfil = 'general', plataforma = 'tiktok' } = {}) {
  const detectados = detectarTextosRelevantes({ segmentos: transcripcion.segmentos || transcripcion.segments || [], perfil });
  const capas = generarTextosPantalla({ textos: detectados.textos, perfil, plataforma });

  return {
    ok: true,
    fallback: true,
    perfil,
    plataforma,
    textos: capas,
    total: capas.length,
    creadoEn: new Date().toISOString()
  };
}
