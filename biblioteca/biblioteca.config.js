/*
  Modulo: biblioteca
  Funcion: configuracion de la biblioteca general externa al flujo.
*/

export const BIBLIOTECA_CONFIG = Object.freeze({
  version: '1.0.0',
  carpetaRaiz: 'biblioteca/recursos',
  archivoIndice: 'biblioteca-indice.json',
  estados: Object.freeze({
    disponible: 'disponible',
    pendiente: 'pendiente',
    aprobado: 'aprobado',
    rechazado: 'rechazado',
    archivado: 'archivado'
  }),
  tipos: Object.freeze({
    imagen: 'imagen',
    video: 'video',
    audio: 'audio',
    fondo: 'fondo',
    overlay: 'overlay',
    transicion: 'transicion',
    plantilla: 'plantilla'
  }),
  licenciaPorDefecto: 'pendiente_revision'
});

export function obtenerTiposBiblioteca() {
  return Object.values(BIBLIOTECA_CONFIG.tipos);
}
