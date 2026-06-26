/*
  Modulo: proyectos
  Funcion: configuracion base para proyectos de AutoVideoJeff.
*/

export const PROYECTOS_CONFIG = Object.freeze({
  version: '1.0.0',
  carpetaRaiz: 'salida/proyectos',
  archivoProyecto: 'proyecto.json',
  subcarpetas: Object.freeze({
    entrada: 'entrada',
    biblioteca: 'biblioteca',
    produccion: 'produccion',
    exportaciones: 'exportaciones',
    diagnostico: 'diagnostico',
    temporales: 'temporales'
  }),
  estados: Object.freeze({
    CREADO: 'creado',
    CONFIGURADO: 'configurado',
    PROCESANDO: 'procesando',
    PRODUCCION: 'produccion',
    APROBADO: 'aprobado',
    EXPORTADO: 'exportado',
    ERROR: 'error'
  }),
  modoEdicion: Object.freeze({
    AUTOMATICO_RAPIDO: 'automatico_rapido',
    REVISION_COMPLETA: 'revision_completa'
  }),
  perfilPorDefecto: 'general',
  plataformasPorDefecto: ['tiktok', 'reels', 'shorts', 'youtube']
});

export function obtenerEstadosProyecto() {
  return Object.values(PROYECTOS_CONFIG.estados);
}

export function obtenerModosEdicionProyecto() {
  return Object.values(PROYECTOS_CONFIG.modoEdicion);
}
