import { inicializarGeminiPopup, obtenerConfiguracionGemini, bloquearControlesGemini } from './gemini-popup.js';
import { inicializarTranscripcionUI, obtenerOpcionesTranscripcion, bloquearControlesTranscripcion } from './transcripcion-ui.js';
import { obtenerResumenAudio, obtenerResumenTranscripcion } from './resultado-resumen.js';
import { obtenerResumenEdicionDinamica } from './resultado-edicion-dinamica.js';
import { mostrarResumenEfectosUI } from './resultado-efectos-ui.js';
import { actualizarEstadoDiagnosticoEnServidor } from './diagnostico-ui.js';
import { validarVideoSeleccionado } from './validar-formulario.js';
import { obtenerOpcionesEdicionAutomatica, aplicarModoAutomaticoVisual } from './edicion-automatica-ui.js';
import { inicializarModalErrorEdicion, mostrarModalErrorEdicion } from './error-modal.js';
import { prepararProgresoReal, conectarProgresoReal, actualizarProgresoReal } from './progreso-real-ui.js';
import { limpiarResultadoPlataformasUI, mostrarResultadoPlataformasUI } from './resultado-plataformas-ui.js';
import { inicializarConfiguracionProyectoUI, aplicarOpcionesProyectoAFormulario, bloquearControlesConfiguracionProyecto } from './configuracion-proyecto-ui.js';
import { inicializarHistorialProyectosUI, recargarHistorialProyectosUI } from './historial-proyectos-ui.js';
import { inicializarProduccionRevisionUI, guardarUltimaProduccion } from './produccion-revision-ui.js';
import { inicializarBibliotecaUI } from './biblioteca-ui.js';
import { inicializarEfectosUI, obtenerOpcionesEfectos, bloquearControlesEfectos } from './efectos-ui.js';
import { cambiarPantalla } from './navegacion/navegacion.service.js';

const PANTALLA_PROCESADOR = 'nuevo-proyecto';
const PANTALLA_ENTENDIMIENTO = 'entendimiento';
const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

const elementos = {
  serverStatus: document.getElementById('serverStatus'),
  videoForm: document.getElementById('videoForm'),
  projectNameInput: document.getElementById('projectNameInput'),
  videoInput: document.getElementById('videoInput'),
  fileName: document.getElementById('fileName'),
  processButton: document.getElementById('processButton'),
  progressArea: document.getElementById('progressArea'),
  progressText: document.getElementById('progressText'),
  progressTitle: document.getElementById('progressTitle'),
  progressPercent: document.getElementById('progressPercent'),
  progressBar: document.getElementById('progressBar'),
  progressHistory: document.getElementById('progressHistory'),
  messageBox: document.getElementById('messageBox'),
  resultPanel: document.getElementById('resultPanel'),
  resultVideo: document.getElementById('resultVideo'),
  downloadLink: document.getElementById('downloadLink'),
  improveAudio: document.getElementById('improveAudio'),
  audioMode: document.getElementById('audioMode'),
  platformInput: document.getElementById('platformInput'),
  modeInput: document.getElementById('modeInput'),
  editingSummary: document.getElementById('editingSummary'),
  audioSummary: document.getElementById('audioSummary'),
  transcriptionSummary: document.getElementById('transcriptionSummary'),
  modularSummary: document.getElementById('modularSummary'),
  productionSummary: document.getElementById('productionSummary'),
  resultPlatformsPanel: document.getElementById('resultPlatformsPanel'),
  resultPlatformsSummary: document.getElementById('resultPlatformsSummary'),
  resultPlatformsList: document.getElementById('resultPlatformsList'),
  beforeAfterPanel: document.getElementById('beforeAfterPanel'),
  beforeAfterSummary: document.getElementById('beforeAfterSummary'),
  beforeVideo: document.getElementById('beforeVideo'),
  afterVideo: document.getElementById('afterVideo')
};

let apiBaseCache = null;
let controladorProgreso = null;
let procesandoVideo = false;
let servidorVerificado = false;

function validarElementosRequeridos() {
  const faltantes = Object.entries(elementos).filter(([, valor]) => !valor).map(([nombre]) => nombre);
  if (faltantes.length > 0) {
    console.error('Faltan elementos de la interfaz:', faltantes);
    return false;
  }
  return true;
}

