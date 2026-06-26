/*
  Bloque 21
  Funcion: ejecutar auditoria integral desde pantalla Diagnostico.
*/

function obtenerDocumento() { return typeof document === 'undefined' ? null : document; }
function escapar(texto = '') { return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function asegurarEstilosAuditoria() {
  const doc = obtenerDocumento();
  if (!doc || doc.getElementById('integralAuditStyles')) return;
  const link = doc.createElement('link');
  link.id = 'integralAuditStyles';
  link.rel = 'stylesheet';
  link.href = './auditoria-integral.css';
  doc.head.appendChild(link);
}

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try { const estado = await apiElectron(); if (estado?.url) return estado.url; } catch (_error) {}
  }
  return window.location.origin;
}

async function leerJsonSeguro(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try { return JSON.parse(texto); } catch (_error) { return { ok: false, mensaje: texto }; }
}

function renderSeccion(nombre, seccion = {}) {
  const estado = seccion.ok ? 'OK' : 'ERROR';
  const detalles = [];
  ['faltantes', 'errores', 'faltantesRequeridos', 'usadosSinDeclarar', 'faltanEnFormulario', 'faltanEnServidor'].forEach((clave) => {
    if (Array.isArray(seccion[clave]) && seccion[clave].length) detalles.push(...seccion[clave]);
  });
  return `
    <article class="audit-section ${seccion.ok ? 'is-ok' : 'is-error'}">
      <header><strong>${escapar(nombre)}</strong><span>${estado}</span></header>
      ${detalles.length ? `<ul>${detalles.map((item) => `<li>${escapar(item)}</li>`).join('')}</ul>` : '<p>Sin problemas detectados.</p>'}
    </article>
  `;
}

export function renderAuditoriaIntegral(auditoria = {}) {
  const secciones = auditoria.secciones || {};
  return `
    <section class="audit-result ${auditoria.ok ? 'is-ok' : 'is-error'}">
      <header>
        <strong>${escapar(auditoria.mensaje || 'Auditoria integral')}</strong>
        <span>${auditoria.ok ? 'ok' : 'revisar'}</span>
      </header>
      <div class="audit-grid">
        ${Object.entries(secciones).map(([nombre, seccion]) => renderSeccion(nombre, seccion)).join('')}
      </div>
      ${Array.isArray(auditoria.recomendaciones) ? `<div class="diagnostic-mini tip"><strong>Recomendaciones</strong><ul>${auditoria.recomendaciones.map((item) => `<li>${escapar(item)}</li>`).join('')}</ul></div>` : ''}
    </section>
  `;
}

export async function ejecutarAuditoriaIntegralUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosAuditoria();
  const contenedor = doc.getElementById('integralAuditResult');
  const estado = doc.getElementById('integralAuditStatus');
  if (!contenedor) return false;
  try {
    if (estado) estado.textContent = 'Ejecutando auditoria integral...';
    const respuesta = await fetch(`${await obtenerBaseApi()}/api/autovideo/diagnostico/auditoria-integral`, { method: 'GET' });
    const datos = await leerJsonSeguro(respuesta);
    if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo ejecutar auditoria integral.');
    contenedor.innerHTML = renderAuditoriaIntegral(datos.auditoria);
    if (estado) estado.textContent = datos.auditoria.ok ? 'Auditoria integral correcta.' : 'Auditoria integral con observaciones.';
    return true;
  } catch (error) {
    contenedor.innerHTML = `<div class="diagnostic-mini error">${escapar(error.message)}</div>`;
    if (estado) estado.textContent = 'Error al ejecutar auditoria integral.';
    return false;
  }
}

export function inicializarAuditoriaIntegralUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosAuditoria();
  doc.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-diagnostic-action="audit"]')) ejecutarAuditoriaIntegralUI();
  });
  doc.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'diagnostico') ejecutarAuditoriaIntegralUI();
  });
  return true;
}
