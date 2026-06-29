/*
  Laboratorio de efectos - Bloque 4
  Función: cargar catálogo, seleccionar un efecto y enviar video corto al backend del laboratorio.
*/

let catalogoLab = null;
let efectoSeleccionado = null;
let inicializado = false;

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '') { const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function normalizar(valor = '') { return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

function asegurarCssLaboratorio() {
  if (document.querySelector('link[data-lab-efectos-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './laboratorio-efectos.css';
  link.dataset.labEfectosCss = '1';
  document.head.appendChild(link);
}

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Laboratorio efectos UI] No se pudo leer servidor Electron:', error.message);
    }
  }
  return window.location.origin;
}

async function urlApi(ruta) {
  const base = await obtenerBaseApi();
  const normalizada = String(ruta).startsWith('/') ? ruta : `/${ruta}`;
  return `${base}${normalizada}`;
}

async function urlPublica(ruta) {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return await urlApi(ruta);
}

async function apiJson(ruta, opciones = {}) {
  const respuesta = await fetch(await urlApi(ruta), opciones);
  const cuerpo = await respuesta.text();
  let datos = {};
  try { datos = cuerpo ? JSON.parse(cuerpo) : {}; } catch (_error) { datos = { ok: false, mensaje: cuerpo }; }
  if (!respuesta.ok || datos.ok === false) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
  return datos;
}

function setEstado(mensaje, tipo = 'normal') {
  const estado = $('labEfectosEstado');
  if (!estado) return;
  estado.textContent = mensaje;
  estado.className = `lab-effects-status is-${tipo}`;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('labEfectosMensaje');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `lab-effects-message is-${tipo}`;
}

