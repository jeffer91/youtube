const elementosModal = {
  modal: () => document.getElementById('errorModal'),
  title: () => document.getElementById('errorModalTitle'),
  stage: () => document.getElementById('errorModalStage'),
  detail: () => document.getElementById('errorModalDetail'),
  file: () => document.getElementById('errorModalFile'),
  recommendation: () => document.getElementById('errorModalRecommendation'),
  close: () => document.getElementById('closeErrorModal')
};

const RUTAS_RESPONSABLES = [
  { patron: /\/api\/estado/i, etapa: 'servidor', archivo: 'server.js' },
  { patron: /\/api\/laboratorio-efectos/i, etapa: 'laboratorio-efectos', archivo: 'server/rutas-laboratorio-efectos.service.js' },
  { patron: /\/api\/proyectos/i, etapa: 'flujo-etapas', archivo: 'server/rutas-etapas.service.js' },
  { patron: /\/entendimiento/i, etapa: 'entendimiento', archivo: 'server/rutas-etapas.service.js' },
  { patron: /\/plan/i, etapa: 'plan-edicion', archivo: 'server/rutas-etapas.service.js' },
  { patron: /\/produccion/i, etapa: 'produccion', archivo: 'server/rutas-produccion.service.js' },
  { patron: /\/adaptacion/i, etapa: 'adaptacion', archivo: 'server/rutas-etapas.service.js' },
  { patron: /\/resultado/i, etapa: 'resultado-final', archivo: 'server/rutas-etapas.service.js' },
  { patron: /\/biblioteca-proyecto/i, etapa: 'biblioteca-proyecto', archivo: 'biblioteca-proyecto/guardar-recurso-proyecto.service.js' },
  { patron: /\/biblioteca/i, etapa: 'biblioteca', archivo: 'biblioteca/biblioteca.conexion.js' },
  { patron: /\/gemini/i, etapa: 'gemini', archivo: 'server/rutas-gemini.service.js' },
  { patron: /\/diagnostico\/final-redisenio/i, etapa: 'diagnostico-final', archivo: 'diagnostico/diagnostico-final-redisenio.service.js' },
  { patron: /\/diagnostico\/auditoria-integral/i, etapa: 'auditoria-integral', archivo: 'diagnostico/auditoria-integral-autovideo.service.js' },
  { patron: /\/diagnostico/i, etapa: 'diagnostico', archivo: 'diagnostico/diagnostico-automatico.service.js' },
  { patron: /\/api\/procesar-video/i, etapa: 'legacy', archivo: 'server.js' },
  { patron: /\/api\/progreso/i, etapa: 'progreso', archivo: 'progreso/progreso-real.service.js' }
];

let ultimoError = null;
let errorPendiente = null;
let capturaGlobalInstalada = false;
let fetchOriginal = null;
let ultimaFirmaMostrada = '';
let ultimoMomentoMostrado = 0;

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function limpiarRuta(valor = '') {
  return String(valor || '')
    .replace(/^file:\/\/\//i, '')
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/\\/g, '/')
    .replace(/^.*?(app|server|diagnostico|laboratorio-efectos|biblioteca-proyecto|biblioteca|produccion|progreso|etapas|gemini)\//i, '$1/')
    .trim();
}

function extraerArchivoDesdeStack(stack = '') {
  const limpio = String(stack || '').replace(/\\/g, '/');
  const match = limpio.match(/(app|server|diagnostico|laboratorio-efectos|biblioteca-proyecto|biblioteca|produccion|progreso|etapas|gemini)\/[^\s)]+/i);
  if (!match) return '';
  return limpiarRuta(match[0]);
}

function rutaDesdeInputFetch(input) {
  if (typeof input === 'string') return input;
  if (input?.url) return input.url;
  return String(input || '');
}

function normalizarRutaApi(ruta = '') {
  try {
    return new URL(ruta, window.location.href).pathname;
  } catch (_error) {
    return String(ruta || '');
  }
}

