/*
  Nombre completo: procesamiento-checklist-config.js
  Ruta: /app/procesamiento-checklist-config.js

  Función:
  - Definir las opciones visibles del checklist antes de procesar.
  - Mantener todo marcado por defecto.
  - Agrupar las funciones en acordeones simples.
*/

export const VERSION_CHECKLIST_PROCESAMIENTO = '1.0.0';

export const CLAVES_OPCIONES_PROCESAMIENTO = Object.freeze([
  'mejorarAudio',
  'transcripcion',
  'subtitulos',
  'textosFlotantes',
  'cortes',
  'zooms',
  'barraProgreso',
  'etiquetasVisuales',
  'sonidos',
  'exportacion'
]);

export const GRUPOS_CHECKLIST_PROCESAMIENTO = Object.freeze([
  {
    id: 'audio',
    titulo: 'Audio',
    abierto: true,
    items: [
      { id: 'mejorarAudio', clave: 'mejorarAudio', etiqueta: 'Mejorar audio', marcado: true }
    ]
  },
  {
    id: 'subtitulos',
    titulo: 'Subtítulos y textos',
    abierto: true,
    items: [
      { id: 'transcripcion', clave: 'transcripcion', etiqueta: 'Transcribir video', marcado: true },
      { id: 'subtitulos', clave: 'subtitulos', etiqueta: 'Generar subtítulos', marcado: true },
      { id: 'textosFlotantes', clave: 'textosFlotantes', etiqueta: 'Textos flotantes', marcado: true }
    ]
  },
  {
    id: 'edicion',
    titulo: 'Edición dinámica',
    abierto: true,
    items: [
      { id: 'cortes', clave: 'cortes', etiqueta: 'Cortes automáticos', marcado: true },
      { id: 'zooms', clave: 'zooms', etiqueta: 'Zooms y punch-in', marcado: true },
      { id: 'barraProgreso', clave: 'barraProgreso', etiqueta: 'Barra de progreso', marcado: true },
      { id: 'etiquetasVisuales', clave: 'etiquetasVisuales', etiqueta: 'Etiquetas visuales', marcado: true },
      { id: 'sonidos', clave: 'sonidos', etiqueta: 'Sonidos automáticos', marcado: true }
    ]
  },
  {
    id: 'salida',
    titulo: 'Salida final',
    abierto: true,
    items: [
      { id: 'exportacion', clave: 'exportacion', etiqueta: 'Exportar video final', marcado: true }
    ]
  }
]);

export function obtenerOpcionesChecklistPorDefecto() {
  const opciones = {};

  GRUPOS_CHECKLIST_PROCESAMIENTO.forEach((grupo) => {
    grupo.items.forEach((item) => {
      opciones[item.clave] = item.marcado === true;
    });
  });

  return opciones;
}

export function obtenerOpcionesChecklistVacias() {
  const opciones = {};

  CLAVES_OPCIONES_PROCESAMIENTO.forEach((clave) => {
    opciones[clave] = false;
  });

  return opciones;
}

export function obtenerClavesChecklistProcesamiento() {
  return [...CLAVES_OPCIONES_PROCESAMIENTO];
}

export function obtenerGruposChecklistProcesamiento() {
  return GRUPOS_CHECKLIST_PROCESAMIENTO.map((grupo) => ({
    ...grupo,
    items: grupo.items.map((item) => ({ ...item }))
  }));
}

export function resolverItemChecklistPorClave(claveBuscada) {
  if (!claveBuscada) return null;

  for (const grupo of GRUPOS_CHECKLIST_PROCESAMIENTO) {
    const encontrado = grupo.items.find((item) => item.clave === claveBuscada);

    if (encontrado) {
      return { ...encontrado, grupoId: grupo.id, grupoTitulo: grupo.titulo };
    }
  }

  return null;
}

export function obtenerEtiquetaOpcionProcesamiento(clave) {
  const item = resolverItemChecklistPorClave(clave);
  return item?.etiqueta || clave;
}

export default {
  VERSION_CHECKLIST_PROCESAMIENTO,
  CLAVES_OPCIONES_PROCESAMIENTO,
  GRUPOS_CHECKLIST_PROCESAMIENTO,
  obtenerOpcionesChecklistPorDefecto,
  obtenerOpcionesChecklistVacias,
  obtenerClavesChecklistProcesamiento,
  obtenerGruposChecklistProcesamiento,
  resolverItemChecklistPorClave,
  obtenerEtiquetaOpcionProcesamiento
};
