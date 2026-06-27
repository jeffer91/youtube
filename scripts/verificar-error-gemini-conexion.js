/* Verificacion correccion: gemini.conexion.js no debe usar funciones no importadas. */

import { crearPaqueteGeminiEdicion } from '../gemini/gemini.conexion.js';

try {
  const paquete = crearPaqueteGeminiEdicion({
    proyecto: { id: 'test', perfil: 'general', nombre: 'Prueba' },
    perfil: { id: 'general', nombre: 'General' },
    transcripcion: { segmentos: [{ inicio: 0, fin: 3, texto: 'Texto de prueba para validar Gemini.' }] },
    plataformas: ['tiktok'],
    opciones: { usarGemini: false }
  });

  if (!paquete.ok) throw new Error('No se creo paquete Gemini.');
  if (!paquete.tareas?.analisis) throw new Error('No se preparo tarea analisis.');
  if (!paquete.tareas?.recursos) throw new Error('No se preparo tarea recursos.');
  if (!paquete.tareas?.textos) throw new Error('No se preparo tarea textos.');
  if (!paquete.tareas?.graficos) throw new Error('No se preparo tarea graficos.');
  if (!paquete.tareas?.estilo) throw new Error('No se preparo tarea estilo.');

  console.log('OK correccion Gemini conexion: paquete creado sin ReferenceError');
} catch (error) {
  console.error('ERROR correccion Gemini conexion:', error.message);
  process.exit(1);
}
