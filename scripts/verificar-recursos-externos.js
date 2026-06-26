/* Verificacion Bloque 4: recursos externos. */

import {
  prepararBusquedaImagenes,
  prepararBusquedaClips,
  normalizarResultadoImagen,
  normalizarResultadoClip,
  prepararDescargaRecurso,
  validarRecursoExterno,
  crearRegistroFuenteRecurso
} from '../recursos-externos/recursos-externos.conexion.js';

function main() {
  const contexto = { tema: 'aula moderna', frase: 'educacion clara', perfil: 'creciaula' };
  const busquedaImagen = prepararBusquedaImagenes(contexto);
  const busquedaClip = prepararBusquedaClips(contexto);
  const imagen = normalizarResultadoImagen({ url: 'https://example.com/aula.jpg', fuente: 'pexels', licencia: 'libre' }, contexto);
  const clip = normalizarResultadoClip({ url: 'https://example.com/aula.mp4', fuente: 'pexels', licencia: 'libre' }, contexto);
  const descarga = prepararDescargaRecurso(imagen, { carpetaDestino: 'salida/prueba/biblioteca' });
  const validacion = validarRecursoExterno(imagen);
  const fuente = crearRegistroFuenteRecurso(clip, contexto);

  if (!busquedaImagen.consulta || !busquedaClip.consulta) throw new Error('No se crearon consultas externas.');
  if (!descarga.nombreArchivo) throw new Error('No se nombro la descarga.');
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));
  if (!fuente.fuente) throw new Error('No se registro fuente.');

  console.log('OK recursos externos:', busquedaImagen.tipo, busquedaClip.tipo, descarga.nombreArchivo);
}

try {
  main();
} catch (error) {
  console.error('ERROR recursos externos:', error.message);
  process.exit(1);
}
