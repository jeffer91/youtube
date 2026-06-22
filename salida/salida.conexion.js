/*
  Nombre completo: salida.conexion.js
  Ruta o ubicación: AutoVideoJeff/salida/salida.conexion.js
  Función o funciones:
    - Ser la puerta de comunicación del módulo salida/.
    - Recibir entrada, entendimiento, audio y edición.
    - Validar el plan de render antes de exportar.
    - Permitir exportar con audio original o audio mejorado.
    - Llamar al exportador simple.
  Con qué se conecta:
    - motor/flujo-principal.js
    - salida/exportar-simple/exportar.service.js
    - audio/audio.conexion.js
*/

import fs from 'fs';
import { exportarVideoSimple } from './exportar-simple/exportar.service.js';

function validarParaSalida({ entrada, edicion, audio }) {
  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede exportar porque falta el video original.');
  }

  if (!fs.existsSync(entrada.video.rutaOriginal)) {
    throw new Error(`No se puede exportar porque no existe el video original: ${entrada.video.rutaOriginal}`);
  }

  if (!entrada?.rutas?.carpetaProyecto) {
    throw new Error('No se puede exportar porque falta la carpeta del proyecto.');
  }

  if (!edicion || typeof edicion !== 'object') {
    throw new Error('No se puede exportar porque falta el plan de edición.');
  }

  if (edicion.ok !== true) {
    throw new Error('No se puede exportar porque la edición no terminó correctamente.');
  }

  if (!edicion.render?.filtroVideo) {
    throw new Error('No se puede exportar porque falta el filtro de video.');
  }

  if (!edicion.salida?.nombreExportado) {
    throw new Error('No se puede exportar porque falta el nombre del archivo final.');
  }

  if (audio && typeof audio !== 'object') {
    throw new Error('No se puede exportar porque el resultado de audio no es válido.');
  }

  if (audio?.usarAudioMejorado && !audio?.rutaAudioMejorado) {
    throw new Error('No se puede exportar con audio mejorado porque falta la ruta del audio limpio.');
  }

  if (audio?.usarAudioMejorado && !fs.existsSync(audio.rutaAudioMejorado)) {
    throw new Error(`No existe el audio mejorado generado: ${audio.rutaAudioMejorado}`);
  }
}

export async function prepararSalida({
  entrada,
  entendimiento,
  audio = null,
  edicion,
  opciones = {}
}) {
  validarParaSalida({
    entrada,
    edicion,
    audio
  });

  return await exportarVideoSimple({
    entrada,
    entendimiento,
    audio,
    edicion,
    opciones
  });
}