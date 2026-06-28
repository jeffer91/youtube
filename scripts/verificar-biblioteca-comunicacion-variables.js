/*
  Bloque revision: comunicacion de variables de Biblioteca AutoVideoJeff
  Objetivo:
  - Verificar que los IDs de la vista sean leidos por la UI.
  - Verificar que los payloads usen las mismas variables que reciben API, servicios y modelo.
  - Verificar que proyectoId, biblioteca general, biblioteca proyecto y Plan mantengan contrato de datos.
*/

import fs from 'fs';
import { crearRecursoModelo } from '../biblioteca/biblioteca.conexion.js';

const ARCHIVOS = Object.freeze({
  vistaBiblioteca: 'app/pantallas/biblioteca.view.js',
  uiBiblioteca: 'app/biblioteca-ui.js',
  vistaProyecto: 'app/pantallas/biblioteca-proyecto.view.js',
  uiProyecto: 'app/biblioteca-proyecto-ui.js',
  uiPlan: 'app/etapas-ui/plan-edicion-ui.js',
  rutasModulares: 'server/rutas-modulares.service.js',
  rutasEtapas: 'server/rutas-etapas.service.js',
  servicioGeneral: 'biblioteca/guardar-recurso.service.js',
  servicioProyecto: 'biblioteca-proyecto/guardar-recurso-proyecto.service.js',
  modelo: 'biblioteca/recurso.modelo.js',
  resolverPlan: 'biblioteca/resolver-biblioteca-plan.service.js',
  planBackend: 'etapas/02-plan/procesar-plan-edicion.service.js',
  preload: 'preload.js',
  main: 'main.js'
});

const IDS_BIBLIOTECA_GENERAL = [
  'libraryFileInput',
  'libraryNewStyles',
  'libraryNewCategory',
  'libraryNewCustomCategory',
  'libraryNewName',
  'libraryNewType',
  'libraryNewFormat',
  'libraryNewTags',
  'libraryNewPath',
  'libraryNewOriginalName',
  'libraryNewMime',
  'libraryNewSize',
  'libraryResourcesList',
  'libraryStatus'
];

const IDS_BIBLIOTECA_PROYECTO = [
  'projectLibraryProjectId',
  'projectLibraryFileInput',
  'projectLibraryNewName',
  'projectLibraryNewCategory',
  'projectLibraryNewType',
  'projectLibraryNewFormat',
  'projectLibraryNewUsage',
  'projectLibraryNewTags',
  'projectLibraryNewPath',
  'projectLibraryNewOriginalName',
  'projectLibraryNewMime',
  'projectLibraryNewSize',
  'projectLibraryResourcesList',
  'projectLibraryCreatePlanBtn'
];

const PAYLOAD_RECURSO = [
  'nombre',
  'tipo',
  'categoria',
  'formato',
  'formatoManual',
  'etiquetas',
  'rutaOrigen',
  'ruta',
  'nombreOriginal',
  'mime',
  'pesoBytes',
  'accionDuplicado'
];

const VARIABLES_PLAN = [
  'proyectoId',
  'biblioteca',
  'recursosBiblioteca',
  'recursosBibliotecaGeneral',
  'recursosBibliotecaProyecto',
  'recursosBibliotecaDisponibles',
  'planBiblioteca'
];

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(contenido, clave) {
  return contenido.includes(clave);
}

function verificarIdVistaUI({ id, vista, ui, nombreVista, nombreUi }) {
  exigir(contiene(vista, `id="${id}"`) || contiene(vista, `id='${id}'`), `${nombreVista} no declara id ${id}`);
  exigir(contiene(ui, id), `${nombreUi} no lee/usa id ${id}`);
}

function verificarClaves(contenido, claves = [], nombre = 'archivo') {
  claves.forEach((clave) => exigir(contiene(contenido, clave), `${nombre} no contiene variable/clave requerida: ${clave}`));
}

