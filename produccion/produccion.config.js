/*
  Modulo: produccion
  Funcion: configuracion de la pantalla de Produccion.
*/

export const PRODUCCION_CONFIG = Object.freeze({
  version: '1.0.0',
  archivoPlan: 'plan-produccion.json',
  estados: Object.freeze({
    borrador: 'borrador',
    enRevision: 'en_revision',
    aprobado: 'aprobado',
    requiereCambios: 'requiere_cambios',
    listoExportar: 'listo_exportar'
  }),
  tiposElemento: Object.freeze({
    recurso: 'recurso',
    subtitulo: 'subtitulo',
    texto: 'texto',
    grafico: 'grafico',
    tabla: 'tabla',
    fondo: 'fondo',
    zoom: 'zoom',
    efecto: 'efecto',
    audio: 'audio'
  }),
  modos: Object.freeze({
    automaticoRapido: 'automatico_rapido',
    revisionCompleta: 'revision_completa'
  })
});
