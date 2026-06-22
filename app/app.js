/*
  Nombre completo: app.js
  Ruta o ubicación: AutoVideoJeff/app/app.js
  Función o funciones:
    - Controlar la interacción de la pantalla principal.
    - Verificar si el servidor local está activo.
    - Leer el video seleccionado por el usuario.
    - Enviar el video al endpoint /api/procesar-video.
    - Enviar opciones del módulo audio/: mejorarAudio y modoAudio.
    - Mostrar mensajes, errores, estado y enlace de descarga cuando exista.
    - Evitar mostrar “Preparando video” antes de que exista un video seleccionado.
    - Funcionar tanto desde navegador como desde Electron.
  Con qué se conecta:
    - app/index.html
    - app/styles.css
    - server.js
    - preload.js
*/

const elementos = {
  serverStatus: document.getElementById('serverStatus'),
  videoForm: document.getElementById('videoForm'),
  videoInput: document.getElementById('videoInput'),
  fileName: document.getElementById('fileName'),
  processButton: document.getElementById('processButton'),
  progressArea: document.getElementById('progressArea'),
  progressText: document.getElementById('progressText'),
  messageBox: document.getElementById('messageBox'),
  resultPanel: document.getElementById('resultPanel'),
  resultVideo: document.getElementById('resultVideo'),
  downloadLink: document.getElementById('downloadLink'),
  improveAudio: document.getElementById('improveAudio'),
  audioMode: document.getElementById('audioMode'),
  platformInput: document.getElementById('platformInput'),
  modeInput: document.getElementById('modeInput'),
  audioSummary: document.getElementById('audioSummary')
};

let apiBaseCache = null;
let temporizadorEstado = null;

function validarElementosRequeridos() {
  const faltantes = Object.entries(elementos)
    .filter(([, valor]) => !valor)
    .map(([nombre]) => nombre);

  if (faltantes.length > 0) {
    console.error('Faltan elementos de la interfaz:', faltantes);
    return false;
  }

  return true;
}

function limpiarTemporizadorEstado() {
  if (temporizadorEstado) {
    window.clearInterval(temporizadorEstado);
    temporizadorEstado = null;
  }
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

function mostrarProgreso(mensaje) {
  elementos.progressArea.hidden = false;
  elementos.progressText.textContent = mensaje;
}

function ocultarProgreso() {
  limpiarTemporizadorEstado();
  elementos.progressArea.hidden = true;
  elementos.progressText.textContent = '';
}

function reiniciarResultado() {
  elementos.resultPanel.hidden = true;
  elementos.resultVideo.hidden = true;
  elementos.resultVideo.removeAttribute('src');
  elementos.resultVideo.load();

  elementos.downloadLink.hidden = true;
  elementos.downloadLink.removeAttribute('href');

  elementos.audioSummary.hidden = true;
  elementos.audioSummary.textContent = '';
}

function bloquearFormulario(bloquear) {
  elementos.processButton.disabled = bloquear;
  elementos.videoInput.disabled = bloquear;
  elementos.improveAudio.disabled = bloquear;
  elementos.audioMode.disabled = bloquear;
  elementos.processButton.textContent = bloquear ? 'Procesando...' : 'Procesar video';
}

async function obtenerBaseApi() {
  if (apiBaseCache) {
    return apiBaseCache;
  }

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

  if (/^https?:\/\//i.test(ruta)) {
    return ruta;
  }

  const base = await obtenerBaseApi();
  const rutaNormalizada = ruta.startsWith('/') ? ruta : `/${ruta}`;

  return `${base}${rutaNormalizada}`;
}

async function leerRespuestaJsonSegura(respuesta) {
  const texto = await respuesta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch (_error) {
    return {
      ok: false,
      mensaje: texto
    };
  }
}

function actualizarEstadoServidor(ok, mensaje) {
  elementos.serverStatus.textContent = mensaje;
  elementos.serverStatus.className = ok
    ? 'server-status server-status--ok'
    : 'server-status server-status--error';
}

async function verificarServidor() {
  try {
    const respuesta = await fetch(await crearUrlApi('/api/estado'), {
      method: 'GET'
    });

    const datos = await leerRespuestaJsonSegura(respuesta);

    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.mensaje || 'Servidor no disponible.');
    }

    actualizarEstadoServidor(true, 'Servidor activo');
  } catch (error) {
    actualizarEstadoServidor(false, 'Servidor no disponible');
    mostrarMensaje(
      `No se pudo conectar con el servidor local: ${error.message}`,
      'error'
    );
  }
}

function registrarCambioDeArchivo() {
  ocultarMensaje();
  ocultarProgreso();
  reiniciarResultado();

  const archivo = elementos.videoInput.files?.[0];

  if (!archivo) {
    elementos.fileName.textContent = 'Ningún video seleccionado.';
    return;
  }

  const pesoMb = archivo.size / (1024 * 1024);
  elementos.fileName.textContent = `${archivo.name} · ${pesoMb.toFixed(1)} MB`;
  mostrarMensaje('Video seleccionado. Puedes procesarlo cuando quieras.', 'normal');
}

