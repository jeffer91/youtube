/*
  Modulo: aprendizaje
  Funcion: convertir un reemplazo de Produccion en regla aprendida.
*/

import { APRENDIZAJE_CONFIG } from './aprendizaje.config.js';
import { guardarCorreccionAprendizaje } from './guardar-correccion.service.js';

export async function aprenderDeReemplazo(datos = {}, opciones = {}) {
  const anterior = datos.recursoAnterior || datos.anterior || null;
  const elegido = datos.recursoElegido || datos.nuevo || null;
  const perfil = datos.perfil || elegido?.perfil || anterior?.perfil || 'general';
  const tema = datos.tema || elegido?.tema || anterior?.tema || '';
  const frase = datos.frase || datos.fraseRelacionada || elegido?.fraseRelacionada || anterior?.fraseRelacionada || '';

  return guardarCorreccionAprendizaje({
    tipo: APRENDIZAJE_CONFIG.tipos.reemplazoRecurso,
    perfil,
    tema,
    frase,
    recursoRechazado: anterior,
    recursoElegido: elegido,
    motivo: datos.motivo || 'Reemplazo realizado en Produccion.',
    regla: datos.regla || `Para el perfil ${perfil}, preferir recursos parecidos al elegido cuando el tema sea ${tema || 'similar'}.`,
    impacto: APRENDIZAJE_CONFIG.impacto.alto
  }, opciones);
}