function esPantallaProcesadorActiva(pantallaId = document.body.dataset.pantallaActiva) {
  return pantallaId === PANTALLA_PROCESADOR;
}

function cerrarProgresoActual() {
  if (controladorProgreso?.cerrar) controladorProgreso.cerrar();
  controladorProgreso = null;
}

function mostrarMensaje(mensaje, tipo = 'normal') {
  elementos.messageBox.hidden = false;
  elementos.messageBox.textContent = mensaje;
  elementos.messageBox.className = `message-box message-box--${tipo}`;
}

function ocultarMensaje() {
  elementos.messageBox.hidden = true;
  elementos.messageBox.textContent = '';
  elementos.messageBox.className = 'message-box';
}

function ocultarProgreso() {
  cerrarProgresoActual();
  elementos.progressArea.hidden = true;
  elementos.progressText.textContent = '';
}

function limpiarVideo(video) {
  video.hidden = true;
  video.removeAttribute('src');
  video.load();
}

function limpiarComparacionNuevoProyecto() {
  limpiarVideo(elementos.beforeVideo);
  limpiarVideo(elementos.afterVideo);
  elementos.beforeAfterPanel.hidden = true;
  elementos.beforeAfterSummary.textContent = '';
}

function reiniciarResultado() {
  elementos.resultPanel.hidden = true;
  limpiarVideo(elementos.resultVideo);
  limpiarComparacionNuevoProyecto();
  elementos.downloadLink.hidden = true;
  elementos.downloadLink.removeAttribute('href');
  elementos.editingSummary.hidden = true;
  elementos.editingSummary.textContent = '';
  elementos.audioSummary.hidden = true;
  elementos.audioSummary.textContent = '';
  elementos.transcriptionSummary.hidden = true;
  elementos.transcriptionSummary.textContent = '';
  elementos.modularSummary.hidden = true;
  elementos.modularSummary.textContent = '';
  elementos.productionSummary.hidden = true;
  elementos.productionSummary.textContent = '';
  limpiarResultadoPlataformasUI(elementos);
}

function aplicarEstadoControlesProcesador() {
  const activo = esPantallaProcesadorActiva();
  const bloquearBase = procesandoVideo || !activo;
  elementos.processButton.disabled = bloquearBase;
  elementos.videoInput.disabled = bloquearBase;
  elementos.projectNameInput.disabled = bloquearBase;
  elementos.improveAudio.disabled = bloquearBase;
  elementos.audioMode.disabled = bloquearBase || !elementos.improveAudio.checked;
  bloquearControlesTranscripcion(bloquearBase);
  bloquearControlesGemini(bloquearBase);
  bloquearControlesConfiguracionProyecto(bloquearBase);
  bloquearControlesEfectos(bloquearBase);
  elementos.processButton.textContent = procesandoVideo ? 'Procesando entendimiento...' : 'Procesar entendimiento';
}

function bloquearFormulario(bloquear) {
  procesandoVideo = Boolean(bloquear);
  aplicarEstadoControlesProcesador();
}

async function obtenerBaseApi() {
  if (apiBaseCache) return apiBaseCache;
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) {
        apiBaseCache = estado.url;
        return apiBaseCache;
      }
    } catch (error) {
      console.warn('No se pudo leer estado desde Electron:', error);
    }
  }
  apiBaseCache = window.location.origin;
  return apiBaseCache;
}

async function crearUrlApi(ruta) {
  const base = await obtenerBaseApi();
  return `${base}${ruta}`;
}

async function crearUrlPublica(ruta) {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = await obtenerBaseApi();
  const rutaNormalizada = ruta.startsWith('/') ? ruta : `/${ruta}`;
  return `${base}${rutaNormalizada}`;
}

function navegarAEntendimientoDespuesDeProcesar(proyectoId) {
  const contenedorMenu = document.getElementById('mainNavigation');
  const contenedorVista = document.getElementById('pantallaDinamica');
  if (!contenedorMenu || !contenedorVista) return false;
  cambiarPantalla({ pantallaId: PANTALLA_ENTENDIMIENTO, contenedorMenu, contenedorVista });
  setTimeout(() => {
    const input = document.getElementById('entendimientoProyectoId');
    if (input) input.value = proyectoId;
    document.getElementById('entendimientoCargarBtn')?.click();
  }, 120);
  return true;
}

