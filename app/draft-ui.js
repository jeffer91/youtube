import { crearPanelInteligenciaDraft, recogerCambiosInteligencia } from './inteligencia-ui.js';

function crearElemento(tag, className = '', texto = '') {
  const elemento = document.createElement(tag);
  if (className) elemento.className = className;
  if (texto) elemento.textContent = texto;
  return elemento;
}

function limpiarContenedor(contenedor) {
  if (!contenedor) return;
  while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);
}

function crearBoton(id, className, texto) {
  const boton = crearElemento('button', className, texto);
  boton.id = id;
  boton.type = 'button';
  return boton;
}

function codificarOriginal(item = {}) {
  try {
    return encodeURIComponent(JSON.stringify(item || {}));
  } catch (_error) {
    return encodeURIComponent(JSON.stringify({}));
  }
}

function decodificarOriginal(valor = '') {
  try {
    return JSON.parse(decodeURIComponent(valor || '%7B%7D'));
  } catch (_error) {
    return {};
  }
}

function crearResumenSeccion(titulo, items = []) {
  const lista = Array.isArray(items) ? items : [];
  const activos = lista.filter((item) => item?.activo !== false).length;
  const tarjeta = crearElemento('article', 'draft-card');
  tarjeta.appendChild(crearElemento('h3', '', titulo));
  tarjeta.appendChild(crearElemento('p', 'mini-summary', `${activos}/${lista.length} elementos activos`));
  return tarjeta;
}

function crearResumenInteligencia(draft = {}) {
  const decisiones = draft?.secciones?.decisiones || {};
  const seo = decisiones.seo || {};
  const hook = decisiones.hook || {};
  const tarjeta = crearElemento('article', 'draft-card draft-card--creative');
  tarjeta.appendChild(crearElemento('h3', '', 'Creativo'));
  tarjeta.appendChild(crearElemento('p', 'mini-summary', seo.tituloPrincipal || hook.tituloCorto || hook.texto || 'Sin sugerencias'));
  return tarjeta;
}

function crearListaEditable(nombre, items = []) {
  const bloque = crearElemento('section', 'draft-edit-section');
  bloque.dataset.draftSection = nombre;
  bloque.appendChild(crearElemento('h3', '', nombre));

  const lista = crearElemento('div', 'draft-edit-list');
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    const fila = crearElemento('label', 'draft-edit-row');
    fila.dataset.index = String(index);
    fila.dataset.original = codificarOriginal(item);

    const check = crearElemento('input');
    check.type = 'checkbox';
    check.checked = item?.activo !== false;
    check.dataset.index = String(index);
    check.dataset.field = 'activo';

    const texto = crearElemento('textarea', 'draft-edit-text');
    texto.rows = 2;
    texto.dataset.index = String(index);
    texto.dataset.field = 'texto';
    texto.value = item?.texto || item?.mensaje || item?.motivo || '';

    fila.appendChild(check);
    fila.appendChild(texto);
    lista.appendChild(fila);
  });

  if (lista.childElementCount === 0) {
    lista.appendChild(crearElemento('p', 'mini-summary', 'No hay elementos para revisar en esta sección.'));
  }

  bloque.appendChild(lista);
  return bloque;
}

function crearAccionesDraft(estadoPlan) {
  const acciones = crearElemento('section', 'draft-actions');
  acciones.appendChild(crearBoton('saveDraftChangesButton', 'secondary-action-button', 'Guardar cambios del draft'));
  acciones.appendChild(crearBoton('approvePlanButton', 'secondary-action-button', estadoPlan === 'APROBADO' ? 'Plan aprobado' : 'Aprobar plan'));
  acciones.appendChild(crearBoton('renderApprovedPlanButton', 'primary-button', 'Renderizar video final'));
  return acciones;
}

export function pintarDraftRevision({ contenedor, draft } = {}) {
  if (!contenedor) return null;
  limpiarContenedor(contenedor);

  if (!draft) {
    contenedor.appendChild(crearElemento('p', 'message-box message-box--normal', 'No hay draft de revisión cargado.'));
    return null;
  }

  const cabecera = crearElemento('section', 'draft-header');
  cabecera.appendChild(crearElemento('p', 'eyebrow', 'Draft Mode'));
  cabecera.appendChild(crearElemento('h2', '', 'Revisión antes del render final'));
  cabecera.appendChild(crearElemento('p', 'mini-summary', `Plan: ${draft.planId || 'sin plan'} · Estado: ${draft.estadoPlan || 'sin estado'}`));

  const resumen = crearElemento('section', 'draft-grid');
  resumen.appendChild(crearResumenSeccion('Cortes', draft.secciones?.cortes));
  resumen.appendChild(crearResumenSeccion('Subtítulos', draft.secciones?.subtitulos));
  resumen.appendChild(crearResumenSeccion('Textos flotantes', draft.secciones?.textosFlotantes));
  resumen.appendChild(crearResumenSeccion('B-Roll', draft.secciones?.broll));
  resumen.appendChild(crearResumenInteligencia(draft));

  const inteligencia = crearPanelInteligenciaDraft({ draft });

  const editor = crearElemento('section', 'draft-editor');
  editor.appendChild(crearListaEditable('cortes', draft.secciones?.cortes));
  editor.appendChild(crearListaEditable('subtitulos', draft.secciones?.subtitulos));
  editor.appendChild(crearListaEditable('textosFlotantes', draft.secciones?.textosFlotantes));
  editor.appendChild(crearListaEditable('broll', draft.secciones?.broll));

  contenedor.appendChild(cabecera);
  contenedor.appendChild(resumen);
  contenedor.appendChild(inteligencia);
  contenedor.appendChild(editor);
  contenedor.appendChild(crearAccionesDraft(draft.estadoPlan));
  return contenedor;
}

export function recogerCambiosDraft(contenedor) {
  const cambios = { cortes: [], subtitulos: [], textosFlotantes: [], broll: [] };
  if (!contenedor) return cambios;

  const secciones = contenedor.querySelectorAll('[data-draft-section]');
  secciones.forEach((seccion) => {
    const nombre = seccion.dataset.draftSection;
    if (!Array.isArray(cambios[nombre])) cambios[nombre] = [];

    const filas = seccion.querySelectorAll('.draft-edit-row');
    filas.forEach((fila, index) => {
      const original = decodificarOriginal(fila.dataset.original || '');
      const activo = fila.querySelector('input[data-field="activo"]')?.checked ?? true;
      const texto = fila.querySelector('textarea[data-field="texto"]')?.value || '';
      cambios[nombre].push({ ...original, id: original.id || index + 1, activo, texto });
    });
  });

  const decisiones = recogerCambiosInteligencia(contenedor);
  if (decisiones) cambios.decisiones = decisiones;

  return cambios;
}

export function bloquearAccionesDraft(contenedor, bloquear) {
  if (!contenedor) return;
  contenedor.querySelectorAll('button, input, textarea, select').forEach((control) => {
    control.disabled = bloquear;
  });
}

export function inicializarDraftUI({ contenedorId = 'draftPanel' } = {}) {
  const contenedor = document.getElementById(contenedorId);
  return {
    disponible: Boolean(contenedor),
    contenedor,
    pintar: (draft) => pintarDraftRevision({ contenedor, draft }),
    recogerCambios: () => recogerCambiosDraft(contenedor),
    bloquear: (bloquear) => bloquearAccionesDraft(contenedor, bloquear)
  };
}

export default { pintarDraftRevision, recogerCambiosDraft, bloquearAccionesDraft, inicializarDraftUI };
