import fs from 'fs';
import path from 'path';
import {
  VERSION_CATALOGO_EFECTOS_LAB,
  CATEGORIAS_LABORATORIO_EFECTOS,
  EFECTOS_LABORATORIO,
  listarCategoriasEfectosLab,
  listarEfectosLab,
  obtenerEfectoLabPorId,
  listarEfectosLabPorCategoria,
  construirAcordeonesEfectosLab,
  validarEfectoLab,
  crearRespuestaCatalogoEfectosLab
} from '../laboratorio-efectos/catalogo-efectos-lab.js';
import { VERSION_FILTROS_FFMPEG_LAB, construirFiltroFfmpegLaboratorio } from '../laboratorio-efectos/filtros-ffmpeg-lab.service.js';
import { VERSION_RENDER_LABORATORIO_EFECTOS, construirComandoFfmpegLaboratorio, prepararPruebaEfectoLaboratorio } from '../laboratorio-efectos/renderizar-efecto-lab.service.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(ruta, claves) {
  const contenido = leer(ruta);
  for (const clave of claves) exigir(contenido.includes(clave), `${ruta} no contiene ${clave}`);
  return contenido;
}

function verificarCategoria(categoria) {
  exigir(categoria.id, 'Hay una categoría sin id.');
  exigir(categoria.nombre, `La categoría ${categoria.id} no tiene nombre.`);
  exigir(categoria.descripcion, `La categoría ${categoria.id} no tiene descripción.`);
  exigir(Number.isFinite(Number(categoria.orden)), `La categoría ${categoria.id} no tiene orden numérico.`);
}

function verificarEfecto(efecto) {
  const requeridos = ['id', 'categoriaId', 'nombre', 'descripcion', 'queDebeSalir', 'tipoRender', 'intensidadBase'];
  for (const campo of requeridos) exigir(String(efecto[campo] || '').trim(), `El efecto ${efecto.id || 'sin-id'} no tiene ${campo}.`);
  exigir(typeof efecto.compatibleFfmpeg === 'boolean', `El efecto ${efecto.id} debe indicar compatibleFfmpeg.`);
  exigir(typeof efecto.requiereTexto === 'boolean', `El efecto ${efecto.id} debe indicar requiereTexto.`);
  exigir(Number(efecto.duracionSugeridaSegundos) >= 8, `El efecto ${efecto.id} debe estar pensado para video corto de al menos 8 segundos.`);
  exigir(Number.isFinite(Number(efecto.segundoInicioPrueba)), `El efecto ${efecto.id} debe tener segundoInicioPrueba.`);
  exigir(efecto.parametros && typeof efecto.parametros === 'object', `El efecto ${efecto.id} debe tener parámetros.`);
  exigir(Array.isArray(efecto.tags) && efecto.tags.length >= 2, `El efecto ${efecto.id} debe tener tags.`);
  exigir(validarEfectoLab(efecto).ok, `El validador rechazó ${efecto.id}.`);
}

function verificarUnicos() {
  const idsCategorias = new Set();
  for (const categoria of CATEGORIAS_LABORATORIO_EFECTOS) {
    exigir(!idsCategorias.has(categoria.id), `Categoría duplicada: ${categoria.id}`);
    idsCategorias.add(categoria.id);
  }

  const idsEfectos = new Set();
  for (const efecto of EFECTOS_LABORATORIO) {
    exigir(!idsEfectos.has(efecto.id), `Efecto duplicado: ${efecto.id}`);
    idsEfectos.add(efecto.id);
    exigir(idsCategorias.has(efecto.categoriaId), `El efecto ${efecto.id} apunta a una categoría inexistente: ${efecto.categoriaId}`);
  }
}

function verificarAcordeones() {
  const acordeones = construirAcordeonesEfectosLab();
  exigir(acordeones.length >= 7, 'Deben existir al menos 7 acordeones de efectos.');
  for (const acordeon of acordeones) {
    exigir(acordeon.totalEfectos >= 5, `El acordeón ${acordeon.id} debe tener al menos 5 efectos.`);
    exigir(Array.isArray(acordeon.efectos), `El acordeón ${acordeon.id} no trae lista de efectos.`);
  }
}

function verificarBusquedas() {
  const idsRequeridos = ['zoom-in-centro', 'shake-suave', 'transicion-flash-blanco', 'look-cine-calido', 'titulo-centro-grande', 'formato-viral-gancho'];
  for (const id of idsRequeridos) exigir(obtenerEfectoLabPorId(id)?.id === id, `No se puede buscar el efecto ${id}.`);
  exigir(listarEfectosLabPorCategoria('zooms').length >= 5, 'La categoría zooms no devuelve suficientes efectos.');
  exigir(listarCategoriasEfectosLab()[0].id === 'zooms', 'Las categorías no están ordenadas desde zooms.');
  exigir(listarEfectosLab().length === EFECTOS_LABORATORIO.length, 'listarEfectosLab no devuelve todo el catálogo.');
}

