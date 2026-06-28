/*
  Modulo: biblioteca
  Funcion: configuracion de la biblioteca general permanente y recursos temporales por proyecto.
*/

export const ALCANCES_BIBLIOTECA = Object.freeze({
  GENERAL: 'general',
  PROYECTO: 'proyecto'
});

export const ESTADOS_TECNICOS_RECURSO = Object.freeze({
  PENDIENTE: 'pendiente',
  ANALIZADO: 'analizado',
  ERROR: 'error',
  LISTO: 'listo'
});

export const TIPOS_ARCHIVO_BIBLIOTECA = Object.freeze({
  VIDEO: 'video',
  IMAGEN: 'imagen',
  AUDIO: 'audio'
});

export const FORMATOS_RECURSO_BIBLIOTECA = Object.freeze({
  HORIZONTAL: 'horizontal-16-9',
  VERTICAL: 'vertical-9-16',
  CUADRADO: 'cuadrado-1-1',
  AUDIO: 'audio',
  IMAGEN: 'imagen',
  DESCONOCIDO: 'desconocido'
});

export const EXTENSIONES_PERMITIDAS_BIBLIOTECA = Object.freeze({
  video: Object.freeze(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm']),
  imagen: Object.freeze(['.jpg', '.jpeg', '.png', '.webp', '.gif']),
  audio: Object.freeze(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'])
});

export const BIBLIOTECA_CONFIG = Object.freeze({
  version: '2.0.0-biblioteca-simple',
  carpetaRaiz: 'biblioteca',
  carpetaGeneral: 'biblioteca/general',
  carpetaArchivosGeneral: 'biblioteca/general/archivos',
  archivoIndiceGeneral: 'biblioteca-general.json',
  archivoCategoriasEditables: 'categorias-editables.json',
  archivoEstilosEditables: 'estilos-editables.json',
  carpetaProyecto: 'biblioteca-proyecto',
  carpetaArchivosProyecto: 'biblioteca-proyecto/archivos',
  archivoIndiceProyecto: 'biblioteca-proyecto.json',
  alcancePorDefecto: ALCANCES_BIBLIOTECA.GENERAL,
  estadoTecnicoPorDefecto: ESTADOS_TECNICOS_RECURSO.PENDIENTE,
  licenciaPorDefecto: 'propio',
  duplicados: Object.freeze({
    preguntar: 'preguntar',
    reemplazar: 'reemplazar',
    duplicar: 'duplicar'
  }),
  alcances: ALCANCES_BIBLIOTECA,
  estadosTecnicos: ESTADOS_TECNICOS_RECURSO,
  tipos: TIPOS_ARCHIVO_BIBLIOTECA,
  formatos: FORMATOS_RECURSO_BIBLIOTECA,
  extensionesPermitidas: EXTENSIONES_PERMITIDAS_BIBLIOTECA
});

export function obtenerTiposBiblioteca() {
  return Object.values(TIPOS_ARCHIVO_BIBLIOTECA);
}

export function obtenerFormatosBiblioteca() {
  return Object.values(FORMATOS_RECURSO_BIBLIOTECA);
}

export function obtenerExtensionesPermitidasBiblioteca() {
  return Object.values(EXTENSIONES_PERMITIDAS_BIBLIOTECA).flat();
}

export function extensionPermitidaBiblioteca(extension = '') {
  const limpia = String(extension || '').toLowerCase();
  return obtenerExtensionesPermitidasBiblioteca().includes(limpia);
}
