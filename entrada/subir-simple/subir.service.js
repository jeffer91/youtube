/*
  Nombre completo: subir.service.js
  Ruta o ubicación: AutoVideoJeff/entrada/subir-simple/subir.service.js
  Función o funciones:
    - Recibir el archivo temporal generado por el servidor.
    - Crear un ID de proyecto único.
    - Copiar el video original a datos/videos-originales/.
    - Crear la carpeta del proyecto en datos/proyectos/.
    - Guardar un archivo proyecto.json con los datos iniciales.
  Con qué se conecta:
    - entrada/entrada.conexion.js
    - comun/archivos.js
    - datos/videos-originales/
    - datos/proyectos/
*/

import path from 'path';
import {
  asegurarCarpeta,
  copiarArchivoSeguro,
  crearIdProyecto,
  escribirJson,
  normalizarNombreArchivo,
  obtenerRutaRaiz
} from '../../comun/archivos.js';

export async function subirVideoSimple({ archivoTemporal, nombreOriginal, nombreTemporal, opciones }) {
  const raiz = obtenerRutaRaiz();
  const idProyecto = crearIdProyecto('video');
  const nombreSeguro = normalizarNombreArchivo(nombreOriginal || nombreTemporal || `${idProyecto}.mp4`);

  const carpetaProyecto = path.join(raiz, 'datos', 'proyectos', idProyecto);
  const carpetaOriginales = path.join(raiz, 'datos', 'videos-originales');
  const rutaVideoOriginal = path.join(carpetaOriginales, `${idProyecto}-${nombreSeguro}`);
  const rutaProyectoJson = path.join(carpetaProyecto, 'proyecto.json');

  asegurarCarpeta(carpetaProyecto);
  asegurarCarpeta(carpetaOriginales);

  await copiarArchivoSeguro(archivoTemporal, rutaVideoOriginal);

  const proyecto = {
    id: idProyecto,
    nombre: path.basename(nombreSeguro, path.extname(nombreSeguro)),
    plataforma: opciones?.plataforma || 'tiktok',
    modo: opciones?.modo || 'simple',
    creadoEn: new Date().toISOString(),
    estado: 'VIDEO_RECIBIDO'
  };

  const video = {
    nombreOriginal,
    nombreSeguro,
    rutaOriginal: rutaVideoOriginal,
    extension: path.extname(nombreSeguro).toLowerCase(),
    origen: 'carga-local'
  };

  const rutas = {
    raiz,
    carpetaProyecto,
    carpetaOriginales,
    rutaProyectoJson,
    rutaVideoOriginal
  };

  await escribirJson(rutaProyectoJson, {
    proyecto,
    video,
    rutas,
    historial: [
      {
        fecha: new Date().toISOString(),
        etapa: 'entrada',
        mensaje: 'Video recibido y guardado correctamente.'
      }
    ]
  });

  return {
    ok: true,
    proyecto,
    video,
    rutas
  };
}
