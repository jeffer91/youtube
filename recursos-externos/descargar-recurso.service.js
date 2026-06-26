/*
  Modulo: recursos-externos
  Funcion: preparar descarga controlada de recursos. No descarga sin aprobacion.
*/

import path from 'path';
import { nombrarRecurso } from './nombrar-recurso.service.js';

export function prepararDescargaRecurso(recurso = {}, opciones = {}) {
  const carpetaDestino = opciones.carpetaDestino || 'biblioteca/recursos/externos';
  const extension = recurso.extension || (recurso.tipo === 'video' ? 'mp4' : recurso.tipo === 'audio' ? 'mp3' : 'jpg');
  const nombreArchivo = recurso.nombreArchivo || nombrarRecurso({
    tipo: recurso.tipo,
    perfil: recurso.perfil,
    tema: recurso.tema,
    frase: recurso.fraseRelacionada,
    extension
  });

  return {
    ok: true,
    listoParaDescargar: Boolean(recurso.url),
    requiereAprobacionProduccion: opciones.requiereAprobacionProduccion !== false,
    url: recurso.url || '',
    destino: path.join(carpetaDestino, nombreArchivo).replace(/\\/g, '/'),
    nombreArchivo,
    recurso: {
      ...recurso,
      nombreArchivo,
      ruta: path.join(carpetaDestino, nombreArchivo).replace(/\\/g, '/')
    },
    creadoEn: new Date().toISOString()
  };
}
