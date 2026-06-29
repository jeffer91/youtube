/*
  Procesos UI - Bloque 1
  Función: mapa visual global de procesos y subprocesos de AutoVideoJeff.
  No ejecuta backend ni cambia funcionalidad; solo define estructura para ordenar pantallas.
*/

export const VERSION_PROCESOS_UI = '1.0.0';

export const ESTADOS_PROCESO_UI = Object.freeze({
  PENDIENTE: 'pendiente',
  ACTIVO: 'activo',
  COMPLETADO: 'completado',
  BLOQUEADO: 'bloqueado',
  AVANZADO: 'avanzado',
  ERROR: 'error'
});

function paso(id, titulo, descripcion = '', opciones = {}) {
  return Object.freeze({
    id,
    titulo,
    descripcion,
    tipo: opciones.tipo || 'principal',
    avanzado: Boolean(opciones.avanzado),
    requerido: opciones.requerido !== false,
    conservaFuncionalidad: true
  });
}

function proceso({ id, pantallaId = null, titulo, tipo = 'pantalla', descripcion = '', pasos = [] }) {
  return Object.freeze({
    id,
    pantallaId,
    titulo,
    tipo,
    descripcion,
    pasos: Object.freeze(pasos),
    totalPasos: pasos.length
  });
}

export const PROCESOS_VISUALES_APP = Object.freeze([
  proceso({
    id: 'inicio',
    pantallaId: 'inicio',
    titulo: 'Inicio',
    descripcion: 'Panel de accesos rápidos y estado general.',
    pasos: [
      paso('estado-general', 'Ver estado general'),
      paso('accesos-rapidos', 'Entrar al proceso necesario'),
      paso('servidor-local', 'Ver estado del servidor local'),
      paso('diagnostico-rapido', 'Acceso rápido a diagnóstico', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'nuevo-proyecto',
    pantallaId: 'nuevo-proyecto',
    titulo: 'Nuevo proyecto',
    descripcion: 'Crear proyecto, subir video y comenzar entendimiento.',
    pasos: [
      paso('nombre', 'Nombrar proyecto'),
      paso('subir-video', 'Subir video o videos'),
      paso('procesar-entendimiento', 'Procesar entendimiento'),
      paso('opciones-tecnicas', 'Opciones técnicas', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'entendimiento',
    pantallaId: 'entendimiento',
    titulo: 'Entendimiento',
    descripcion: 'Transcripción, fotogramas y análisis global.',
    pasos: [
      paso('cargar-proyecto', 'Cargar proyecto'),
      paso('procesar', 'Procesar entendimiento'),
      paso('transcripcion', 'Revisar transcripción'),
      paso('fotogramas', 'Revisar fotogramas'),
      paso('analisis-global', 'Confirmar análisis global'),
      paso('pasar-biblioteca', 'Pasar a Biblioteca'),
      paso('motores', 'Diagnóstico e instalación de motores', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'biblioteca-general',
    pantallaId: 'biblioteca',
    titulo: 'Biblioteca general',
    descripcion: 'Recursos permanentes reutilizables.',
    pasos: [
      paso('area-general', 'Elegir Biblioteca General'),
      paso('subir-archivo', 'Subir archivo permanente'),
      paso('categoria', 'Elegir categoría'),
      paso('datos-basicos', 'Completar datos necesarios'),
      paso('guardar', 'Guardar recurso'),
      paso('revisar', 'Revisar recurso guardado'),
      paso('filtros-duplicados', 'Filtros y duplicados', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'biblioteca-proyecto',
    pantallaId: 'biblioteca',
    titulo: 'Biblioteca del proyecto',
    descripcion: 'Recursos temporales del video actual.',
    pasos: [
      paso('cargar-proyecto', 'Cargar proyecto'),
      paso('elegir-archivo', 'Elegir archivo temporal'),
      paso('categoria', 'Elegir categoría'),
      paso('uso-etiquetas', 'Completar uso y etiquetas'),
      paso('guardar-temporal', 'Guardar temporal'),
      paso('revisar-recursos', 'Revisar recursos'),
      paso('ir-plan', 'Ir al Plan')
    ]
  }),
  proceso({
    id: 'plan-edicion',
    pantallaId: 'plan-edicion',
    titulo: 'Plan de edición',
    descripcion: 'Crear, revisar y aprobar el plan antes de producir.',
    pasos: [
      paso('cargar-crear', 'Cargar o crear plan'),
      paso('resumen', 'Revisar resumen ejecutivo'),
      paso('elementos', 'Revisar elementos importantes'),
      paso('timeline', 'Revisar timeline'),
      paso('aprobar', 'Aprobar plan'),
      paso('producir', 'Producir video maestro'),
      paso('detalles-tecnicos', 'Fuente, contexto IA y JSON técnico', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'laboratorio-efectos',
    pantallaId: 'laboratorio-efectos',
    titulo: 'Laboratorio de efectos',
    descripcion: 'Probar un solo efecto sin usar Producción maestro.',
    pasos: [
      paso('video-corto', 'Subir video corto'),
      paso('categoria-efecto', 'Elegir categoría de efecto'),
      paso('efecto', 'Elegir efecto'),
      paso('esperado', 'Ver qué debe salir'),
      paso('probar', 'Probar efecto'),
      paso('comparar', 'Comparar antes/después')
    ]
  }),
  proceso({
    id: 'produccion-maestro',
    pantallaId: 'produccion',
    titulo: 'Producción maestro',
    descripcion: 'Render maestro y revisión visual.',
    pasos: [
      paso('cargar-producir', 'Cargar o producir maestro'),
      paso('preview', 'Ver preview'),
      paso('comparacion', 'Comparar antes/después'),
      paso('problemas', 'Revisar problemas detectados'),
      paso('adaptacion', 'Pasar a Adaptación'),
      paso('timeline-auditoria', 'Timeline, auditoría y detalle profesional', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'adaptacion',
    pantallaId: 'adaptacion',
    titulo: 'Adaptación a plataformas',
    descripcion: 'Generar versiones por formato.',
    pasos: [
      paso('cargar-proyecto', 'Cargar proyecto'),
      paso('plataformas', 'Elegir plataformas'),
      paso('adaptar', 'Adaptar plataformas'),
      paso('revisar-versiones', 'Revisar versiones generadas'),
      paso('resultado-final', 'Preparar resultado final'),
      paso('opciones-avanzadas', 'Render base y exportaciones técnicas', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'resultado-final',
    pantallaId: 'resultado',
    titulo: 'Resultado final',
    descripcion: 'Paquete de publicación y cierre.',
    pasos: [
      paso('cargar-generar', 'Cargar o generar resultado'),
      paso('maestro', 'Revisar video maestro'),
      paso('versiones', 'Revisar versiones por plataforma'),
      paso('checklist', 'Revisar checklist'),
      paso('reporte', 'Revisar reporte y entregables')
    ]
  }),
  proceso({
    id: 'historial',
    pantallaId: 'historial',
    titulo: 'Historial',
    descripcion: 'Proyectos recientes y reapertura.',
    pasos: [
      paso('cargar', 'Cargar historial'),
      paso('revisar', 'Ver proyectos recientes'),
      paso('buscar', 'Buscar o filtrar'),
      paso('reabrir', 'Reabrir proyecto'),
      paso('metadata', 'Metadata técnica', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'perfiles',
    pantallaId: 'perfiles',
    titulo: 'Perfiles',
    descripcion: 'Estilos editoriales disponibles.',
    pasos: [
      paso('elegir', 'Elegir perfil'),
      paso('ritmo', 'Ver ritmo'),
      paso('textos', 'Ver textos'),
      paso('visual', 'Ver visual'),
      paso('uso', 'Ver uso ideal')
    ]
  }),
  proceso({
    id: 'ajustes',
    pantallaId: 'ajustes',
    titulo: 'Ajustes',
    descripcion: 'Configuración de Gemini y preferencias.',
    pasos: [
      paso('activar', 'Activar o desactivar Gemini'),
      paso('clave', 'Pegar clave API'),
      paso('modelo', 'Elegir modelo'),
      paso('parametros', 'Configurar parámetros'),
      paso('probar', 'Probar conexión'),
      paso('guardar', 'Guardar'),
      paso('guia-fallback', 'Guía fija, timeout y fallback', '', { avanzado: true })
    ]
  }),
  proceso({
    id: 'diagnostico',
    pantallaId: 'diagnostico',
    titulo: 'Diagnóstico',
    descripcion: 'Revisión de salud de la app.',
    pasos: [
      paso('rapido', 'Diagnóstico rápido'),
      paso('fuerte', 'Diagnóstico fuerte'),
      paso('auditoria', 'Auditoría integral'),
      paso('final', 'Diagnóstico final rediseño'),
      paso('detalle-tecnico', 'FFmpeg, carpetas, rutas, inputs y outputs', '', { avanzado: true })
    ]
  }),
  proceso({ id: 'servidor-api', titulo: 'Servidor local / API', tipo: 'tecnico', pasos: [paso('iniciar', 'Iniciar servidor'), paso('exports', 'Exponer exports'), paso('rutas', 'Registrar rutas'), paso('subidas', 'Manejar subidas'), paso('temporales', 'Limpiar temporales')] }),
  proceso({ id: 'proyectos', titulo: 'Proyectos', tipo: 'tecnico', pasos: [paso('crear', 'Crear proyecto'), paso('listar', 'Listar proyectos'), paso('cargar', 'Cargar proyecto'), paso('guardar', 'Guardar estado'), paso('reabrir', 'Reabrir desde historial')] }),
  proceso({ id: 'transcripcion', titulo: 'Transcripción', tipo: 'tecnico', pasos: [paso('diagnosticar', 'Diagnosticar motores'), paso('instalar', 'Guía de instalación'), paso('procesar', 'Procesar transcripción'), paso('seleccionar', 'Seleccionar principal'), paso('usar-plan', 'Pasar texto al plan')] }),
  proceso({ id: 'gemini-ia', titulo: 'Gemini / IA', tipo: 'tecnico', pasos: [paso('configurar', 'Configurar Gemini'), paso('probar', 'Probar conexión'), paso('fallback', 'Usar fallback local'), paso('contexto', 'Enviar contexto editorial'), paso('plan', 'Crear plan asistido')] }),
  proceso({ id: 'efectos-visuales', titulo: 'Efectos visuales', tipo: 'tecnico', pasos: [paso('catalogo', 'Cargar catálogo'), paso('presets', 'Cargar presets'), paso('preview', 'Previsualizar'), paso('aprendizaje', 'Registrar aprendizaje'), paso('produccion', 'Aplicar en producción')] }),
  proceso({ id: 'audio-sfx', titulo: 'Sonidos / SFX / Audio', tipo: 'tecnico', pasos: [paso('limpiar', 'Limpiar audio'), paso('sonidos', 'Agregar sonidos'), paso('volumen', 'Controlar volumen'), paso('premium', 'Previsualizar SFX premium'), paso('mezclar', 'Mezclar audio final')] }),
  proceso({ id: 'exportacion', titulo: 'Exportación / plataformas', tipo: 'tecnico', pasos: [paso('plataformas', 'Obtener plataformas'), paso('preparar', 'Preparar exportaciones'), paso('renderizar', 'Renderizar formatos'), paso('guardar', 'Guardar versiones finales')] }),
  proceso({ id: 'aprendizaje', titulo: 'Aprendizaje', tipo: 'tecnico', pasos: [paso('cargar', 'Cargar memoria'), paso('guardar', 'Guardar corrección'), paso('efectos', 'Aprendizaje de efectos'), paso('reusar', 'Usar en futuras decisiones')] }),
  proceso({ id: 'reintento', titulo: 'Reintento / recuperación', tipo: 'tecnico', pasos: [paso('detectar', 'Detectar fallo'), paso('plan', 'Crear plan de reintento'), paso('reintentar', 'Reintentar etapa'), paso('mensaje', 'Mostrar error claro'), paso('conservar', 'Conservar avance')] }),
  proceso({ id: 'auditoria', titulo: 'Auditoría', tipo: 'tecnico', pasos: [paso('integral', 'Auditoría integral'), paso('rutas', 'Auditoría de rutas'), paso('variables', 'Auditoría de variables'), paso('ui', 'Auditoría de botones, inputs y outputs')] }),
  proceso({ id: 'reportes-cierre', titulo: 'Reportes / cierre', tipo: 'tecnico', pasos: [paso('reporte', 'Crear reporte final'), paso('checklist', 'Crear checklist'), paso('entregables', 'Consolidar entregables'), paso('publicar', 'Confirmar listo para publicar')] })
]);

export const PROCESOS_POR_ID = Object.freeze(Object.fromEntries(PROCESOS_VISUALES_APP.map((item) => [item.id, item])));

export function obtenerProcesoVisual(id = '') {
  return PROCESOS_POR_ID[id] || null;
}

export function obtenerProcesosPorPantalla(pantallaId = '') {
  return PROCESOS_VISUALES_APP.filter((item) => item.pantallaId === pantallaId);
}

export function listarProcesosVisuales({ incluirTecnicos = true } = {}) {
  return PROCESOS_VISUALES_APP.filter((item) => incluirTecnicos || item.tipo !== 'tecnico');
}

export default PROCESOS_VISUALES_APP;