async function leerRespuestaJsonSegura(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch (_error) {
    return { ok: false, mensaje: texto };
  }
}

async function apiJson(ruta, opciones = {}) {
  const respuesta = await fetch(await crearUrlApi(ruta), opciones);
  const datos = await leerRespuestaJsonSegura(respuesta);
  if (!respuesta.ok || datos.ok === false) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
  return datos;
}

function actualizarEstadoServidor(ok, mensaje) {
  elementos.serverStatus.textContent = mensaje;
  elementos.serverStatus.className = ok ? 'server-status server-status--ok' : 'server-status server-status--error';
}

async function verificarServidor() {
  try {
    const respuesta = await fetch(await crearUrlApi('/api/estado'), { method: 'GET' });
    const datos = await leerRespuestaJsonSegura(respuesta);
    if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'Servidor no disponible.');
    actualizarEstadoDiagnosticoEnServidor(elementos.serverStatus, datos);
    servidorVerificado = true;
  } catch (error) {
    actualizarEstadoServidor(false, 'Servidor no disponible');
    servidorVerificado = false;
    if (esPantallaProcesadorActiva()) mostrarMensaje(`No se pudo conectar con el servidor local: ${error.message}`, 'error');
  }
}

function describirArchivosSeleccionados(archivos) {
  if (!archivos.length) return 'Ningún video seleccionado.';
  if (archivos.length === 1) {
    const pesoMb = archivos[0].size / (1024 * 1024);
    return `${archivos[0].name} · ${pesoMb.toFixed(1)} MB`;
  }
  const pesoTotalMb = archivos.reduce((total, archivo) => total + archivo.size, 0) / (1024 * 1024);
  const nombres = archivos.slice(0, 3).map((archivo) => archivo.name).join(', ');
  const extra = archivos.length > 3 ? ` y ${archivos.length - 3} más` : '';
  return `${archivos.length} videos · ${pesoTotalMb.toFixed(1)} MB · ${nombres}${extra}`;
}

function registrarCambioDeArchivo() {
  if (!esPantallaProcesadorActiva()) return;
  ocultarMensaje();
  ocultarProgreso();
  reiniciarResultado();
  const archivos = [...(elementos.videoInput.files || [])];
  elementos.fileName.textContent = describirArchivosSeleccionados(archivos);
  if (!archivos.length) return;
  mostrarMensaje(`${archivos.length} video(s) seleccionado(s). Presiona Procesar entendimiento.`, 'normal');
}

function agregarOpcionesAFormulario(formulario, opciones) {
  Object.entries(opciones).forEach(([clave, valor]) => formulario.append(clave, valor ?? ''));
}

function obtenerNombreProyectoSeguro(archivo) {
  const escrito = elementos.projectNameInput.value.trim();
  if (escrito) return escrito;
  return archivo?.name?.replace(/\.[^.]+$/, '') || 'Proyecto AutoVideoJeff';
}

function obtenerPlataformasSeleccionadas() {
  const seleccionadas = [...document.querySelectorAll('[data-platform-option]')]
    .filter((item) => item.checked)
    .map((item) => item.value)
    .filter(Boolean);
  return seleccionadas.length ? seleccionadas : ['tiktok', 'reels', 'shorts', 'youtube'];
}

function obtenerValor(id, respaldo = '') {
  return document.getElementById(id)?.value || respaldo;
}

function crearPayloadProyectoEtapas(archivos = []) {
  const archivo = archivos[0];
  const nombre = obtenerNombreProyectoSeguro(archivo);
  const plataforma = elementos.platformInput.value || 'tiktok';
  return {
    nombre,
    nombreProyecto: nombre,
    perfil: obtenerValor('profileSelect', 'general'),
    plataforma,
    plataformas: obtenerPlataformasSeleccionadas(),
    modoEdicion: obtenerValor('editModeSelect', 'revision_completa'),
    cantidadVideosProyecto: archivos.length || 1,
    videosSeleccionados: archivos.map((item) => ({ nombre: item.name, tamano: item.size, tipo: item.type || 'video' })),
    origen: 'nuevo-proyecto-ui-etapas'
  };
}