function verificarComunicacionBibliotecaGeneral() {
  const vista = leer(ARCHIVOS.vistaBiblioteca);
  const ui = leer(ARCHIVOS.uiBiblioteca);
  const rutas = leer(ARCHIVOS.rutasModulares);
  const servicio = leer(ARCHIVOS.servicioGeneral);
  const modelo = leer(ARCHIVOS.modelo);
  const preload = leer(ARCHIVOS.preload);
  const main = leer(ARCHIVOS.main);

  IDS_BIBLIOTECA_GENERAL.forEach((id) => verificarIdVistaUI({ id, vista, ui, nombreVista: ARCHIVOS.vistaBiblioteca, nombreUi: ARCHIVOS.uiBiblioteca }));
  verificarClaves(ui, PAYLOAD_RECURSO, ARCHIVOS.uiBiblioteca);
  verificarClaves(ui, ['estilos', 'obtenerEstilosSeleccionados', '/api/autovideo/biblioteca'], ARCHIVOS.uiBiblioteca);
  verificarClaves(rutas, ['/api/autovideo/biblioteca', 'guardarRecursoBiblioteca', 'normalizarListaTexto', 'accionDuplicado'], ARCHIVOS.rutasModulares);
  verificarClaves(servicio, ['obtenerRutaOrigen', 'obtenerNombreOriginal', 'copiarArchivoBiblioteca', 'analizarRecursoGuardado', 'buscarDuplicado'], ARCHIVOS.servicioGeneral);
  verificarClaves(modelo, ['crearRecursoModelo', 'nombreOriginal', 'pesoBytes', 'rutaAbsoluta', 'rutaRelativa', 'estilos', 'formatoManual'], ARCHIVOS.modelo);
  verificarClaves(preload, ['AutoVideoJeff', 'biblioteca', 'seleccionarArchivo'], ARCHIVOS.preload);
  verificarClaves(main, ['biblioteca:seleccionarArchivo', 'obtenerMetadataArchivo', 'seleccionarArchivoBiblioteca'], ARCHIVOS.main);

  return { ids: IDS_BIBLIOTECA_GENERAL.length, payload: PAYLOAD_RECURSO.length };
}

function verificarComunicacionBibliotecaProyecto() {
  const vista = leer(ARCHIVOS.vistaProyecto);
  const ui = leer(ARCHIVOS.uiProyecto);
  const rutas = leer(ARCHIVOS.rutasEtapas);
  const servicio = leer(ARCHIVOS.servicioProyecto);
  const modelo = leer(ARCHIVOS.modelo);

  IDS_BIBLIOTECA_PROYECTO.forEach((id) => verificarIdVistaUI({ id, vista, ui, nombreVista: ARCHIVOS.vistaProyecto, nombreUi: ARCHIVOS.uiProyecto }));
  verificarClaves(ui, PAYLOAD_RECURSO, ARCHIVOS.uiProyecto);
  verificarClaves(ui, ['STORAGE_PROYECTO_ETAPAS', 'autovideojeff.proyectoEtapasId', '/biblioteca-proyecto', 'proyectoId'], ARCHIVOS.uiProyecto);
  verificarClaves(rutas, ['cargarEstadoBibliotecaProyecto', 'guardarBibliotecaProyecto', 'habilitada', 'proyectoId', '/api/proyectos/:proyectoId/biblioteca-proyecto'], ARCHIVOS.rutasEtapas);
  verificarClaves(servicio, ['guardarRecursoProyecto', 'proyectoId', 'estadoUso', 'permanente: false', 'analizarRecursoTemporal'], ARCHIVOS.servicioProyecto);
  verificarClaves(modelo, ['proyectoId', 'alcance', 'permanente', 'usoSugerido', 'estadoUso'], ARCHIVOS.modelo);

  return { ids: IDS_BIBLIOTECA_PROYECTO.length, payload: PAYLOAD_RECURSO.length };
}

function verificarComunicacionPlan() {
  const planBackend = leer(ARCHIVOS.planBackend);
  const resolver = leer(ARCHIVOS.resolverPlan);
  const planUi = leer(ARCHIVOS.uiPlan);
  const proyectoUi = leer(ARCHIVOS.uiProyecto);

  verificarClaves(planBackend, ['resolverBibliotecaParaPlan', 'biblioteca', 'recursosBibliotecaGeneral', 'recursosBibliotecaProyecto', 'recursosBibliotecaDisponibles'], ARCHIVOS.planBackend);
  verificarClaves(resolver, ['resolverBibliotecaParaPlan', 'crearProyectoBibliotecaPlan', 'alcanceBiblioteca', 'bibliotecaOrigen', 'recursosPlan', 'totalProyecto', 'totalGeneral'], ARCHIVOS.resolverPlan);
  verificarClaves(planUi, VARIABLES_PLAN, ARCHIVOS.uiPlan);
  verificarClaves(planUi, ['obtenerBiblioteca', 'renderFuente', 'datos?.biblioteca', 'Biblioteca general', 'Biblioteca proyecto'], ARCHIVOS.uiPlan);
  verificarClaves(proyectoUi, ['irAPlan', 'planProyectoId', 'planCargarBtn'], ARCHIVOS.uiProyecto);

  return { variables: VARIABLES_PLAN.length };
}

