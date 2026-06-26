/*
  Modulo: aprendizaje
  Funcion: guardar una correccion manual como regla aprendida.
*/

import { APRENDIZAJE_CONFIG } from './aprendizaje.config.js';
import { crearReglaAprendizaje, validarReglaAprendizaje } from './regla-aprendizaje.modelo.js';
import { cargarMemoriaEdicion, guardarMemoriaEdicion } from './memoria-edicion.service.js';

export async function guardarCorreccionAprendizaje(correccion = {}, opciones = {}) {
  const memoria = await cargarMemoriaEdicion(opciones);
  const regla = crearReglaAprendizaje({
    tipo: correccion.tipo || APRENDIZAJE_CONFIG.tipos.correccionManual,
    perfil: correccion.perfil || 'general',
    tema: correccion.tema || '',
    frase: correccion.frase || correccion.fraseRelacionada || '',
    recursoRechazado: correccion.recursoRechazado || null,
    recursoElegido: correccion.recursoElegido || null,
    motivo: correccion.motivo || '',
    regla: correccion.regla || correccion.descripcion || 'Aplicar preferencia registrada por Jeff.',
    impacto: correccion.impacto || APRENDIZAJE_CONFIG.impacto.medio
  });

  const validacion = validarReglaAprendizaje(regla);
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));

  const reglas = memoria.reglas.filter((item) => item.id !== regla.id);
  reglas.push(regla);
  await guardarMemoriaEdicion({ reglas }, opciones);
  return regla;
}