function crearFormularioSubidaVideos({ archivos = [], nombreProyecto = '' } = {}) {
  const formulario = new FormData();
  archivos.forEach((archivo) => formulario.append('videos', archivo));
  formulario.append('nombreProyecto', nombreProyecto || 'Proyecto AutoVideoJeff');
  formulario.append('origen', 'nuevo-proyecto-ui-etapas');
  return formulario;
}

function crearOpcionesEntendimientoEtapas() {
  return {
    origen: 'nuevo-proyecto-ui-etapas',
    perfil: obtenerValor('profileSelect', 'general'),
    plataforma: elementos.platformInput.value || 'tiktok',
    plataformas: obtenerPlataformasSeleccionadas(),
    modoEdicion: obtenerValor('editModeSelect', 'revision_completa'),
    ...obtenerOpcionesTranscripcion(),
    ...obtenerConfiguracionGemini(),
    ...obtenerOpcionesEdicionAutomatica(),
    ...obtenerOpcionesEfectos()
  };
}

function crearFormularioProcesamientoLegacy(jobId) {
  const archivos = [...(elementos.videoInput.files || [])];
  const archivo = archivos[0];
  validarVideoSeleccionado(archivo);
  const formulario = new FormData();
  formulario.append('video', archivo);
  formulario.append('jobId', jobId);
  formulario.append('nombreProyecto', obtenerNombreProyectoSeguro(archivo));
  formulario.append('cantidadVideosProyecto', String(archivos.length || 1));
  formulario.append('videosSeleccionadosJson', JSON.stringify(archivos.map((item) => ({ nombre: item.name, tamano: item.size, tipo: item.type || 'video' }))));
  formulario.append('etapaSolicitada', 'entendimiento');
  aplicarOpcionesProyectoAFormulario(formulario);
  formulario.append('modo', elementos.modeInput.value || 'cuadrado-centro');
  formulario.append('mejorarAudio', elementos.improveAudio.checked ? 'true' : 'false');
  formulario.append('modoAudio', elementos.audioMode.value || 'limpieza-simple');
  agregarOpcionesAFormulario(formulario, obtenerOpcionesTranscripcion());
  agregarOpcionesAFormulario(formulario, obtenerConfiguracionGemini());
  agregarOpcionesAFormulario(formulario, obtenerOpcionesEdicionAutomatica());
  agregarOpcionesAFormulario(formulario, obtenerOpcionesEfectos());
  return formulario;
}

