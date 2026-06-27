/*
  Modulo: produccion
  Funcion: configuracion de la pantalla de Produccion.
*/

export const PRODUCCION_CONFIG = Object.freeze({
  version: '1.1.0',
  archivoPlan: 'plan-produccion.json',
  estados: Object.freeze({
    borrador: 'borrador',
    enRevision: 'en_revision',
    aprobado: 'aprobado',
    requiereCambios: 'requiere_cambios',
    listoExportar: 'listo_exportar',
    noUsar: 'no_usar',
    reemplazado: 'reemplazado'
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
    animacion: 'animacion',
    imagen: 'imagen',
    audio: 'audio'
  }),
  pistasLineaTiempo: Object.freeze({
    subtitulos: 'subtitulos',
    textos: 'textos-y-titulos',
    imagenes: 'imagenes-y-recursos',
    animaciones: 'animaciones',
    efectos: 'efectos-visuales',
    audio: 'audio',
    otros: 'otros'
  }),
  modos: Object.freeze({
    automaticoRapido: 'automatico_rapido',
    revisionCompleta: 'revision_completa'
  })
});
