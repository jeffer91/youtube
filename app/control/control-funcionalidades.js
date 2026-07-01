/*
  Módulo de control de funcionalidades - AutoVideoJeff
  Función:
    - Prender o apagar pantallas, rutas y procesos sin borrar código.
    - Permitir probar el flujo por partes.
    - Estado inicial: solo Nuevo proyecto + Entendimiento + Diagnóstico básico.
*/

export const CONTROL_FUNCIONALIDADES_VERSION = '1.0.0-solo-entendimiento';

export const FUNCIONALIDADES_AUTOVIDEO = Object.freeze({
  INICIO: 'inicio',
  NUEVO_PROYECTO: 'nuevo-proyecto',
  ENTENDIMIENTO: 'entendimiento',
  BIBLIOTECA: 'biblioteca',
  PLAN_EDICION: 'plan-edicion',
  LABORATORIO_EFECTOS: 'laboratorio-efectos',
  PRODUCCION: 'produccion',
  ADAPTACION: 'adaptacion',
  RESULTADO: 'resultado',
  HISTORIAL: 'historial',
  PERFILES: 'perfiles',
  AJUSTES: 'ajustes',
  DIAGNOSTICO: 'diagnostico',
  LEGACY_COMPLETO: 'legacy-completo'
});

export const FUNCIONALIDADES_ACTIVAS = Object.freeze({
  [FUNCIONALIDADES_AUTOVIDEO.INICIO]: true,
  [FUNCIONALIDADES_AUTOVIDEO.NUEVO_PROYECTO]: true,
  [FUNCIONALIDADES_AUTOVIDEO.ENTENDIMIENTO]: true,
  [FUNCIONALIDADES_AUTOVIDEO.DIAGNOSTICO]: true,

  [FUNCIONALIDADES_AUTOVIDEO.BIBLIOTECA]: false,
  [FUNCIONALIDADES_AUTOVIDEO.PLAN_EDICION]: false,
  [FUNCIONALIDADES_AUTOVIDEO.LABORATORIO_EFECTOS]: false,
  [FUNCIONALIDADES_AUTOVIDEO.PRODUCCION]: false,
  [FUNCIONALIDADES_AUTOVIDEO.ADAPTACION]: false,
  [FUNCIONALIDADES_AUTOVIDEO.RESULTADO]: false,
  [FUNCIONALIDADES_AUTOVIDEO.HISTORIAL]: false,
  [FUNCIONALIDADES_AUTOVIDEO.PERFILES]: false,
  [FUNCIONALIDADES_AUTOVIDEO.AJUSTES]: false,
  [FUNCIONALIDADES_AUTOVIDEO.LEGACY_COMPLETO]: false
});

const ALIAS_FUNCIONALIDADES = Object.freeze({
  bibliotecaProyecto: FUNCIONALIDADES_AUTOVIDEO.BIBLIOTECA,
  'biblioteca-proyecto': FUNCIONALIDADES_AUTOVIDEO.BIBLIOTECA,
  'plan': FUNCIONALIDADES_AUTOVIDEO.PLAN_EDICION,
  'plan-edicion': FUNCIONALIDADES_AUTOVIDEO.PLAN_EDICION,
  'laboratorio': FUNCIONALIDADES_AUTOVIDEO.LABORATORIO_EFECTOS,
  'efectos': FUNCIONALIDADES_AUTOVIDEO.LABORATORIO_EFECTOS,
  'produccion-maestro': FUNCIONALIDADES_AUTOVIDEO.PRODUCCION,
  'adaptacion-plataformas': FUNCIONALIDADES_AUTOVIDEO.ADAPTACION,
  'resultado-final': FUNCIONALIDADES_AUTOVIDEO.RESULTADO,
  'procesado': FUNCIONALIDADES_AUTOVIDEO.RESULTADO,
  'legacy': FUNCIONALIDADES_AUTOVIDEO.LEGACY_COMPLETO,
  'flujo-legacy': FUNCIONALIDADES_AUTOVIDEO.LEGACY_COMPLETO
});

const RUTAS_API_SIEMPRE_PERMITIDAS = Object.freeze([
  /^\/api\/estado$/i,
  /^\/api\/diagnostico$/i,
  /^\/api\/autovideo\/control-funcionalidades$/i,
  /^\/api\/autovideo\/modulos$/i,
  /^\/api\/autovideo\/diagnostico/i
]);