async function crearProyectoEtapas(archivos) {
  const payload = crearPayloadProyectoEtapas(archivos);
  const datos = await apiJson('/api/proyectos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const proyectoId = datos.proyecto?.proyectoId || datos.proyecto?.id;
  if (!proyectoId) throw new Error('El servidor creó el proyecto pero no devolvió proyectoId.');
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  return { proyectoId, payload, datos };
}

async function subirVideosProyectoEtapas({ proyectoId, archivos, nombreProyecto }) {
  const formulario = crearFormularioSubidaVideos({ archivos, nombreProyecto });
  return await apiJson(`/api/proyectos/${encodeURIComponent(proyectoId)}/videos`, { method: 'POST', body: formulario });
}

async function procesarEntendimientoProyectoEtapas(proyectoId) {
  return await apiJson(`/api/proyectos/${encodeURIComponent(proyectoId)}/entendimiento/procesar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(crearOpcionesEntendimientoEtapas())
  });
}

async function iniciarProgresoLegacy(jobId) {
  prepararProgresoReal();
  const url = await crearUrlApi(`/api/progreso/${encodeURIComponent(jobId)}`);
  controladorProgreso = conectarProgresoReal({
    url,
    onError: (evento) => mostrarModalErrorEdicion(evento),
    onFinalizado: () => cerrarProgresoActual()
  });
  actualizarProgresoReal({ titulo: 'Trabajo creado', detalle: 'Conectando barra de progreso real.', porcentaje: 1, estado: 'procesando', etapa: 'inicio' });
}

async function normalizarUrlsPlataformas(datos) {
  const resultadoPlataformas = datos.resultadoPlataformas || datos.modular?.resultadoPlataformas;
  if (!resultadoPlataformas?.resultados) return datos;
  const resultados = [];
  for (const item of resultadoPlataformas.resultados) {
    resultados.push({ ...item, urlPublica: item.urlPublica ? await crearUrlPublica(item.urlPublica) : '' });
  }
  const actualizado = { ...resultadoPlataformas, resultados };
  return { ...datos, resultadoPlataformas: actualizado, modular: datos.modular ? { ...datos.modular, resultadoPlataformas: actualizado } : datos.modular };
}

async function mostrarResultado(datosEntrada) {
  const datos = await normalizarUrlsPlataformas(datosEntrada);
  guardarUltimaProduccion(datos);
  const urlExportada = await crearUrlPublica(datos.resultado?.urlPublica || datos.resultado?.exportUrl || '');
  elementos.resultPanel.hidden = false;
  elementos.editingSummary.hidden = false;
  elementos.editingSummary.textContent = obtenerResumenEdicionDinamica(datos);
  elementos.audioSummary.hidden = false;
  elementos.audioSummary.textContent = obtenerResumenAudio(datos, elementos.improveAudio.checked);
  elementos.transcriptionSummary.hidden = false;
  elementos.transcriptionSummary.textContent = obtenerResumenTranscripcion(datos);
  mostrarResumenEfectosUI(datos, elementos.modularSummary);
  mostrarResultadoPlataformasUI(datos, elementos);
  if (urlExportada) {
    elementos.resultVideo.hidden = false;
    elementos.resultVideo.src = urlExportada;
    elementos.downloadLink.hidden = false;
    elementos.downloadLink.href = urlExportada;
  }
  limpiarComparacionNuevoProyecto();
  return datos;
}

function construirErrorParaModal(datos, respaldoMensaje) {
  if (datos?.diagnostico) {
    return { titulo: 'Fallo en diagnóstico', etapa: 'diagnostico', detalle: datos.mensaje || datos.diagnostico.mensaje || respaldoMensaje, archivo: 'diagnostico/diagnostico-automatico.service.js', recomendacion: 'Revisar diagnóstico automático antes de procesar el video.' };
  }

  return { titulo: 'Fallo de edición', etapa: 'servidor', detalle: datos?.mensaje || respaldoMensaje || 'No se pudo procesar el video.', archivo: 'server.js', recomendacion: 'Revisar el historial de progreso y el error del servidor.' };
}

async function procesarFormularioPorEtapas(archivos) {
  prepararProgresoReal();
  actualizarProgresoReal({ titulo: 'Creando proyecto', detalle: 'Registrando proyecto por etapas.', porcentaje: 8, estado: 'procesando', etapa: 'nuevo-proyecto' });
  const creado = await crearProyectoEtapas(archivos);
  const { proyectoId, payload } = creado;

  actualizarProgresoReal({ titulo: 'Subiendo videos', detalle: `Guardando ${archivos.length} video(s) en el proyecto ${proyectoId}.`, porcentaje: 28, estado: 'procesando', etapa: 'videos' });
  await subirVideosProyectoEtapas({ proyectoId, archivos, nombreProyecto: payload.nombre });

  actualizarProgresoReal({ titulo: 'Procesando entendimiento', detalle: 'Generando transcripción, fotogramas y análisis global.', porcentaje: 55, estado: 'procesando', etapa: 'entendimiento' });
  const entendimiento = await procesarEntendimientoProyectoEtapas(proyectoId);

  actualizarProgresoReal({ titulo: 'Entendimiento listo', detalle: `Proyecto ${proyectoId} preparado para revisar y crear plan.`, porcentaje: 100, estado: 'finalizado', etapa: 'entendimiento' });
  return { proyectoId, entendimiento };
}

async function procesarFormulario(evento) {
  evento.preventDefault();
  if (!esPantallaProcesadorActiva()) return;
  ocultarMensaje();
  reiniciarResultado();
  cerrarProgresoActual();

  const archivos = [...(elementos.videoInput.files || [])];
  const archivo = archivos[0];

  try {
    validarVideoSeleccionado(archivo);
    bloquearFormulario(true);
    const resultadoEtapas = await procesarFormularioPorEtapas(archivos);
    await recargarHistorialProyectosUI({ crearUrlApi }).catch((error) => console.warn('No se pudo recargar historial:', error.message));
    mostrarMensaje(`Entendimiento completado. Proyecto activo: ${resultadoEtapas.proyectoId}`, 'ok');
    navegarAEntendimientoDespuesDeProcesar(resultadoEtapas.proyectoId);
  } catch (error) {
    mostrarMensaje(error.message || 'Ocurrió un error al procesar el proyecto por etapas.', 'error');
    mostrarModalErrorEdicion({ titulo: 'Fallo de flujo por etapas', etapa: 'nuevo-proyecto', detalle: error.message || 'Ocurrió un error al procesar el proyecto.', archivo: 'app/app.js', recomendacion: 'Ejecuta Diagnóstico final rediseño y revisa que el servidor local esté activo.' });
    console.error('Error al procesar proyecto por etapas:', error);
  } finally {
    bloquearFormulario(false);
  }
}

async function procesarFormularioLegacy(evento) {
  evento.preventDefault();
  if (!esPantallaProcesadorActiva()) return;
  ocultarMensaje();
  reiniciarResultado();
  cerrarProgresoActual();

  const jobId = `legacy-${Date.now()}`;
  let modalErrorMostrado = false;

  try {
    const formulario = crearFormularioProcesamientoLegacy(jobId);
    bloquearFormulario(true);
    await iniciarProgresoLegacy(jobId);
    const respuesta = await fetch(await crearUrlApi('/api/procesar-video'), { method: 'POST', body: formulario });
    const datos = await leerRespuestaJsonSegura(respuesta);

    if (!respuesta.ok || !datos.ok) {
      const mensaje = `${datos.mensaje || 'No se pudo procesar el video.'}`.trim();
      mostrarModalErrorEdicion(construirErrorParaModal(datos, mensaje));
      modalErrorMostrado = true;
      throw new Error(mensaje);
    }

    actualizarProgresoReal({ titulo: 'Video listo', detalle: datos.mensaje || 'Proceso legacy completado correctamente.', porcentaje: 100, estado: 'finalizado', etapa: 'finalizado' });
    await mostrarResultado(datos);
    await recargarHistorialProyectosUI({ crearUrlApi }).catch((error) => console.warn('No se pudo recargar historial legacy:', error.message));
    mostrarMensaje(datos.mensaje || 'Proceso completado correctamente.', 'ok');
  } catch (error) {
    mostrarMensaje(error.message || 'Ocurrió un error al procesar el video.', 'error');
    if (!modalErrorMostrado) {
      mostrarModalErrorEdicion({ titulo: 'Fallo de edición legacy', etapa: 'app', detalle: error.message || 'Ocurrió un error al procesar el video.', archivo: 'app/app.js', recomendacion: 'Usar el flujo por etapas salvo que necesites compatibilidad legacy.' });
    }
    console.error('Error al procesar video legacy:', error);
  } finally {
    bloquearFormulario(false);
  }
}

function sincronizarModoAudio() {
  aplicarEstadoControlesProcesador();
}

async function sincronizarProcesadorConPantalla(pantallaId = document.body.dataset.pantallaActiva) {
  aplicarEstadoControlesProcesador();
  if (pantallaId === PANTALLA_PROCESADOR && !servidorVerificado) await verificarServidor();
}

function registrarEventosProcesador() {
  elementos.videoInput.addEventListener('change', registrarCambioDeArchivo);
  elementos.videoForm.addEventListener('submit', procesarFormulario);
  elementos.improveAudio.addEventListener('change', sincronizarModoAudio);
  document.addEventListener('autovideo:navegacion', (evento) => {
    sincronizarProcesadorConPantalla(evento.detail?.pantallaId);
  });
}

function iniciarInterfaz() {
  if (!validarElementosRequeridos()) return;
  ocultarProgreso();
  ocultarMensaje();
  reiniciarResultado();
  inicializarConfiguracionProyectoUI();
  inicializarHistorialProyectosUI({ crearUrlApi });
  inicializarProduccionRevisionUI({ crearUrlApi });
  inicializarBibliotecaUI({ crearUrlApi });
  inicializarGeminiPopup();
  inicializarTranscripcionUI();
  inicializarEfectosUI({ crearUrlApi });
  inicializarModalErrorEdicion();
  aplicarModoAutomaticoVisual();
  registrarEventosProcesador();
  sincronizarProcesadorConPantalla();
}

document.addEventListener('DOMContentLoaded', iniciarInterfaz);
