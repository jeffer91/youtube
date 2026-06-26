/*
  Modulo: recursos-externos
  Funcion: fuentes externas permitidas para buscar recursos.
*/

export const FUENTES_RECURSOS_CONFIG = Object.freeze({
  version: '1.0.0',
  prioridad: ['biblioteca_interna', 'fuentes_libres', 'fuente_configurada'],
  fuentes: Object.freeze({
    bibliotecaInterna: Object.freeze({ id: 'biblioteca_interna', nombre: 'Biblioteca interna', licencia: 'propio' }),
    pexels: Object.freeze({ id: 'pexels', nombre: 'Pexels', licencia: 'libre', requiereApiKey: true, tipos: ['imagen', 'video'] }),
    pixabay: Object.freeze({ id: 'pixabay', nombre: 'Pixabay', licencia: 'libre', requiereApiKey: true, tipos: ['imagen', 'video'] }),
    unsplash: Object.freeze({ id: 'unsplash', nombre: 'Unsplash', licencia: 'libre', requiereApiKey: true, tipos: ['imagen'] }),
    local: Object.freeze({ id: 'local', nombre: 'Carpetas locales', licencia: 'propio', requiereApiKey: false, tipos: ['imagen', 'video', 'audio'] })
  }),
  descargarAutomatico: false,
  requiereAprobacionProduccion: true
});

export function listarFuentesRecursos() {
  return Object.values(FUENTES_RECURSOS_CONFIG.fuentes);
}