const RUTAS_API_POR_FUNCIONALIDAD = Object.freeze([
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.NUEVO_PROYECTO,
    descripcion: 'Crear proyecto y subir videos originales',
    patrones: [
      /^\/api\/proyectos$/i,
      /^\/api\/proyectos\/[^/]+\/estado$/i,
      /^\/api\/proyectos\/[^/]+\/videos?$/i
    ]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.ENTENDIMIENTO,
    descripcion: 'Procesar, cargar y revisar entendimiento',
    patrones: [
      /^\/api\/proyectos\/[^/]+\/entendimiento/i,
      /^\/api\/proyectos\/[^/]+\/transcripciones/i,
      /^\/api\/autovideo\/transcripcion\/motores/i
    ]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.BIBLIOTECA,
    descripcion: 'Biblioteca general y biblioteca del proyecto',
    patrones: [/biblioteca/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.PLAN_EDICION,
    descripcion: 'Plan de edición y editor de plan',
    patrones: [/\/plan/i, /reintento\/plan/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.LABORATORIO_EFECTOS,
    descripcion: 'Laboratorio, efectos y SFX',
    patrones: [/laboratorio/i, /\/efectos/i, /\/sfx/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.PRODUCCION,
    descripcion: 'Producción maestro',
    patrones: [/\/produccion/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.ADAPTACION,
    descripcion: 'Adaptación a plataformas',
    patrones: [/\/adaptacion/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.RESULTADO,
    descripcion: 'Resultado final y exportaciones',
    patrones: [/\/resultado/i, /\/exportaciones/i, /^\/api\/procesar-video/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.HISTORIAL,
    descripcion: 'Historial y listado de proyectos legacy',
    patrones: [/^\/api\/autovideo\/proyectos$/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.PERFILES,
    descripcion: 'Perfiles editoriales',
    patrones: [/\/perfiles/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.AJUSTES,
    descripcion: 'Ajustes y pruebas de Gemini',
    patrones: [/\/gemini/i]
  },
  {
    funcionalidad: FUNCIONALIDADES_AUTOVIDEO.LEGACY_COMPLETO,
    descripcion: 'Flujo completo anterior',
    patrones: [/^\/api\/procesar-video/i]
  }
]);

export function normalizarFuncionalidad(id = '') {
  const limpio = String(id || '').trim();
  return ALIAS_FUNCIONALIDADES[limpio] || limpio;
}

export function funcionalidadActiva(id = '') {
  const funcionalidad = normalizarFuncionalidad(id);
  return Boolean(FUNCIONALIDADES_ACTIVAS[funcionalidad]);
}

export function filtrarPorFuncionalidadesActivas(items = []) {
  return items.filter((item) => funcionalidadActiva(item?.id || item?.vista || ''));
}

export function obtenerControlFuncionalidades() {
  const entradas = Object.entries(FUNCIONALIDADES_ACTIVAS).map(([id, activo]) => ({ id, activo: Boolean(activo) }));
  return {
    ok: true,
    version: CONTROL_FUNCIONALIDADES_VERSION,
    modoPrueba: 'solo-entendimiento',
    mensaje: 'Modo de prueba activo: solo se prueba Nuevo proyecto + Entendimiento. Lo demás queda apagado hasta que Jeff lo habilite.',
    funcionalidades: Object.fromEntries(entradas.map((item) => [item.id, item.activo])),
    activas: entradas.filter((item) => item.activo).map((item) => item.id),
    apagadas: entradas.filter((item) => !item.activo).map((item) => item.id)
  };
}

export function rutaApiSiemprePermitida(ruta = '') {
  return RUTAS_API_SIEMPRE_PERMITIDAS.some((patron) => patron.test(ruta));
}

export function resolverBloqueoRutaApi({ ruta = '', metodo = 'GET' } = {}) {
  const rutaLimpia = String(ruta || '').split('?')[0];
  if (!rutaLimpia.startsWith('/api/')) return null;
  if (rutaApiSiemprePermitida(rutaLimpia)) return null;

  const regla = RUTAS_API_POR_FUNCIONALIDAD.find((item) => item.patrones.some((patron) => patron.test(rutaLimpia)));
  if (!regla) return null;
  if (funcionalidadActiva(regla.funcionalidad)) return null;

  return {
    ok: false,
    bloqueada: true,
    metodo,
    ruta: rutaLimpia,
    funcionalidad: regla.funcionalidad,
    descripcion: regla.descripcion,
    mensaje: `Funcionalidad apagada desde el módulo de control: ${regla.funcionalidad}.`
  };
}
