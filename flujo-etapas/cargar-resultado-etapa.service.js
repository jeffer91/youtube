/*
  Bloque 3: Estado de proyecto por etapas
  Función: cargar resultados JSON guardados por etapa.
*/

import { leerJsonSiExiste } from '../comun/archivos.js';
import { obtenerRutaResultadoEtapa } from './guardar-resultado-etapa.service.js';

export async function cargarResultadoEtapa({ proyectoId, carpetaProyecto = null, etapa, nombreArchivo = null, valorPorDefecto = null } = {}) {
  const ruta = obtenerRutaResultadoEtapa({ proyectoId, carpetaProyecto, etapa, nombreArchivo });
  return await leerJsonSiExiste(ruta, valorPorDefecto);
}

export async function existeResultadoEtapa(argumentos = {}) {
  const resultado = await cargarResultadoEtapa({ ...argumentos, valorPorDefecto: null });
  return Boolean(resultado);
}
