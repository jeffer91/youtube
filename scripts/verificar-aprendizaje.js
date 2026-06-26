/* Verificacion Bloque 6: Aprendizaje. */

import {
  guardarCorreccionAprendizaje,
  aprenderDeReemplazo,
  obtenerReglasAplicables,
  aplicarAprendizajeASugerencias
} from '../aprendizaje/aprendizaje.conexion.js';

async function main() {
  const baseDir = process.cwd();
  const regla = await guardarCorreccionAprendizaje({
    perfil: 'general',
    tema: 'aula moderna',
    frase: 'explicar mejor',
    motivo: 'Preferencia visual clara',
    regla: 'Usar fondos limpios cuando el contenido sea educativo.'
  }, { baseDir });

  const reglaReemplazo = await aprenderDeReemplazo({
    perfil: 'general',
    tema: 'aula moderna',
    frase: 'explicar mejor',
    recursoAnterior: { id: 'viejo', tipo: 'imagen', nombre: 'Imagen no ideal' },
    recursoElegido: { id: 'nuevo', tipo: 'imagen', nombre: 'Imagen correcta' },
    motivo: 'Reemplazo de prueba'
  }, { baseDir });

  const reglas = await obtenerReglasAplicables({ perfil: 'general', tema: 'aula moderna', frase: 'explicar mejor' }, { baseDir });
  const sugerencias = await aplicarAprendizajeASugerencias([{ id: 'sug-1', tipo: 'imagen', prioridad: 'media' }], { perfil: 'general', tema: 'aula moderna', frase: 'explicar mejor' }, { baseDir });

  if (!regla.id || !reglaReemplazo.id) throw new Error('No se guardaron reglas.');
  if (reglas.length < 2) throw new Error('No se encontraron reglas aplicables.');
  if (!sugerencias[0].aprendizajeAplicado) throw new Error('No se aplico aprendizaje a la sugerencia.');

  console.log('OK Aprendizaje:', reglas.length, 'reglas');
}

main().catch((error) => {
  console.error('ERROR Aprendizaje:', error.message);
  process.exit(1);
});
