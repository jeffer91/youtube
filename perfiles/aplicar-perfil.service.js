/*
  Modulo: perfiles
  Funcion: aplicar un perfil a las opciones de un proyecto.
*/

import { obtenerPerfil } from './obtener-perfil.service.js';

export function aplicarPerfilAProyecto(proyecto = {}, perfilId = proyecto.perfil) {
  const perfil = obtenerPerfil(perfilId);
  return {
    ...proyecto,
    perfil: perfil.id,
    configuracionPerfil: {
      nombre: perfil.nombre,
      categoria: perfil.categoria,
      ritmo: perfil.ritmo,
      nivelVisual: perfil.nivelVisual,
      musica: perfil.musica,
      subtitulos: perfil.subtitulos,
      recursos: perfil.recursos,
      instruccionesGemini: perfil.instruccionesGemini
    },
    actualizadoEn: new Date().toISOString()
  };
}

export function obtenerOpcionesEdicionDesdePerfil(perfilId) {
  const perfil = obtenerPerfil(perfilId);
  return {
    perfilId: perfil.id,
    ritmo: perfil.ritmo,
    nivelVisual: perfil.nivelVisual,
    musica: perfil.musica,
    subtitulos: perfil.subtitulos,
    recursosSugeridos: perfil.recursos,
    instruccionesGemini: perfil.instruccionesGemini
  };
}
