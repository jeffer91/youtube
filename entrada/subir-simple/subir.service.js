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

const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = 'cuadrado-centro';

function normalizarTexto(valor, valorPorDefecto) {
  if (typeof valor !== 'string') {
    return valorPorDefecto;
  }

  const limpio = valor.trim();

  return limpio.length > 0 ? limpio : valorPorDefecto;
}

function normalizarModoVideo(valor) {
  const modo = normalizarTexto(valor, MODO_VIDEO_PREDETERMINADO).toLowerCase();

  if (['cuadrado-centro', 'tiktok-cuadrado-centro', 'square-center'].includes(modo)) {
    return 'cuadrado-centro';
  }

  if (['simple', 'tiktok-simple'].includes(modo)) {
    return 'simple';
  }

  return modo;
}

function normalizarPlataforma(valor) {
  return normalizarTexto(valor, PLATAFORMA_PREDETERMINADA).toLowerCase();
}

export async function subirVideoSimple({ archivoTemporal, nombreOriginal, nombreTemporal, opciones = {} }) {
  const raiz = obtenerRutaRaiz();
  const idProyecto = crearIdProyecto('video');
  const nombreSeguro = normalizarNombreArchivo(nombreOriginal || nombreTemporal || `${idProyecto}.mp4`);

  const carpetaProyecto = path.join(raiz, 'datos', 'proyectos', idProyecto);
  const carpetaOriginales = path.join(raiz, 'datos', 'videos-originales');
  const rutaVideoOriginal = path.join(carpetaOriginales, `${idProyecto}-${nombreSeguro}`);
  const rutaProyectoJson = path.join(carpetaProyecto, 'proyecto.json');

  const plataforma = normalizarPlataforma(opciones?.plataforma);
  const modo = normalizarModoVideo(opciones?.modo);

  asegurarCarpeta(carpetaProyecto);
  asegurarCarpeta(carpetaOriginales);

  await copiarArchivoSeguro(archivoTemporal, rutaVideoOriginal);

  const proyecto = {
    id: idProyecto,
    nombre: path.basename(nombreSeguro, path.extname(nombreSeguro)),
    plataforma,
    modo,
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
    opciones: {
      plataforma,
      modo,
      mejorarAudio: opciones?.mejorarAudio ?? null,
      modoAudio: opciones?.modoAudio || null
    },
    historial: [
      {
        fecha: new Date().toISOString(),
        etapa: 'entrada',
        mensaje: 'Video recibido y guardado correctamente.',
        modo
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