function verificarRespuestaApi() {
  const respuesta = crearRespuestaCatalogoEfectosLab();
  exigir(respuesta.ok === true, 'La respuesta de catálogo no quedó ok.');
  exigir(respuesta.version === VERSION_CATALOGO_EFECTOS_LAB, 'La respuesta de catálogo no conserva versión.');
  exigir(respuesta.totalCategorias === CATEGORIAS_LABORATORIO_EFECTOS.length, 'totalCategorias incorrecto.');
  exigir(respuesta.totalEfectos === EFECTOS_LABORATORIO.length, 'totalEfectos incorrecto.');
  exigir(Array.isArray(respuesta.acordeones) && respuesta.acordeones.length >= 7, 'La respuesta no trae acordeones suficientes.');
}

function verificarFiltrosFfmpeg() {
  exigir(VERSION_FILTROS_FFMPEG_LAB, 'Falta versión de filtros FFmpeg del laboratorio.');
  for (const efecto of EFECTOS_LABORATORIO) {
    const filtro = construirFiltroFfmpegLaboratorio({ efectoId: efecto.id, textoPersonalizado: efecto.textoPrueba || 'PRUEBA', intensidad: efecto.intensidadBase });
    exigir(filtro.ok === true, `Filtro ${efecto.id} no quedó ok.`);
    exigir(filtro.filtroVideo.includes('format=yuv420p'), `Filtro ${efecto.id} no normaliza formato.`);
    exigir(filtro.filtroVideo.length > 20, `Filtro ${efecto.id} parece vacío.`);
    exigir(!filtro.filtroVideo.includes('undefined'), `Filtro ${efecto.id} contiene undefined.`);
    exigir(!filtro.filtroVideo.includes('null'), `Filtro ${efecto.id} contiene null.`);
    exigir(filtro.queDebeSalir === efecto.queDebeSalir, `Filtro ${efecto.id} no conserva explicación esperada.`);
  }
}