function inferirResponsablePorRuta(ruta = '') {
  const rutaNormalizada = normalizarRutaApi(ruta);
  return RUTAS_RESPONSABLES.find((item) => item.patron.test(rutaNormalizada)) || null;
}

function obtenerCampoArchivo(error = {}) {
  return error.archivo
    || error.file
    || error.archivoResponsable
    || error.error?.archivo
    || error.error?.file
    || error.error?.archivoResponsable
    || error.diagnostico?.archivo
    || error.diagnostico?.archivoResponsable
    || '';
}

function obtenerDetalle(error = {}, respaldo = '') {
  if (typeof error === 'string') return texto(error, respaldo);
  return texto(
    error.detalle
      || error.mensaje
      || error.message
      || error.error?.detalle
      || error.error?.mensaje
      || error.diagnostico?.mensaje
      || respaldo,
    'No se recibió detalle del error.'
  );
}

function obtenerEtapa(error = {}, contexto = {}) {
  return error.etapa
    || error.stage
    || error.error?.etapa
    || contexto.etapa
    || inferirResponsablePorRuta(contexto.ruta || '')?.etapa
    || 'desconocida';
}

function obtenerArchivoResponsable(error = {}, contexto = {}) {
  const porCampo = obtenerCampoArchivo(error);
  if (porCampo) return limpiarRuta(porCampo);
  const porContexto = contexto.archivo || contexto.file;
  if (porContexto) return limpiarRuta(porContexto);
  const porRuta = inferirResponsablePorRuta(contexto.ruta || '')?.archivo;
  if (porRuta) return porRuta;
  const porEvento = contexto.filename || contexto.source;
  if (porEvento) return limpiarRuta(porEvento);
  const porStack = extraerArchivoDesdeStack(error.stack || error.reason?.stack || '');
  return porStack || 'no identificado';
}

export function normalizarErrorParaModal(error = {}, contexto = {}) {
  const responsableRuta = inferirResponsablePorRuta(contexto.ruta || '');
  const titulo = contexto.titulo || error.titulo || (responsableRuta ? 'Fallo de servidor local' : 'Error detectado en AutoVideoJeff');
  const etapa = obtenerEtapa(error, contexto);
  const detalle = obtenerDetalle(error, contexto.detalle || contexto.mensaje);
  const archivo = obtenerArchivoResponsable(error, contexto);
  const recomendacion = contexto.recomendacion
    || error.recomendacion
    || error.error?.recomendacion
    || (archivo !== 'no identificado' ? `Revisar ${archivo}.` : 'Revisar consola, diagnóstico y último paso ejecutado.');

  return {
    titulo,
    etapa,
    detalle,
    archivo,
    recomendacion,
    ruta: contexto.ruta || '',
    codigo: error.codigo || error.code || contexto.codigo || '',
    stack: error.stack || error.reason?.stack || ''
  };
}

function obtenerFormulario() {
  return document.getElementById('videoForm');
}

function asegurarInputReintento(nombre, valor) {
  const form = obtenerFormulario();
  if (!form) return;
  let input = form.querySelector(`input[name="${nombre}"]`);
  if (!input) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = nombre;
    form.appendChild(input);
  }
  input.value = valor || '';
}

function crearBotonReintento() {
  const modal = elementosModal.modal();
  const card = modal?.querySelector('.modal-card');
  if (!card) return null;
  let boton = document.getElementById('retryStageButton');
  if (!boton) {
    boton = document.createElement('button');
    boton.id = 'retryStageButton';
    boton.type = 'button';
    boton.className = 'primary-button';
    boton.textContent = 'Reintentar etapa';
    boton.style.marginTop = '12px';
    card.appendChild(boton);
  }
  return boton;
}

function crearBotonCopiarError() {
  const modal = elementosModal.modal();
  const card = modal?.querySelector('.modal-card');
  if (!card) return null;
  let boton = document.getElementById('copyErrorButton');
  if (!boton) {
    boton = document.createElement('button');
    boton.id = 'copyErrorButton';
    boton.type = 'button';
    boton.className = 'secondary-button error-copy-button';
    boton.textContent = 'Copiar error';
    boton.style.marginTop = '12px';
    card.appendChild(boton);
  }
  return boton;
}

