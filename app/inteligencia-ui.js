function crearElemento(tag, className = '', texto = '') {
  const elemento = document.createElement(tag);
  if (className) elemento.className = className;
  if (texto) elemento.textContent = texto;
  return elemento;
}

function codificar(valor = {}) {
  try {
    return encodeURIComponent(JSON.stringify(valor || {}));
  } catch (_error) {
    return encodeURIComponent(JSON.stringify({}));
  }
}

function decodificar(valor = '') {
  try {
    return JSON.parse(decodeURIComponent(valor || '%7B%7D'));
  } catch (_error) {
    return {};
  }
}

function obtenerDecisiones(draft = {}) {
  return draft?.secciones?.decisiones || draft?.decisiones || {};
}

function crearCampo({ etiqueta, tipo = 'textarea', valor = '', field, rows = 3, placeholder = '' }) {
  const label = crearElemento('label', 'intelligence-field');
  label.appendChild(crearElemento('span', '', etiqueta));

  const control = crearElemento(tipo === 'input' ? 'input' : 'textarea', 'intelligence-input');
  control.dataset.intelligenceField = field;
  if (tipo === 'textarea') control.rows = rows;
  else control.type = 'text';
  control.value = Array.isArray(valor) ? valor.join('\n') : String(valor || '');
  control.placeholder = placeholder;
  label.appendChild(control);
  return label;
}

function crearListaPuntos(puntos = []) {
  const bloque = crearElemento('section', 'intelligence-points');
  bloque.appendChild(crearElemento('h3', '', 'Puntos importantes detectados'));
  const lista = crearElemento('ol', 'intelligence-point-list');
  (Array.isArray(puntos) ? puntos : []).slice(0, 8).forEach((punto) => {
    const item = crearElemento('li', 'intelligence-point-item');
    const tiempo = Number.isFinite(Number(punto.inicio)) ? `${Number(punto.inicio).toFixed(1)}s` : 'sin tiempo';
    item.appendChild(crearElemento('strong', '', tiempo));
    item.appendChild(crearElemento('span', '', punto.texto || 'Punto sin texto.'));
    lista.appendChild(item);
  });

  if (lista.childElementCount === 0) {
    lista.appendChild(crearElemento('li', 'intelligence-point-item', 'No se detectaron puntos importantes todavía.'));
  }

  bloque.appendChild(lista);
  return bloque;
}

function normalizarHashtags(valor = '') {
  return String(valor || '')
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.startsWith('#') ? tag : `#${tag}`)
    .filter((tag, index, lista) => lista.indexOf(tag) === index);
}

function leerCampo(contenedor, field, respaldo = '') {
  return contenedor.querySelector(`[data-intelligence-field="${field}"]`)?.value ?? respaldo;
}

export function crearPanelInteligenciaDraft({ draft = {} } = {}) {
  const decisiones = obtenerDecisiones(draft);
  const hook = decisiones.hook || {};
  const seo = decisiones.seo || {};
  const branding = decisiones.branding || {};
  const miniatura = branding.miniatura || {};
  const puntos = decisiones.puntosImportantes?.puntos || [];

  const panel = crearElemento('section', 'intelligence-panel');
  panel.dataset.intelligenceOriginal = codificar(decisiones);

  const header = crearElemento('div', 'intelligence-header');
  const headerText = crearElemento('div');
  headerText.appendChild(crearElemento('p', 'eyebrow', 'Inteligencia creativa'));
  headerText.appendChild(crearElemento('h2', '', 'Hook, SEO y miniatura'));
  headerText.appendChild(crearElemento('p', 'mini-summary', decisiones.inteligencia?.mensaje || seo.estado || 'Revisa las sugerencias antes de publicar.'));
  header.appendChild(headerText);

  const estado = crearElemento('div', 'intelligence-status');
  estado.appendChild(crearElemento('strong', '', seo.tituloPrincipal || hook.tituloCorto || 'Sugerencias listas'));
  estado.appendChild(crearElemento('small', '', decisiones.perfilVisual?.nombre ? `Perfil: ${decisiones.perfilVisual.nombre}` : 'Perfil visual aplicado'));
  header.appendChild(estado);

  const grid = crearElemento('div', 'intelligence-grid');
  grid.appendChild(crearCampo({ etiqueta: 'Hook sugerido', field: 'hook.texto', valor: hook.texto || '', rows: 3, placeholder: 'Texto inicial para captar atención.' }));
  grid.appendChild(crearCampo({ etiqueta: 'Títulos sugeridos, uno por línea', field: 'seo.titulos', valor: seo.titulos || [], rows: 5, placeholder: 'Título 1\nTítulo 2\nTítulo 3' }));
  grid.appendChild(crearCampo({ etiqueta: 'Descripción', field: 'seo.descripcion', valor: seo.descripcion || '', rows: 6, placeholder: 'Descripción para copiar en la plataforma.' }));
  grid.appendChild(crearCampo({ etiqueta: 'Hashtags', tipo: 'input', field: 'seo.hashtags', valor: (seo.hashtags || []).join(' '), placeholder: '#video #educacion #tips' }));
  grid.appendChild(crearCampo({ etiqueta: 'Texto principal miniatura', tipo: 'input', field: 'miniatura.textoPrincipal', valor: miniatura.textoPrincipal || '', placeholder: 'Texto grande de miniatura' }));
  grid.appendChild(crearCampo({ etiqueta: 'Texto secundario miniatura', tipo: 'input', field: 'miniatura.textoSecundario', valor: miniatura.textoSecundario || '', placeholder: 'Texto secundario' }));

  panel.appendChild(header);
  panel.appendChild(grid);
  panel.appendChild(crearListaPuntos(puntos));
  return panel;
}

export function recogerCambiosInteligencia(contenedor) {
  const panel = contenedor?.querySelector?.('.intelligence-panel');
  if (!panel) return null;

  const original = decodificar(panel.dataset.intelligenceOriginal || '');
  const titulos = leerCampo(panel, 'seo.titulos', '')
    .split('\n')
    .map((titulo) => titulo.trim())
    .filter(Boolean);
  const descripcion = leerCampo(panel, 'seo.descripcion', original?.seo?.descripcion || '');
  const hashtags = normalizarHashtags(leerCampo(panel, 'seo.hashtags', (original?.seo?.hashtags || []).join(' ')));
  const hookTexto = leerCampo(panel, 'hook.texto', original?.hook?.texto || '');
  const miniaturaTexto = leerCampo(panel, 'miniatura.textoPrincipal', original?.branding?.miniatura?.textoPrincipal || '');
  const miniaturaSecundario = leerCampo(panel, 'miniatura.textoSecundario', original?.branding?.miniatura?.textoSecundario || '');

  return {
    ...original,
    hook: {
      ...(original.hook || {}),
      activo: true,
      texto: hookTexto,
      tituloCorto: hookTexto.slice(0, 58)
    },
    seo: {
      ...(original.seo || {}),
      titulos,
      tituloPrincipal: titulos[0] || original?.seo?.tituloPrincipal || hookTexto.slice(0, 70),
      descripcion,
      hashtags
    },
    branding: {
      ...(original.branding || {}),
      miniatura: {
        ...(original?.branding?.miniatura || {}),
        textoPrincipal: miniaturaTexto,
        textoSecundario: miniaturaSecundario
      }
    }
  };
}

export default { crearPanelInteligenciaDraft, recogerCambiosInteligencia };