function crearFormularioProcesamiento() {
  const archivo = elementos.videoInput.files?.[0];

  if (!archivo) {
    throw new Error('Selecciona un video antes de procesar.');
  }

  const formulario = new FormData();

  formulario.append('video', archivo);
  formulario.append('plataforma', elementos.platformInput.value || 'tiktok');
  formulario.append('modo', elementos.modeInput.value || 'simple');
  formulario.append('mejorarAudio', elementos.improveAudio.checked ? 'true' : 'false');
  formulario.append('modoAudio', elementos.audioMode.value || 'limpieza-simple');

  return formulario;
}

function iniciarMensajesDeProceso() {
  const mejorarAudio = elementos.improveAudio.checked;

  const mensajes = mejorarAudio
    ? [
        'Subiendo video al motor modular.',
        'Analizando video y preparando edición.',
        'Limpiando audio y reduciendo ruido de fondo.',
        'Exportando video con audio mejorado.'
      ]
    : [
        'Subiendo video al motor modular.',
        'Analizando video y preparando edición.',
        'Exportando video con audio original.'
      ];

  let indice = 0;

  mostrarProgreso(mensajes[indice]);

  limpiarTemporizadorEstado();

  temporizadorEstado = window.setInterval(() => {
    indice = Math.min(indice + 1, mensajes.length - 1);
    mostrarProgreso(mensajes[indice]);

    if (indice >= mensajes.length - 1) {
      limpiarTemporizadorEstado();
    }
  }, 1800);
}

function obtenerResumenAudio(datos) {
  const audioFinal = datos.resultado?.audio;
  const audioModulo = datos.audio;

  if (audioFinal?.tipo === 'mejorado') {
    return 'Audio final: mejorado con limpieza de ruido, normalización y claridad de voz.';
  }

  if (audioModulo?.omitido) {
    return `Audio final: original. ${audioModulo.mensaje || 'La mejora de audio fue omitida.'}`;
  }

  if (elementos.improveAudio.checked) {
    return 'Audio final: original. No se recibió una pista mejorada desde el módulo de audio.';
  }

  return 'Audio final: original. La mejora de audio estaba desactivada.';
}

async function mostrarResultado(datos) {
  const urlExportada = await crearUrlPublica(
    datos.resultado?.urlPublica || datos.resultado?.exportUrl || ''
  );

  elementos.resultPanel.hidden = false;

  const resumenAudio = obtenerResumenAudio(datos);
  elementos.audioSummary.hidden = false;
  elementos.audioSummary.textContent = resumenAudio;

  if (urlExportada) {
    elementos.resultVideo.hidden = false;
    elementos.resultVideo.src = urlExportada;

    elementos.downloadLink.hidden = false;
    elementos.downloadLink.href = urlExportada;
  }
}

async function procesarFormulario(evento) {
  evento.preventDefault();

  ocultarMensaje();
  ocultarProgreso();
  reiniciarResultado();

  let formulario = null;

  try {
    formulario = crearFormularioProcesamiento();

    bloquearFormulario(true);
    iniciarMensajesDeProceso();

    const respuesta = await fetch(await crearUrlApi('/api/procesar-video'), {
      method: 'POST',
      body: formulario
    });

    const datos = await leerRespuestaJsonSegura(respuesta);

    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.mensaje || 'No se pudo procesar el video.');
    }

    limpiarTemporizadorEstado();
    mostrarProgreso('Video listo.');

    await mostrarResultado(datos);

    mostrarMensaje(datos.mensaje || 'Proceso completado correctamente.', 'ok');
  } catch (error) {
    ocultarProgreso();
    mostrarMensaje(error.message || 'Ocurrió un error al procesar el video.', 'error');
    console.error('Error al procesar video:', error);
  } finally {
    bloquearFormulario(false);
  }
}

function sincronizarModoAudio() {
  elementos.audioMode.disabled = !elementos.improveAudio.checked;

  if (!elementos.improveAudio.checked) {
    mostrarMensaje('Mejora de audio desactivada. Se usará el audio original.', 'normal');
  } else {
    mostrarMensaje('Mejora de audio activada. Se limpiará el ruido de fondo.', 'normal');
  }
}

function iniciarInterfaz() {
  if (!validarElementosRequeridos()) {
    return;
  }

  ocultarProgreso();
  ocultarMensaje();
  reiniciarResultado();

  elementos.videoInput.addEventListener('change', registrarCambioDeArchivo);
  elementos.videoForm.addEventListener('submit', procesarFormulario);
  elementos.improveAudio.addEventListener('change', sincronizarModoAudio);

  sincronizarModoAudio();
  verificarServidor();
}

document.addEventListener('DOMContentLoaded', iniciarInterfaz);