function verificarMotorRender() {
  exigir(VERSION_RENDER_LABORATORIO_EFECTOS, 'Falta versión de render del laboratorio.');
  const carpetaSalida = path.join(process.cwd(), 'tmp-lab-check');
  const preparacion = prepararPruebaEfectoLaboratorio({
    rutaVideo: path.join(process.cwd(), 'video-prueba.mp4'),
    carpetaSalida,
    efectoId: 'shake-suave',
    textoPersonalizado: 'PRUEBA',
    intensidad: 'normal',
    marcaEjecucion: 'check'
  });
  exigir(preparacion.ok === true, 'La preparación del laboratorio no quedó ok.');
  exigir(preparacion.nombreSalida.includes('lab-shake-suave-check.mp4'), 'Nombre de salida del laboratorio no es estable.');
  exigir(preparacion.comando.includes('-vf'), 'Comando FFmpeg no incluye filtro de video.');
  exigir(preparacion.comando.includes('-shortest'), 'Comando FFmpeg no protege duración.');

  const comando = construirComandoFfmpegLaboratorio({ rutaVideo: 'entrada.mp4', rutaSalida: 'salida.mp4', filtroVideo: 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p' });
  exigir(comando[0] === '-y', 'Comando FFmpeg debe sobrescribir salida temporal.');
  exigir(comando.includes('libx264'), 'Comando FFmpeg debe exportar H264.');
  exigir(comando[comando.length - 1] === 'salida.mp4', 'Comando FFmpeg no termina con la salida.');
}

function verificarRutasApi() {
  const rutas = leer('server/rutas-laboratorio-efectos.service.js');
  const modulares = leer('server/rutas-modulares.service.js');
  exigir(rutas.includes('registrarRutasLaboratorioEfectos'), 'Falta función registrarRutasLaboratorioEfectos.');
  exigir(rutas.includes("/api/laboratorio-efectos/catalogo"), 'Falta endpoint catálogo laboratorio.');
  exigir(rutas.includes("/api/laboratorio-efectos/efectos/:efectoId"), 'Falta endpoint detalle de efecto.');
  exigir(rutas.includes("/api/laboratorio-efectos/preparar"), 'Falta endpoint preparar efecto.');
  exigir(rutas.includes("/api/laboratorio-efectos/probar"), 'Falta endpoint probar efecto.');
  exigir(rutas.includes("upload.single('video')"), 'La ruta probar debe recibir archivo video.');
  exigir(rutas.includes('renderizarEfectoLaboratorio'), 'La ruta probar no conecta con motor de render.');
  exigir(rutas.includes('/exports/laboratorio-efectos/'), 'La ruta no devuelve URL pública de exports.');
  exigir(modulares.includes('registrarRutasLaboratorioEfectos(app, opciones)'), 'Rutas modulares no registran laboratorio.');
  exigir(modulares.includes('laboratorio-efectos'), 'El módulo laboratorio-efectos no aparece registrado.');
}

function verificarUiLaboratorio() {
  contiene('app/pantallas/laboratorio-efectos.view.js', [
    'renderLaboratorioEfectosView',
    'data-lab-efectos-root',
    'labEfectosVideoInput',
    'labEfectosPreviewEntradaVideo',
    'labEfectosDuracionEntrada',
    'labEfectosAcordeones',
    'labEfectosQueDebeSalir',
    'labEfectosChecklist',
    'labEfectosProbarBtn',
    'labEfectosComparacionOriginal',
    'labEfectosResultadoVideo',
    'Comparación antes/después'
  ]);
  contiene('app/laboratorio-efectos-ui.js', [
    'inicializarLaboratorioEfectosUI',
    '/api/laboratorio-efectos/catalogo',
    '/api/laboratorio-efectos/probar',
    'FormData',
    "formData.append('video'",
    'seleccionarEfecto',
    'renderCatalogo',
    'urlPublica',
    'urlObjetoEntrada',
    'actualizarArchivoSeleccionado',
    'evaluarDuracionEntrada',
    'formatearDuracion',
    'labEfectosComparacionOriginal',
    'crearChecklistEfecto',
    'liberarUrlEntrada'
  ]);
  contiene('app/laboratorio-efectos.css', [
    '.lab-effects-screen',
    '.lab-effects-layout',
    '.lab-effects-accordion',
    '.lab-effects-effect-card',
    '.lab-effects-video',
    '.lab-effects-mini-preview',
    '.lab-effects-duration-hint',
    '.lab-effects-checklist',
    '.lab-effects-compare',
    '.lab-effects-compare-item'
  ]);
  contiene('app/pantallas/pantallas.conexion.js', ['renderLaboratorioEfectosView']);
  contiene('app/navegacion/menu.config.js', ['laboratorio-efectos', 'Laboratorio']);
  contiene('app/navegacion/navegacion.service.js', ['renderLaboratorioEfectosView', 'inicializarLaboratorioEfectosUI', "'laboratorio-efectos': renderLaboratorioEfectosView"]);
}

function verificarIntegracionNavegacion() {
  contiene('app/pantallas/inicio.view.js', [
    'data-pantalla-destino="laboratorio-efectos"',
    'Laboratorio de efectos',
    'Probar un solo efecto en un clip corto',
    'Prueba rápida disponible'
  ]);
  contiene('app/navegacion/submenus.service.js', [
    "'laboratorio-efectos'",
    'Video corto',
    'Catálogo',
    'Antes/después',
    'data-submenu'
  ]);
  const menu = leer('app/navegacion/menu.config.js');
  const indicePlan = menu.indexOf("id: 'plan-edicion'");
  const indiceLab = menu.indexOf("id: 'laboratorio-efectos'");
  const indiceProduccion = menu.indexOf("id: 'produccion'");
  exigir(indicePlan >= 0 && indiceLab > indicePlan && indiceProduccion > indiceLab, 'Laboratorio debe quedar entre Plan de edición y Producción maestro.');
}

function main() {
  exigir(VERSION_CATALOGO_EFECTOS_LAB, 'Falta versión de catálogo.');
  exigir(CATEGORIAS_LABORATORIO_EFECTOS.length >= 7, 'Faltan categorías base del laboratorio.');
  exigir(EFECTOS_LABORATORIO.length >= 35, 'El catálogo debe tener al menos 35 efectos para probar.');

  CATEGORIAS_LABORATORIO_EFECTOS.forEach(verificarCategoria);
  EFECTOS_LABORATORIO.forEach(verificarEfecto);
  verificarUnicos();
  verificarAcordeones();
  verificarBusquedas();
  verificarRespuestaApi();
  verificarFiltrosFfmpeg();
  verificarMotorRender();
  verificarRutasApi();
  verificarUiLaboratorio();
  verificarIntegracionNavegacion();

  console.log(`OK Laboratorio de efectos: ${CATEGORIAS_LABORATORIO_EFECTOS.length} categorías, ${EFECTOS_LABORATORIO.length} efectos, filtros FFmpeg, motor render, rutas API, pantalla UI, comparación e integración de navegación listos.`);
}

main();