function verificarContratoModelo() {
  const recursoGeneral = crearRecursoModelo({
    nombre: 'Variable test general',
    tipo: 'imagen',
    categoria: 'logo',
    estilos: ['11-contra-11'],
    formato: 'imagen',
    formatoManual: true,
    etiquetas: ['variable', 'general'],
    ruta: 'D:/AutoVideoJeff/datos/biblioteca/general/archivos/logo.png',
    nombreOriginal: 'logo.png',
    mime: 'image/png',
    pesoBytes: 123,
    alcance: 'general',
    usoSugerido: 'marca visual permanente'
  });

  exigir(recursoGeneral.nombre === 'Variable test general', 'Modelo no conserva nombre general.');
  exigir(recursoGeneral.tipo === 'imagen', 'Modelo no conserva tipo general.');
  exigir(recursoGeneral.categoria === 'logo', 'Modelo no conserva categoria general.');
  exigir(recursoGeneral.estilos.includes('11-contra-11'), 'Modelo no conserva estilos general.');
  exigir(recursoGeneral.permanente === true, 'Modelo general debe ser permanente.');
  exigir(recursoGeneral.archivo.nombreOriginal === 'logo.png', 'Modelo no conserva nombreOriginal general.');
  exigir(recursoGeneral.archivo.pesoBytes === 123, 'Modelo no conserva pesoBytes general.');

  const recursoProyecto = crearRecursoModelo({
    nombre: 'Variable test proyecto',
    tipo: 'audio',
    categoria: 'musica',
    estilos: ['11-contra-11'],
    formato: 'audio',
    formatoManual: true,
    etiquetas: ['variable', 'proyecto'],
    ruta: 'D:/AutoVideoJeff/datos/proyectos/p1/biblioteca-proyecto/archivos/audio.mp3',
    nombreOriginal: 'audio.mp3',
    mime: 'audio/mpeg',
    pesoBytes: 456,
    alcance: 'proyecto',
    proyectoId: 'p1',
    permanente: false,
    estadoUso: 'sugerido',
    usoSugerido: 'música temporal del proyecto'
  });

  exigir(recursoProyecto.proyectoId === 'p1', 'Modelo no conserva proyectoId.');
  exigir(recursoProyecto.alcance === 'proyecto', 'Modelo no conserva alcance proyecto.');
  exigir(recursoProyecto.permanente === false, 'Modelo proyecto no debe ser permanente.');
  exigir(recursoProyecto.estadoUso === 'sugerido', 'Modelo no conserva estadoUso.');
  exigir(recursoProyecto.archivo.nombreOriginal === 'audio.mp3', 'Modelo no conserva nombreOriginal proyecto.');

  return { contratos: 2 };
}

function verificarEndpointsSinDuplicidad() {
  const rutasModulares = leer(ARCHIVOS.rutasModulares);
  const rutasEtapas = leer(ARCHIVOS.rutasEtapas);
  const endpoints = [
    '/api/autovideo/biblioteca',
    '/api/autovideo/biblioteca/estilos',
    '/api/autovideo/biblioteca/categorias',
    '/api/proyectos/:proyectoId/biblioteca-proyecto',
    '/api/proyectos/:proyectoId/plan/procesar'
  ];

  verificarClaves(`${rutasModulares}\n${rutasEtapas}`, endpoints, 'rutas API biblioteca/plan');
  exigir(!rutasEtapas.includes('/api/proyectos/:proyectoId/biblioteca/recomendar'), 'La recomendacion debe quedarse en rutas modulares, no duplicarse en etapas.');
  return { endpoints: endpoints.length };
}

async function main() {
  console.log('Iniciando revision de comunicacion de variables de Biblioteca...');

  const general = verificarComunicacionBibliotecaGeneral();
  const proyecto = verificarComunicacionBibliotecaProyecto();
  const plan = verificarComunicacionPlan();
  const modelo = verificarContratoModelo();
  const endpoints = verificarEndpointsSinDuplicidad();

  const resumen = {
    ok: true,
    general,
    proyecto,
    plan,
    modelo,
    endpoints,
    mensaje: 'Comunicacion de variables verificada: UI, API, servicios, modelo, biblioteca proyecto y Plan usan el mismo contrato de datos.'
  };

  console.log('OK comunicacion variables biblioteca:', resumen);
}

main().catch((error) => {
  console.error('ERROR comunicacion variables biblioteca:', error.message);
  process.exit(1);
});
