/*
  Bloque 19
  Funcion: cargar diagnostico fuerte desde la pantalla Diagnostico.
*/

function obtenerDocumento() { return typeof document === 'undefined' ? null : document; }
function escapar(texto = '') { return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try { const estado = await apiElectron(); if (estado?.url) return estado.url; } catch (_error) {}
  }
  return window.location.origin;
}

function asegurarEstilos() {
  const doc = obtenerDocumento();
  if (!doc || doc.getElementById('strongDiagnosticStyles')) return;
  const link = doc.createElement('link');
  link.id = 'strongDiagnosticStyles';
  link.rel = 'stylesheet';
  link.href = './diagnostico-fuerte.css';
  doc.head.appendChild(link);
}

async function leerJsonSeguro(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try { return JSON.parse(texto); } catch (_error) { return { ok: false, mensaje: texto }; }
}

function renderLista(titulo, items = [], clase = '') {
  if (!items.length) return `<div class="diagnostic-mini ok">${escapar(titulo)}: sin novedades.</div>`;
  return `<div class="diagnostic-mini ${clase}"><strong>${escapar(titulo)}</strong><ul>${items.map((item) => `<li>${escapar(item)}</li>`).join('')}</ul></div>`;
}

export function renderDiagnosticoFuerte(diagnostico = {}) {
  const resumen = diagnostico.resumen || diagnostico.automatico?.resumen || {};
  return `
    <section class="strong-diagnostic-result ${diagnostico.bloqueante ? 'is-blocking' : 'is-ok'}">
      <header>
        <strong>${escapar(diagnostico.mensaje || 'Diagnostico fuerte')}</strong>
        <span>${diagnostico.bloqueante ? 'bloqueante' : 'ok'}</span>
      </header>
      <div class="diagnostic-grid">
        <div><small>FFmpeg</small><b>${resumen.ffmpeg === false ? 'Error' : 'OK'}</b></div>
        <div><small>Carpetas</small><b>${resumen.carpetas === false ? 'Error' : 'OK'}</b></div>
        <div><small>Modulos</small><b>${resumen.modulos === false ? 'Error' : 'OK'}</b></div>
        <div><small>Package</small><b>${diagnostico.packageJson?.ok === false ? 'Error' : 'OK'}</b></div>
      </div>
      ${renderLista('Errores', diagnostico.errores || [], 'error')}
      ${renderLista('Advertencias', diagnostico.advertencias || [], 'warning')}
      ${renderLista('Recomendaciones', diagnostico.recomendaciones || [], 'tip')}
    </section>
  `;
}

export async function ejecutarDiagnosticoFuerteUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilos();
  const contenedor = doc.getElementById('strongDiagnosticResult');
  const estado = doc.getElementById('strongDiagnosticStatus');
  if (!contenedor) return false;
  try {
    if (estado) estado.textContent = 'Ejecutando diagnostico fuerte...';
    const respuesta = await fetch(`${await obtenerBaseApi()}/api/autovideo/diagnostico/fuerte`, { method: 'GET' });
    const datos = await leerJsonSeguro(respuesta);
    if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo ejecutar diagnostico fuerte.');
    contenedor.innerHTML = renderDiagnosticoFuerte(datos.diagnostico);
    if (estado) estado.textContent = datos.diagnostico.bloqueante ? 'Diagnostico con bloqueo.' : 'Diagnostico correcto.';
    return true;
  } catch (error) {
    contenedor.innerHTML = `<div class="diagnostic-mini error">${escapar(error.message)}</div>`;
    if (estado) estado.textContent = 'Error al ejecutar diagnostico fuerte.';
    return false;
  }
}

export function inicializarDiagnosticoFuerteUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilos();
  doc.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-diagnostic-action="strong"]')) ejecutarDiagnosticoFuerteUI();
  });
  doc.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'diagnostico') ejecutarDiagnosticoFuerteUI();
  });
  return true;
}