function crearDetalleTecnico() {
  const modal = elementosModal.modal();
  const card = modal?.querySelector('.modal-card');
  if (!card) return null;
  let detalle = document.getElementById('errorModalTechnicalDetail');
  if (!detalle) {
    detalle = document.createElement('pre');
    detalle.id = 'errorModalTechnicalDetail';
    detalle.className = 'error-modal-technical-detail';
    detalle.hidden = true;
    card.appendChild(detalle);
  }
  return detalle;
}

function puedeReintentar(error = {}) {
  const etapa = obtenerEtapa(error);
  if (etapa === 'diagnostico' || etapa === 'diagnostico-final') return false;
  return true;
}

function debeOmitirPorDuplicado(error = {}) {
  const firma = `${error.etapa}|${error.detalle}|${error.archivo}`;
  const ahora = Date.now();
  if (firma === ultimaFirmaMostrada && ahora - ultimoMomentoMostrado < 1400) return true;
  ultimaFirmaMostrada = firma;
  ultimoMomentoMostrado = ahora;
  return false;
}

function textoCopiable(error = {}) {
  return [
    `Título: ${error.titulo || 'Error detectado'}`,
    `Etapa: ${error.etapa || 'desconocida'}`,
    `Detalle: ${error.detalle || 'Sin detalle'}`,
    `Archivo responsable: ${error.archivo || 'no identificado'}`,
    `Ruta/API: ${error.ruta || 'no aplica'}`,
    `Código: ${error.codigo || 'sin código'}`,
    error.stack ? `Stack: ${error.stack}` : ''
  ].filter(Boolean).join('\n');
}

export function mostrarModalErrorEdicion(error = {}, contexto = {}) {
  const modal = elementosModal.modal();
  const errorNormalizado = normalizarErrorParaModal(error, contexto);
  if (debeOmitirPorDuplicado(errorNormalizado)) return;
  ultimoError = errorNormalizado;

  if (!modal) {
    errorPendiente = errorNormalizado;
    return;
  }

  elementosModal.title().textContent = errorNormalizado.titulo || 'Error detectado en AutoVideoJeff';
  elementosModal.stage().textContent = `Etapa: ${errorNormalizado.etapa || 'desconocida'}`;
  elementosModal.detail().textContent = errorNormalizado.detalle || 'No se recibió detalle del error.';
  elementosModal.file().textContent = `Archivo responsable: ${errorNormalizado.archivo || 'no identificado'}`;
  elementosModal.recommendation().textContent = errorNormalizado.recomendacion || 'Revisar diagnóstico y consola.';

  const tecnico = crearDetalleTecnico();
  if (tecnico) {
    tecnico.hidden = !errorNormalizado.stack;
    tecnico.textContent = errorNormalizado.stack || '';
  }

  const botonReintento = crearBotonReintento();
  if (botonReintento) {
    botonReintento.hidden = !puedeReintentar(errorNormalizado);
    botonReintento.disabled = !puedeReintentar(errorNormalizado);
  }

  const botonCopiar = crearBotonCopiarError();
  if (botonCopiar) botonCopiar.hidden = false;

  modal.hidden = false;
}

export function ocultarModalErrorEdicion() {
  const modal = elementosModal.modal();
  if (modal) modal.hidden = true;
}

async function copiarUltimoError() {
  if (!ultimoError) return;
  const contenido = textoCopiable(ultimoError);
  try {
    await navigator.clipboard?.writeText(contenido);
  } catch (_error) {
    console.warn('[AutoVideoJeff] No se pudo copiar el error automáticamente.');
  }
}

function reintentarUltimaEtapa() {
  if (!ultimoError || !puedeReintentar(ultimoError)) return;
  const etapa = obtenerEtapa(ultimoError);
  asegurarInputReintento('reintentarDesdeEtapa', etapa);
  asegurarInputReintento('reintentoMotivo', ultimoError.detalle || ultimoError.mensaje || 'Reintento manual desde ventana de error.');
  ocultarModalErrorEdicion();
  document.dispatchEvent(new CustomEvent('autovideo:reintentar-etapa', { detail: { error: ultimoError, etapa } }));
  const form = obtenerFormulario();
  if (form?.requestSubmit) form.requestSubmit();
}

