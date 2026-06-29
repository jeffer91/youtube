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

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
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
  const idsRequeridos = [
    'zoom-in-centro',
    'shake-suave',
    'transicion-flash-blanco',
    'look-cine-calido',
    'titulo-centro-grande',
    'formato-viral-gancho'
  ];
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

  console.log(`OK Laboratorio de efectos catálogo: ${CATEGORIAS_LABORATORIO_EFECTOS.length} categorías, ${EFECTOS_LABORATORIO.length} efectos, acordeones listos.`);
}

main();