function ocultarMensaje() {
  const box = $('labEfectosMensaje');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function actualizarArchivoSeleccionado() {
  const input = $('labEfectosVideoInput');
  const fileName = $('labEfectosFileName');
  const archivo = input?.files?.[0] || null;
  if (fileName) fileName.textContent = archivo ? `${archivo.name} · ${(archivo.size / (1024 * 1024)).toFixed(1)} MB` : 'Ningún video seleccionado.';
  actualizarBotonProbar();
}

function actualizarBotonProbar() {
  const boton = $('labEfectosProbarBtn');
  const archivo = $('labEfectosVideoInput')?.files?.[0] || null;
  if (boton) boton.disabled = !archivo || !efectoSeleccionado;
}

function efectoCoincideBusqueda(efecto, busqueda = '') {
  if (!busqueda) return true;
  const textoEfecto = normalizar([
    efecto.id,
    efecto.nombre,
    efecto.descripcion,
    efecto.queDebeSalir,
    efecto.tipoRender,
    ...(efecto.tags || [])
  ].join(' '));
  return textoEfecto.includes(busqueda);
}

function renderEfectoCard(efecto) {
  const activo = efectoSeleccionado?.id === efecto.id ? ' is-active' : '';
  const requiereTexto = efecto.requiereTexto ? '<small>Texto</small>' : '';
  return `
    <button class="lab-effects-effect-card${activo}" type="button" data-efecto-id="${escapar(efecto.id)}">
      <span>${escapar(efecto.tipoRender || 'efecto')}</span>
      <strong>${escapar(efecto.nombre)}</strong>
      <p>${escapar(efecto.descripcion)}</p>
      <div>${requiereTexto}<small>${escapar(efecto.intensidadBase || 'normal')}</small><small>${escapar(efecto.duracionSugeridaSegundos || 10)}s</small></div>
    </button>
  `;
}

function renderCatalogo() {
  const contenedor = $('labEfectosAcordeones');
  if (!contenedor) return;
  const acordeones = catalogoLab?.acordeones || [];
  const busqueda = normalizar($('labEfectosBuscar')?.value || '');
  if (!acordeones.length) {
    contenedor.innerHTML = '<div class="lab-effects-empty">No se pudo cargar el catálogo.</div>';
    return;
  }

  const html = acordeones.map((categoria, index) => {
    const efectos = (categoria.efectos || []).filter((efecto) => efectoCoincideBusqueda(efecto, busqueda));
    if (!efectos.length && busqueda) return '';
    return `
      <details class="lab-effects-accordion" ${index === 0 || busqueda ? 'open' : ''}>
        <summary>
          <div>
            <strong>${escapar(categoria.nombre)}</strong>
            <span>${escapar(categoria.descripcion)}</span>
          </div>
          <b>${efectos.length}</b>
        </summary>
        <div class="lab-effects-grid">
          ${efectos.map(renderEfectoCard).join('') || '<div class="lab-effects-empty">Sin efectos visibles.</div>'}
        </div>
      </details>
    `;
  }).join('');

  contenedor.innerHTML = html || '<div class="lab-effects-empty">No hay efectos que coincidan con la búsqueda.</div>';
}

function renderSeleccion() {
  const resumen = $('labEfectosResumenSeleccion');
  const esperado = $('labEfectosQueDebeSalir');
  const hidden = $('labEfectosSeleccionado');
  if (hidden) hidden.value = efectoSeleccionado?.id || '';
  if (!efectoSeleccionado) {
    if (resumen) resumen.innerHTML = '<strong>Sin efecto seleccionado</strong><span>Elige un efecto del catálogo.</span>';
    if (esperado) esperado.textContent = 'Selecciona un efecto para ver la explicación esperada.';
    actualizarBotonProbar();
    return;
  }
  if (resumen) {
    resumen.innerHTML = `
      <strong>${escapar(efectoSeleccionado.nombre)}</strong>
      <span>${escapar(efectoSeleccionado.descripcion)}</span>
      <em>${escapar(efectoSeleccionado.categoriaId)} · ${escapar(efectoSeleccionado.tipoRender)} · intensidad ${escapar(efectoSeleccionado.intensidadBase)}</em>
    `;
  }
  if (esperado) esperado.textContent = efectoSeleccionado.queDebeSalir || 'Debe verse el efecto seleccionado en el clip.';
  actualizarBotonProbar();
}

function seleccionarEfecto(efectoId) {
  const efecto = (catalogoLab?.acordeones || []).flatMap((cat) => cat.efectos || []).find((item) => item.id === efectoId) || null;
  if (!efecto) return;
  efectoSeleccionado = efecto;
  renderSeleccion();
  renderCatalogo();
  ocultarMensaje();
}

async function cargarCatalogo() {
  setEstado('Cargando catálogo...', 'normal');
  const datos = await apiJson('/api/laboratorio-efectos/catalogo');
  catalogoLab = datos.catalogo;
  setEstado(`${catalogoLab.totalEfectos || 0} efectos`, 'ok');
  renderCatalogo();
}

function bloquearFormulario(bloqueado) {
  const boton = $('labEfectosProbarBtn');
  const recargar = $('labEfectosRecargarBtn');
  if (boton) {
    boton.disabled = bloqueado || !($('labEfectosVideoInput')?.files?.[0]) || !efectoSeleccionado;
    boton.textContent = bloqueado ? 'Procesando efecto...' : 'Probar efecto';
  }
  if (recargar) recargar.disabled = bloqueado;
}

async function enviarPrueba(evento) {
  evento.preventDefault();
  const archivo = $('labEfectosVideoInput')?.files?.[0] || null;
  if (!archivo) { setMensaje('Sube un video corto para probar.', 'warn'); return; }
  if (!efectoSeleccionado) { setMensaje('Selecciona un efecto del catálogo.', 'warn'); return; }

  const formData = new FormData();
  formData.append('video', archivo);
  formData.append('efectoId', efectoSeleccionado.id);
  formData.append('textoPersonalizado', $('labEfectosTextoPersonalizado')?.value || '');
  formData.append('intensidad', $('labEfectosIntensidad')?.value || '');

  try {
    ocultarMensaje();
    bloquearFormulario(true);
    setEstado('Renderizando...', 'normal');
    setMensaje(`Aplicando ${efectoSeleccionado.nombre}.`, 'normal');
    const datos = await apiJson('/api/laboratorio-efectos/probar', { method: 'POST', body: formData });
    const resultado = datos.resultado || {};
    const panel = $('labEfectosResultadoPanel');
    const video = $('labEfectosResultadoVideo');
    const descarga = $('labEfectosDescarga');
    const resumen = $('labEfectosResultadoResumen');
    const url = await urlPublica(resultado.urlPublica || resultado.rutaRelativa || '');
    if (panel) panel.hidden = false;
    if (video && url) {
      video.src = url;
      video.load?.();
    }
    if (descarga && url) {
      descarga.hidden = false;
      descarga.href = url;
      descarga.download = resultado.nombreSalida || 'laboratorio-efecto.mp4';
    }
    if (resumen) resumen.textContent = `${datos.mensaje || 'Efecto generado.'} Debe salir: ${datos.queDebeSalir || efectoSeleccionado.queDebeSalir}`;
    setEstado('Prueba lista', 'ok');
    setMensaje('Video generado correctamente. Revisa el preview del resultado.', 'ok');
  } catch (error) {
    setEstado('Error', 'error');
    setMensaje(error.message || 'No se pudo probar el efecto.', 'error');
  } finally {
    bloquearFormulario(false);
  }
}

function enlazarEventos() {
  const root = document.querySelector('[data-lab-efectos-root]');
  if (!root || root.dataset.labInicializado === '1') return;
  root.dataset.labInicializado = '1';
  $('labEfectosVideoInput')?.addEventListener('change', actualizarArchivoSeleccionado);
  $('labEfectosBuscar')?.addEventListener('input', renderCatalogo);
  $('labEfectosRecargarBtn')?.addEventListener('click', () => cargarCatalogo().catch((error) => setMensaje(error.message, 'error')));
  $('labEfectosAcordeones')?.addEventListener('click', (evento) => {
    const boton = evento.target?.closest?.('[data-efecto-id]');
    if (!boton) return;
    seleccionarEfecto(boton.dataset.efectoId || '');
  });
  $('labEfectosForm')?.addEventListener('submit', enviarPrueba);
  cargarCatalogo().catch((error) => {
    setEstado('Error catálogo', 'error');
    setMensaje(error.message, 'error');
  });
}

export function inicializarLaboratorioEfectosUI() {
  if (typeof document === 'undefined') return;
  asegurarCssLaboratorio();
  enlazarEventos();
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'laboratorio-efectos') setTimeout(enlazarEventos, 0);
    });
  }
}

export default inicializarLaboratorioEfectosUI;
