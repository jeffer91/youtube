import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function verificarArchivos() {
  const archivos = [
    'flujo-etapas/estado-proyecto.modelo.js',
    'flujo-etapas/estado-proyecto.service.js',
    'flujo-etapas/validar-transicion-etapa.service.js',
    'flujo-etapas/guardar-resultado-etapa.service.js',
    'flujo-etapas/cargar-resultado-etapa.service.js',
    'flujo-etapas/flujo-etapas.conexion.js',
    'docs/bloque-03-estado-proyecto-etapas.md'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos del Bloque 3: ${faltantes.join(', ')}`);
}

function verificarModelo() {
  const contenido = leer('flujo-etapas/estado-proyecto.modelo.js');
  const requeridos = [
    'ETAPAS_AUTOVIDEO',
    'ORDEN_ETAPAS_AUTOVIDEO',
    'ESTADOS_PROYECTO_ETAPAS',
    'CARPETAS_RESULTADO_ETAPA',
    'ARCHIVOS_RESULTADO_ETAPA',
    'crearEstadoProyectoEtapas',
    'nuevo-proyecto',
    'entendimiento',
    'plan-edicion',
    'produccion',
    'adaptacion-plataformas',
    'resultado'
  ];
  for (const item of requeridos) exigir(contenido.includes(item), `El modelo de estado no contiene ${item}`);
}

function verificarServicios() {
  const estado = leer('flujo-etapas/estado-proyecto.service.js');
  exigir(estado.includes('obtenerRutaEstadoProyecto'), 'Falta obtenerRutaEstadoProyecto.');
  exigir(estado.includes('cargarEstadoProyectoEtapas'), 'Falta cargarEstadoProyectoEtapas.');
  exigir(estado.includes('guardarEstadoProyectoEtapas'), 'Falta guardarEstadoProyectoEtapas.');
  exigir(estado.includes('avanzarEstadoProyectoEtapas'), 'Falta avanzarEstadoProyectoEtapas.');
  exigir(estado.includes('marcarErrorEstadoProyectoEtapas'), 'Falta marcarErrorEstadoProyectoEtapas.');

  const transicion = leer('flujo-etapas/validar-transicion-etapa.service.js');
  exigir(transicion.includes('validarTransicionEtapa'), 'Falta validarTransicionEtapa.');
  exigir(transicion.includes('exigirTransicionEtapa'), 'Falta exigirTransicionEtapa.');
  exigir(transicion.includes('salto-no-permitido'), 'No se valida salto no permitido.');

  const guardar = leer('flujo-etapas/guardar-resultado-etapa.service.js');
  exigir(guardar.includes('guardarResultadoEtapa'), 'Falta guardarResultadoEtapa.');
  exigir(guardar.includes('obtenerRutaResultadoEtapa'), 'Falta obtenerRutaResultadoEtapa.');

  const cargar = leer('flujo-etapas/cargar-resultado-etapa.service.js');
  exigir(cargar.includes('cargarResultadoEtapa'), 'Falta cargarResultadoEtapa.');
  exigir(cargar.includes('existeResultadoEtapa'), 'Falta existeResultadoEtapa.');
}

function verificarConexion() {
  const contenido = leer('flujo-etapas/flujo-etapas.conexion.js');
  const requeridos = [
    'crearEstadoProyectoEtapas',
    'validarTransicionEtapa',
    'cargarEstadoProyectoEtapas',
    'guardarEstadoProyectoEtapas',
    'avanzarEstadoProyectoEtapas',
    'guardarResultadoEtapa',
    'cargarResultadoEtapa'
  ];
  for (const item of requeridos) exigir(contenido.includes(item), `La conexión no exporta ${item}`);
}

function verificarDocumentacion() {
  const contenido = leer('docs/bloque-03-estado-proyecto-etapas.md');
  exigir(contenido.includes('Estado de proyecto por etapas'), 'La documentación no tiene título correcto.');
  exigir(contenido.includes('estado-proyecto.json'), 'La documentación no menciona estado-proyecto.json.');
  exigir(contenido.includes('siguiente_bloque: Nuevo Proyecto limpio'), 'La documentación no indica el siguiente bloque.');
}

async function verificarImportacionReal() {
  const modulo = await import('../flujo-etapas/flujo-etapas.conexion.js');
  exigir(modulo.ETAPAS_AUTOVIDEO.ENTENDIMIENTO === 'entendimiento', 'Import real: etapa entendimiento incorrecta.');
  const estado = modulo.crearEstadoProyectoEtapas({ proyectoId: 'test-bloque-03', nombre: 'Prueba' });
  exigir(estado.etapaActual === 'nuevo-proyecto', 'Import real: etapa inicial incorrecta.');
  exigir(estado.siguienteEtapa === 'entendimiento', 'Import real: siguiente etapa incorrecta.');
  const avance = modulo.validarTransicionEtapa({ etapaActual: 'nuevo-proyecto', etapaDestino: 'entendimiento' });
  exigir(avance.ok === true, 'Import real: transición válida falló.');
}

async function main() {
  verificarArchivos();
  verificarModelo();
  verificarServicios();
  verificarConexion();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 3: estado de proyecto por etapas preparado.');
}

main().catch((error) => {
  console.error('ERROR Bloque 3:', error.message);
  process.exit(1);
});