function asegurarCssErrorModal() {
  if (document.getElementById('errorModalStyles')) return;
  const link = document.createElement('link');
  link.id = 'errorModalStyles';
  link.rel = 'stylesheet';
  link.href = './error-modal.css';
  document.head.appendChild(link);
}

async function leerJsonSeguroDesdeRespuesta(respuesta) {
  try {
    const textoRespuesta = await respuesta.clone().text();
    if (!textoRespuesta) return {};
    try { return JSON.parse(textoRespuesta); } catch (_error) { return { mensaje: textoRespuesta }; }
  } catch (_error) {
    return {};
  }
}

function instalarCapturaFetchGlobal() {
  if (fetchOriginal || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  fetchOriginal = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const ruta = rutaDesdeInputFetch(input);
    try {
      const respuesta = await fetchOriginal(input, init);
      if (!respuesta.ok) {
        const datos = await leerJsonSeguroDesdeRespuesta(respuesta);
        mostrarModalErrorEdicion(datos, {
          titulo: 'Fallo de servidor local',
          ruta,
          codigo: respuesta.status,
          detalle: datos.mensaje || datos.detalle || `Error HTTP ${respuesta.status}`,
          recomendacion: 'Revisa el archivo responsable, el servidor local y luego ejecuta Diagnóstico.'
        });
      }
      return respuesta;
    } catch (error) {
      mostrarModalErrorEdicion(error, {
        titulo: 'Fallo de conexión local',
        ruta,
        detalle: error.message || 'No se pudo conectar con el servidor local.',
        recomendacion: 'Confirma que Electron/servidor local esté activo y revisa el archivo responsable.'
      });
      throw error;
    }
  };
}

function instalarCapturaGlobal() {
  if (capturaGlobalInstalada || typeof window === 'undefined') return;
  capturaGlobalInstalada = true;

  window.addEventListener('error', (evento) => {
    mostrarModalErrorEdicion(evento.error || { mensaje: evento.message }, {
      titulo: 'Error de interfaz detectado',
      etapa: 'interfaz',
      filename: evento.filename,
      detalle: evento.message
    });
  });

  window.addEventListener('unhandledrejection', (evento) => {
    mostrarModalErrorEdicion(evento.reason || { mensaje: 'Promesa rechazada sin captura.' }, {
      titulo: 'Error asíncrono detectado',
      etapa: 'promesa'
    });
  });

  window.addEventListener('autovideo:error', (evento) => {
    mostrarModalErrorEdicion(evento.detail || {}, { titulo: 'Error reportado por módulo' });
  });

  instalarCapturaFetchGlobal();

  window.AutoVideoJeffErrores = {
    mostrar: mostrarModalErrorEdicion,
    normalizar: normalizarErrorParaModal,
    ultimo: () => ultimoError
  };
}

export function inicializarModalErrorEdicion() {
  instalarCapturaGlobal();
  asegurarCssErrorModal();
  const modal = elementosModal.modal();
  const close = elementosModal.close();
  if (!modal || !close) return;
  close.addEventListener('click', ocultarModalErrorEdicion);
  crearBotonReintento()?.addEventListener('click', reintentarUltimaEtapa);
  crearBotonCopiarError()?.addEventListener('click', copiarUltimoError);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) ocultarModalErrorEdicion();
  });
  if (errorPendiente) {
    const pendiente = errorPendiente;
    errorPendiente = null;
    mostrarModalErrorEdicion(pendiente);
  }
}

if (typeof window !== 'undefined') {
  instalarCapturaGlobal();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarModalErrorEdicion, { once: true });
  } else {
    inicializarModalErrorEdicion();
  }
}

export default { inicializarModalErrorEdicion, mostrarModalErrorEdicion, ocultarModalErrorEdicion, normalizarErrorParaModal };
