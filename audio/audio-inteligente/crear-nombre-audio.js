/*
  Nombre completo: crear-nombre-audio.js
  Ruta o ubicación: AutoVideoJeff/audio/audio-inteligente/crear-nombre-audio.js
  Función o funciones:
    - Crear nombres seguros para audios mejorados, reportes y temporales del motor inteligente.
    - Resolver rutas compatibles con modo web y modo Electron.
    - Preparar carpetas necesarias para guardar resultados de audio sin romper el flujo.
    - Evitar nombres con espacios, acentos o caracteres problemáticos para FFmpeg.
  Con qué se conecta:
    - audio/audio-inteligente/audio-inteligente.config.js
    - audio/audio-inteligente/audio-inteligente.service.js
    - audio/audio-inteligente/crear-reporte-audio.js
    - comun/archivos.js
*/

import path from 'path';
import {
  asegurarCarpeta,
  normalizarNombreArchivo,
  obtenerRutasDatosBase
} from '../../comun/archivos.js';
import { AUDIO_INTELIGENTE_CONFIG } from './audio-inteligente.config.js';

function crearMarcaTemporal(fecha = new Date()) {
  const yyyy = String(fecha.getFullYear());
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');

  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function limpiarTextoParaRuta(valor, respaldo = 'audio') {
  const texto = String(valor || respaldo)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return texto || respaldo;
}

function normalizarExtension(extension, respaldo = AUDIO_INTELIGENTE_CONFIG.salida.extensionAudio) {
  const valor = String(extension || respaldo).trim().toLowerCase();
  const conPunto = valor.startsWith('.') ? valor : `.${valor}`;

  return conPunto.replace(/[^.a-z0-9]/g, '') || respaldo;
}

export function crearNombreAudioMejorado({
  idProyecto,
  nombreOriginal = 'video.mp4',
  perfilId = 'audio-inteligente',
  extension = AUDIO_INTELIGENTE_CONFIG.salida.extensionAudio,
  fecha = new Date()
} = {}) {
  const nombreSeguro = normalizarNombreArchivo(nombreOriginal || 'video.mp4');
  const base = limpiarTextoParaRuta(path.basename(nombreSeguro, path.extname(nombreSeguro)), 'video');
  const proyecto = limpiarTextoParaRuta(idProyecto, 'proyecto');
  const perfil = limpiarTextoParaRuta(perfilId, 'perfil');
  const marca = crearMarcaTemporal(fecha);

  return `${base}-${perfil}-${proyecto}-${marca}${normalizarExtension(extension)}`;
}

export function crearNombreReporteAudio({
  idProyecto,
  perfilId = 'audio-inteligente',
  fecha = new Date()
} = {}) {
  const proyecto = limpiarTextoParaRuta(idProyecto, 'proyecto');
  const perfil = limpiarTextoParaRuta(perfilId, 'perfil');
  const marca = crearMarcaTemporal(fecha);

  return `reporte-audio-${perfil}-${proyecto}-${marca}.json`;
}

export function crearNombreTemporalAudio({
  idProyecto,
  nombre = 'temporal',
  extension = '.wav',
  fecha = new Date()
} = {}) {
  const proyecto = limpiarTextoParaRuta(idProyecto, 'proyecto');
  const base = limpiarTextoParaRuta(nombre, 'temporal');
  const marca = crearMarcaTemporal(fecha);

  return `${base}-${proyecto}-${marca}${normalizarExtension(extension, '.wav')}`;
}

export function obtenerRutasAudioInteligente({
  idProyecto,
  nombreOriginal = 'video.mp4',
  perfilId = 'audio-inteligente',
  extensionAudio = AUDIO_INTELIGENTE_CONFIG.salida.extensionAudio,
  fecha = new Date()
} = {}) {
  const rutasBase = obtenerRutasDatosBase();
  const datos = rutasBase.datos;
  const audiosMejorados = rutasBase.audiosMejorados || path.join(datos, 'audios-mejorados');
  const reportesAudio = path.join(datos, 'reportes-audio');
  const temporalesAudio = path.join(rutasBase.temporales, 'audio-inteligente');

  asegurarCarpeta(audiosMejorados);
  asegurarCarpeta(reportesAudio);
  asegurarCarpeta(temporalesAudio);

  const nombreAudio = crearNombreAudioMejorado({
    idProyecto,
    nombreOriginal,
    perfilId,
    extension: extensionAudio,
    fecha
  });

  const nombreReporte = crearNombreReporteAudio({
    idProyecto,
    perfilId,
    fecha
  });

  return {
    datos,
    audiosMejorados,
    reportesAudio,
    temporalesAudio,
    nombreAudio,
    nombreReporte,
    rutaAudioMejorado: path.join(audiosMejorados, nombreAudio),
    rutaReporteAudio: path.join(reportesAudio, nombreReporte),
    crearRutaTemporal(nombre, extension = '.wav') {
      return path.join(
        temporalesAudio,
        crearNombreTemporalAudio({ idProyecto, nombre, extension, fecha: new Date() })
      );
    }
  };
}

export function crearIdentificadorAudio({ idProyecto, perfilId, calidad } = {}) {
  const proyecto = limpiarTextoParaRuta(idProyecto, 'proyecto');
  const perfil = limpiarTextoParaRuta(perfilId, 'perfil');
  const nivel = limpiarTextoParaRuta(calidad, 'inteligente');

  return `${proyecto}-${perfil}-${nivel}`;
}
