function crearElemento(tag, className = '', texto = '') {
  const elemento = document.createElement(tag);
  if (className) elemento.className = className;
  if (texto) elemento.textContent = texto;
  return elemento;
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

function formatearTiempo(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '0.0s';
  return `${numero.toFixed(1)}s`;
}

function crearCampoBroll({ etiqueta, field, valor = '', tipo = 'textarea', rows = 2, placeholder = '' }) {
  const label = crearElemento('label', 'broll-field');
  label.appendChild(crearElemento('span', '', etiqueta));
  const control = crearElemento(tipo === 'input' ? 'input' : 'textarea', 'broll-input');
  control.dataset.brollField = field;
  if (tipo === 'input') control.type = 'text';
  else control.rows = rows;
  control.value = String(valor || '');
  control.placeholder = placeholder;
  label.appendChild(control);
  return label;
}

function crearSelectTipo(valor = '') {
  const label = crearElemento('label', 'broll-field');
  label.appendChild(crearElemento('span', '', 'Tipo'));
  const select = crearElemento('select', 'broll-input');
  select.dataset.brollField = 'tipo';
  const tipos = [
    ['imagen-apoyo', 'Imagen de apoyo'],
    ['video-apoyo', 'Video de apoyo'],
    ['texto-contexto', 'Texto/contexto'],
    ['captura-recurso', 'Captura/recurso'],
    ['grafico-simple', 'Gráfico simple']
  ];
  tipos.forEach(([id, etiqueta]) => {
    const option = crearElemento('option', '', etiqueta);
    option.value = id;
    option.selected = id === valor;
    select.appendChild(option);
  });
  label.appendChild(select);
  return label;
}

function crearTarjetaBroll(item = {}, index = 0) {
  const tarjeta = crearElemento('article', 'broll-card');
  tarjeta.dataset.brollIndex = String(index);
  tarjeta.dataset.original = codificarOriginal(item);

  const header = crearElemento('div', 'broll-card__header');
  const checkLabel = crearElemento('label', 'broll-card__toggle');
  const check = crearElemento('input');
  check.type = 'checkbox';
  check.checked = item.activo !== false;
  check.dataset.brollField = 'activo';
  checkLabel.appendChild(check);
  checkLabel.appendChild(crearElemento('span', '', `B-Roll ${index + 1}`));

  const tiempo = crearElemento('strong', 'broll-card__time', `${formatearTiempo(item.inicio)} → ${formatearTiempo(item.fin)}`);
  header.appendChild(checkLabel);
  header.appendChild(tiempo);

  const cuerpo = crearElemento('div', 'broll-card__body');
  cuerpo.appendChild(crearSelectTipo(item.tipo || 'imagen-apoyo'));
  cuerpo.appendChild(crearCampoBroll({ etiqueta: 'Entrada', field: 'inicio', tipo: 'input', valor: item.inicio ?? 0, placeholder: '0.0' }));
  cuerpo.appendChild(crearCampoBroll({ etiqueta: 'Salida', field: 'fin', tipo: 'input', valor: item.fin ?? '', placeholder: '3.5' }));
  cuerpo.appendChild(crearCampoBroll({ etiqueta: 'Consulta sugerida', field: 'consultaBusqueda', valor: item.consultaBusqueda || '', rows: 2, placeholder: 'Palabras para buscar en tu biblioteca o proveedor con licencia.' }));
  cuerpo.appendChild(crearCampoBroll({ etiqueta: 'Texto / descripción', field: 'texto', valor: item.texto || '', rows: 2, placeholder: 'Qué debería verse en esta escena de apoyo.' }));
  cuerpo.appendChild(crearCampoBroll({ etiqueta: 'Motivo', field: 'motivo', valor: item.motivo || '', rows: 3, placeholder: 'Por qué conviene usar este apoyo visual.' }));

  const alerta = crearElemento('p', 'broll-license-note', item.licencia || 'PENDIENTE_VERIFICAR_MANUALMENTE');
  tarjeta.appendChild(header);
  tarjeta.appendChild(cuerpo);
  tarjeta.appendChild(alerta);
  return tarjeta;
}

function leerCampo(tarjeta, field, respaldo = '') {
  const control = tarjeta.querySelector(`[data-broll-field="${field}"]`);
  if (!control) return respaldo;
  if (control.type === 'checkbox') return control.checked;
  return control.value;
}

export function crearPanelBrollDraft({ items = [] } = {}) {
  const panel = crearElemento('section', 'broll-panel');
  panel.dataset.draftSection = 'broll';

  const header = crearElemento('div', 'broll-header');
  const textos = crearElemento('div');
  textos.appendChild(crearElemento('p', 'eyebrow', 'B-Roll sugerido'));
  textos.appendChild(crearElemento('h2', '', 'Escenas de apoyo para revisar'));
  textos.appendChild(crearElemento('p', 'mini-summary', 'Estas sugerencias no descargan recursos externos. Revisa fuente y licencia antes de usarlas.'));
  header.appendChild(textos);
  header.appendChild(crearElemento('strong', 'broll-count', `${Array.isArray(items) ? items.length : 0} sugerencias`));
  panel.appendChild(header);

  const grid = crearElemento('div', 'broll-card-grid');
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    grid.appendChild(crearTarjetaBroll(item, index));
  });

  if (grid.childElementCount === 0) {
    grid.appendChild(crearElemento('p', 'mini-summary', 'No hay B-Roll sugerido todavía.'));
  }

  panel.appendChild(grid);
  return panel;
}

export function recogerCambiosBroll(contenedor) {
  const panel = contenedor?.querySelector?.('.broll-panel');
  if (!panel) return [];

  return [...panel.querySelectorAll('.broll-card')].map((tarjeta, index) => {
    const original = decodificarOriginal(tarjeta.dataset.original || '');
    const inicio = Number(leerCampo(tarjeta, 'inicio', original.inicio ?? 0));
    const fin = Number(leerCampo(tarjeta, 'fin', original.fin ?? inicio + 3));
    return {
      ...original,
      id: original.id || `broll-${index + 1}`,
      activo: Boolean(leerCampo(tarjeta, 'activo', original.activo !== false)),
      tipo: leerCampo(tarjeta, 'tipo', original.tipo || 'imagen-apoyo'),
      inicio: Number.isFinite(inicio) ? inicio : (original.inicio ?? 0),
      fin: Number.isFinite(fin) ? fin : (original.fin ?? 0),
      texto: leerCampo(tarjeta, 'texto', original.texto || ''),
      consultaBusqueda: leerCampo(tarjeta, 'consultaBusqueda', original.consultaBusqueda || ''),
      motivo: leerCampo(tarjeta, 'motivo', original.motivo || ''),
      licencia: original.licencia || 'PENDIENTE_VERIFICAR_MANUALMENTE',
      descargarAutomaticamente: false,
      requiereRevision: true
    };
  });
}

export default { crearPanelBrollDraft, recogerCambiosBroll };
