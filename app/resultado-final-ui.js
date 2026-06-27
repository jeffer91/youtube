const CLAVE_ULTIMA_PRODUCCION = 'autovideojeff:ultima-produccion';

function obtenerDocumento() { return typeof document === 'undefined' ? null : document; }
function escapar(texto = '') { return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function cargarUltimoPayload() {
  try { const raw = window.localStorage.getItem(CLAVE_ULTIMA_PRODUCCION); return raw ? JSON.parse(raw) : null; } catch (_error) { return null; }
}

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try { const estado = await apiElectron(); if (estado?.url) return estado.url; } catch (_error) {}
  }
  return window.location.origin;
}

async function crearUrlPublica(ruta = '') {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = await obtenerBaseApi();
  return `${base}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}

function obtenerReporte(payload = {}) {
  return payload?.resultado?.reporteFinal?.reporte || payload?.produccion?.reporteFinal?.reporte || null;
}

function renderLista(titulo, items = [], mapper = (item) => item.nombre || item.texto || item.id || 'Elemento') {
  if (!items.length) return `<article class="final-report-card"><h3>${escapar(titulo)}</h3><p>No reportado todavía.</p></article>`;
  return `<article class="final-report-card"><h3>${escapar(titulo)}</h3><ul>${items.slice(0, 12).map((item) => `<li>${escapar(mapper(item))}</li>`).join('')}</ul></article>`;
}

function renderReporte(reporte = null) {
  if (!reporte) return '<div class="result-final-empty">No hay reporte final todavía. Procesa un video primero.</div>';
  const resumen = reporte.resumen || {};
  return `
    <section class="result-final-report">
      <div class="result-final-kpis">
        <span><strong>${resumen.efectosUsados || 0}</strong> efectos</span>
        <span><strong>${resumen.textosUsados || 0}</strong> textos</span>
        <span><strong>${resumen.imagenesDisponibles || 0}</strong> imágenes</span>
        <span><strong>${resumen.animacionesUsadas || 0}</strong> animaciones</span>
      </div>
      <div class="result-final-grid">
        ${renderLista('Efectos usados', reporte.efectosUsados || [], (item) => `${item.nombre || item.id} · ${item.categoria || 'visual'}${item.omitido ? ' · omitido' : ''}`)}
        ${renderLista('Textos y títulos', reporte.textosUsados || [], (item) => `${item.tipo || 'texto'} · ${item.texto || ''}`)}
        ${renderLista('Imágenes / recursos', reporte.imagenesUsadasORevisables || [], (item) => `${item.nombre || item.id} · ${item.inicio ?? '-'}s`)}
        ${renderLista('Animaciones', reporte.animacionesUsadas || [], (item) => `${item.tipo || item.id} · ${item.inicio ?? '-'}s`)}
      </div>
    </section>
  `;
}

export async function renderizarResultadoFinalUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  const contenedor = doc.getElementById('resultadoFinalContent');
  const video = doc.getElementById('resultadoFinalVideo');
  const estado = doc.getElementById('resultadoFinalStatus');
  if (!contenedor) return false;
  const payload = cargarUltimoPayload();
  if (!payload?.resultado) {
    contenedor.innerHTML = '<div class="result-final-empty">No hay resultado final cargado. Procesa un video primero.</div>';
    if (estado) estado.textContent = 'Sin resultado final.';
    return false;
  }
  const url = await crearUrlPublica(payload.resultado.urlPublica || '');
  if (video && url) { video.hidden = false; video.src = url; }
  const reporte = obtenerReporte(payload);
  contenedor.innerHTML = renderReporte(reporte);
  if (estado) estado.textContent = reporte ? `Reporte final listo: ${payload.resultado.reporteFinal?.nombreArchivo || 'reporte-final-edicion.json'}.` : 'Resultado cargado sin reporte final.';
  return true;
}

export function inicializarResultadoFinalUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  doc.addEventListener('autovideo:navegacion', (evento) => { if (evento.detail?.pantallaId === 'resultado') renderizarResultadoFinalUI(); });
  doc.addEventListener('click', (evento) => { if (evento.target.closest('[data-result-action="reload"]')) renderizarResultadoFinalUI(); });
  return true;
}
