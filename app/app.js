/*
  Nombre completo: app.js
  Ruta o ubicación: AutoVideoJeff/app/app.js
  Función o funciones:
    - Controlar la interacción de la pantalla principal.
    - Verificar si el servidor local está activo.
    - Leer el video seleccionado por el usuario.
    - Enviar el video al endpoint /api/procesar-video.
    - Mostrar mensajes, errores y enlace de descarga cuando exista.
  Con qué se conecta:
    - app/index.html
    - server.js mediante /api/estado
    - server.js mediante /api/procesar-video
*/

const serverStatus = document.getElementById('serverStatus');
const videoForm = document.getElementById('videoForm');
const videoInput = document.getElementById('videoInput');
const fileName = document.getElementById('fileName');
const processButton = document.getElementById('processButton');
const progressArea = document.getElementById('progressArea');
const progressText = document.getElementById('progressText');
const messageBox = document.getElementById('messageBox');
const resultPanel = document.getElementById('resultPanel');
const resultVideo = document.getElementById('resultVideo');
const downloadLink = document.getElementById('downloadLink');

function mostrarMensaje(texto, tipo = 'normal') {
  messageBox.hidden = false;
  messageBox.textContent = texto;
  messageBox.className = `message ${tipo}`.trim();
}

function limpiarResultado() {
  resultPanel.hidden = true;
  resultVideo.hidden = true;
  resultVideo.removeAttribute('src');
  downloadLink.hidden = true;
  downloadLink.removeAttribute('href');
}

function bloquearFormulario(bloqueado) {
  processButton.disabled = bloqueado;
  videoInput.disabled = bloqueado;
  progressArea.hidden = !bloqueado;
}

async function verificarServidor() {
  try {
    const respuesta = await fetch('/api/estado');
    const datos = await respuesta.json();

    if (!datos.ok) {
      throw new Error('Servidor sin respuesta válida.');
    }

    serverStatus.textContent = 'Servidor activo';
    serverStatus.className = 'status-pill ok';
  } catch (error) {
    serverStatus.textContent = 'Servidor no disponible';
    serverStatus.className = 'status-pill error';
    mostrarMensaje('No se pudo verificar el servidor local. Ejecuta npm start y vuelve a intentar.', 'error');
  }
}

videoInput.addEventListener('change', () => {
  limpiarResultado();
  messageBox.hidden = true;

  const archivo = videoInput.files?.[0];
  fileName.textContent = archivo ? archivo.name : 'Ningún archivo seleccionado';
});

videoForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarResultado();

  const archivo = videoInput.files?.[0];

  if (!archivo) {
    mostrarMensaje('Selecciona un video antes de iniciar la edición.', 'error');
    return;
  }

  const formulario = new FormData();
  formulario.append('video', archivo);

  try {
    bloquearFormulario(true);
    progressText.textContent = 'Subiendo y preparando video...';
    mostrarMensaje('Proceso iniciado. La app enviará el video al motor modular.', 'normal');

    const respuesta = await fetch('/api/procesar-video', {
      method: 'POST',
      body: formulario
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.mensaje || 'No se pudo procesar el video.');
    }

    const urlExportada = datos.resultado?.urlPublica || datos.resultado?.exportUrl || '';

    if (urlExportada) {
      resultPanel.hidden = false;
      resultVideo.hidden = false;
      resultVideo.src = urlExportada;
      downloadLink.hidden = false;
      downloadLink.href = urlExportada;
    }

    mostrarMensaje(datos.mensaje || 'Proceso completado.', 'ok');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  } finally {
    bloquearFormulario(false);
  }
});

verificarServidor();
