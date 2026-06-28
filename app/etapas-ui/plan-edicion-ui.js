/*
  Pantalla Plan de edicion
  Funcion: cargar, crear, editar, aprobar y mostrar plan antes de Produccion.
*/

const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '-') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function numero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : null; }
function numeroSeguro(valor, respaldo = 0) { const n = Number(valor); return Number.isFinite(n) ? n : respaldo; }
function arr(valor) { return Array.isArray(valor) ? valor : []; }
function setTexto(id, valor) { const el = $(id); if (el) el.textContent = String(valor ?? '-'); }

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Plan UI] No se pudo leer servidor Electron:', error.message);
    }
  }
  return window.location.origin;
}

async function api(ruta, opciones = {}) {
  const base = await obtenerBaseApi();
  const respuesta = await fetch(`${base}${ruta}`, opciones);
  const textoRespuesta = await respuesta.text();
  let datos = {};
  try { datos = textoRespuesta ? JSON.parse(textoRespuesta) : {}; } catch (_error) { datos = { ok: false, mensaje: textoRespuesta }; }
  if (!respuesta.ok || datos.ok === false) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
  return datos;
}

function obtenerProyectoId() {
  const input = $('planProyectoId');
  const desdeInput = input?.value?.trim();
  if (desdeInput) return desdeInput;
  return localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function guardarProyectoId(proyectoId) {
  if (!proyectoId) return;
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  const input = $('planProyectoId');
  if (input && !input.value) input.value = proyectoId;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('planMensaje');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `plan-message is-${tipo}`;
}

function ocultarMensaje() {
  const box = $('planMensaje');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function setChip(textoChip, tipo = 'normal') {
  const chip = $('planEstadoChip');
  if (!chip) return;
  chip.textContent = textoChip;
  chip.className = `aj-status-chip plan-chip is-${tipo}`;
}

function extraerPlan(payload = {}) {
  const wrapper = payload.resultado || payload;
  if (wrapper?.resultado?.planProduccion) return wrapper.resultado;
  if (wrapper?.datos?.resultado?.planProduccion) return wrapper.datos.resultado;
  if (wrapper?.planProduccion) return wrapper;
  return wrapper?.resultado || wrapper;
}

function obtenerElementos(plan = {}) {
  const elementos = plan.planProduccion?.elementos || plan.elementos;
  return Array.isArray(elementos) ? elementos : [];
}

function obtenerTimeline(plan = {}) {
  const timeline = plan.planProduccion?.lineaTiempo || plan.lineaTiempo;
  if (Array.isArray(timeline?.pistas)) return timeline.pistas;
  if (Array.isArray(timeline?.tracks)) return timeline.tracks;
  if (Array.isArray(timeline)) return timeline;
  return [];
}

function obtenerBiblioteca(plan = {}) { return plan.biblioteca || plan.fuente?.biblioteca || {}; }
function obtenerContexto(plan = {}) { return plan.contextoPlan || plan.fuente?.contextoPlan || {}; }
function obtenerPlanPorPartes(plan = {}) { return plan.planPorPartes || plan.fuente?.planPorPartes || {}; }
function obtenerPlanEjecutable(plan = {}) { return plan.planEjecutable || plan.planPorPartes?.planEjecutable || plan.planProduccion?.planEjecutable || null; }
function obtenerEditorPlan(plan = {}) { return plan.editorPlan || plan.planPorPartes?.editorPlan || plan.planProduccion?.editorPlan || {}; }
function obtenerAccionesEjecutables(plan = {}) { return arr(obtenerPlanEjecutable(plan)?.timeline); }

function textoBusquedaItem(item = {}) {
  const datos = item.datos || {};
  return [
    item.tipo,
    item.accion,
    item.pista,
    item.nombre,
    item.titulo,
    item.descripcion,
    item.textoPantalla,
    item.subtitulo,
    item.efecto,
    item.audio,
    item.transicion,
    item.recursoBiblioteca,
    datos.tipo,
    datos.tipoPlan,
    datos.estilo,
    datos.estiloSubtitulos,
    datos.nombre,
    datos.descripcion,
    datos.motivo,
    datos.audio,
    datos.sonido,
    datos.efecto
  ].filter(Boolean).join(' ').toLowerCase();
}

function itemIncluye(item = {}, palabras = []) {
  const base = textoBusquedaItem(item);
  return palabras.some((palabra) => base.includes(palabra));
}

function contarElementosTipo(elementos = [], tipo = '') {
  return elementos.filter((item) => item.tipo === tipo).length;
}

function contarItemsPorPalabras(items = [], palabras = []) {
  return items.filter((item) => itemIncluye(item, palabras)).length;
}

function obtenerProveedorPlan(plan = {}) {
  const partes = obtenerPlanPorPartes(plan);
  const ejecutable = obtenerPlanEjecutable(plan);
  return texto(
    partes.resumen?.mejorProveedor ||
    partes.resumen?.proveedorPrincipal ||
    ejecutable?.proveedor ||
    partes.mejorOpcionPlan?.proveedor ||
    partes.opcionesPlan?.seleccionAutomatica?.proveedor,
    'fallback'
  );
}

function describirTipoSubtitulos({ plan = {}, elementos = [], acciones = [] } = {}) {
  const resumen = plan.resumen || {};
  const subtitulos = elementos.filter((item) => item.tipo === 'subtitulo');
  const accionesConSubtitulo = acciones.filter((item) => texto(item.subtitulo, '').length > 0);
  const total = Math.max(numeroSeguro(resumen.subtitulos, 0), subtitulos.length, accionesConSubtitulo.length);
  if (total <= 0) return 'Sin subtitulos';

  const tipos = new Set();
  if ([...subtitulos, ...accionesConSubtitulo].some((item) => itemIncluye(item, ['global', 'transcripcion', 'segmento']))) tipos.add('Globales');
  if (accionesConSubtitulo.length > 0) tipos.add('Ejecutables');
  if (subtitulos.some((item) => itemIncluye(item, ['manual']))) tipos.add('Manual');
  if (subtitulos.some((item) => itemIncluye(item, ['tiktok', 'profesional']))) tipos.add('TikTok profesional');

  return [...tipos].slice(0, 2).join(' + ') || 'Desde transcripcion';
}

function construirResumenTecnico(plan = {}) {
  const resumen = plan.resumen || {};
  const elementos = obtenerElementos(plan);
  const acciones = obtenerAccionesEjecutables(plan);
  const recursos = arr(plan.planProduccion?.elementos).filter((item) => item.tipo === 'recurso');
  const efectosVisuales = Math.max(
    numeroSeguro(resumen.efectos, 0) + numeroSeguro(resumen.zooms, 0),
    contarElementosTipo(elementos, 'efecto') + contarElementosTipo(elementos, 'zoom'),
    contarItemsPorPalabras(acciones, ['efecto', 'fx', 'zoom', 'punch', 'transicion'])
  );
  const animaciones = Math.max(
    numeroSeguro(resumen.animaciones, 0),
    contarElementosTipo(elementos, 'animacion'),
    contarItemsPorPalabras(acciones, ['animacion', 'animation', 'entrada_titulo', 'salida_cierre'])
  );
  const audioBase = contarElementosTipo(elementos, 'audio');
  const efectosAudio = Math.max(
    acciones.filter((item) => texto(item.audio, '').length > 0 && !itemIncluye(item, ['musica', 'música', 'music', 'background'])).length,
    contarItemsPorPalabras(elementos, ['sfx', 'sonido', 'efecto audio', 'audio effect'])
  );
  const musicaFondo = Math.max(
    contarItemsPorPalabras(acciones, ['musica', 'música', 'music', 'background', 'fondo musical']),
    contarItemsPorPalabras(elementos, ['musica', 'música', 'music', 'background', 'fondo musical']),
    contarItemsPorPalabras(recursos, ['musica', 'música', 'music', 'background', 'fondo musical'])
  );
  const tipoSubtitulos = describirTipoSubtitulos({ plan, elementos, acciones });
  const proveedor = obtenerProveedorPlan(plan);

  return {
    proveedor,
    efectosVisuales,
    animaciones,
    tipoSubtitulos,
    audioBase,
    efectosAudio,
    musicaFondo,
    musicaTexto: musicaFondo > 0 ? `Si (${musicaFondo})` : 'No definida',
    efectosAudioTexto: audioBase > 0 ? `${efectosAudio} SFX / ${audioBase} base` : `${efectosAudio} SFX`,
    accionesEjecutables: acciones.length
  };
}

function renderKpis(plan = {}) {
  const resumen = plan.resumen || {};
  const elementos = obtenerElementos(plan);
  const biblioteca = obtenerBiblioteca(plan);
  const contexto = obtenerContexto(plan);
  const partes = obtenerPlanPorPartes(plan);
  const editorPlan = obtenerEditorPlan(plan);
  const resumenBiblioteca = biblioteca.resumen || {};
  const resumenContexto = contexto.resumen || contexto || {};
  const resumenPartes = partes.resumen || partes || {};
  const tecnico = construirResumenTecnico(plan);
  setTexto('planTotalElementos', String(resumen.totalElementos ?? elementos.length ?? 0));
  setTexto('planSubtitulos', String(resumen.subtitulos ?? elementos.filter((e) => e.tipo === 'subtitulo').length));
  setTexto('planTextos', String(resumen.textos ?? elementos.filter((e) => e.tipo === 'texto').length));
  setTexto('planRecursos', String(resumen.recursos ?? elementos.filter((e) => e.tipo === 'recurso').length));
  setTexto('planBiblioteca', `${resumenBiblioteca.seleccionadosProyecto ?? resumen.recursosBibliotecaProyecto ?? 0}P / ${resumenBiblioteca.seleccionadosGeneral ?? resumen.recursosBibliotecaGeneral ?? 0}G`);
  setTexto('planContexto', resumen.contextoListoParaIA || resumenContexto.listoParaIA ? `${resumenContexto.totalPartes ?? resumen.contextoPartes ?? 0} partes` : 'Revisar');
  setTexto('planPartes', `${resumenPartes.validadas ?? resumen.planPartesValidadas ?? 0}/${resumenPartes.totalPartes ?? resumen.planPartesTotal ?? 0}`);
  setTexto('planProveedorIA', tecnico.proveedor);
  setTexto('planEfectosVisuales', String(tecnico.efectosVisuales));
  setTexto('planAnimaciones', String(tecnico.animaciones));
  setTexto('planTipoSubtitulos', tecnico.tipoSubtitulos);
  setTexto('planEfectosAudio', tecnico.efectosAudioTexto);
  setTexto('planMusicaFondo', tecnico.musicaTexto);
  setTexto('planEditor', editorPlan.aprobado || resumen.planAprobadoParaProduccion ? 'Aprobado' : editorPlan.totalCambios ? 'Editado' : 'Pendiente');
  setTexto('planListo', resumen.listoParaProduccion && (editorPlan.aprobado || resumen.planAprobadoParaProduccion) ? 'Si' : 'Revisar');
}

function renderLectura(plan = {}) {
  const lectura = Array.isArray(plan.lectura) ? plan.lectura : [];
  const tecnico = construirResumenTecnico(plan);
  const lecturaTecnica = [
    `Resumen tecnico: ${tecnico.efectosVisuales} efecto(s) visual(es), ${tecnico.animaciones} animacion(es), subtitulos ${tecnico.tipoSubtitulos.toLowerCase()}, ${tecnico.efectosAudioTexto} y musica de fondo: ${tecnico.musicaTexto.toLowerCase()}.`
  ];
  const lecturaFinal = lectura.length ? [...lectura, ...lecturaTecnica] : lecturaTecnica;
  setTexto('planLecturaEstado', String(lecturaFinal.length));
  $('planLectura').innerHTML = lecturaFinal.length ? `<ol>${lecturaFinal.map((item) => `<li>${escapar(item)}</li>`).join('')}</ol>` : '<div class="plan-empty">El plan no tiene lectura editorial.</div>';
}

function renderFuente(plan = {}) {
  const fuente = plan.fuente || {};
  const necesidades = Array.isArray(fuente.necesidades) ? fuente.necesidades : [];
  const biblioteca = obtenerBiblioteca(plan);
  const contexto = obtenerContexto(plan);
  const partes = obtenerPlanPorPartes(plan);
  const resumenBiblioteca = biblioteca.resumen || {};
  const resumenContexto = contexto.resumen || contexto || {};
  const resumenPartes = partes.resumen || partes || {};
  const tecnico = construirResumenTecnico(plan);
  setTexto('planFuenteEstado', fuente.etapaOrigen ? 'Conectada' : 'Sin datos');
  $('planFuente').innerHTML = `
    <article><strong>Etapa origen</strong><span>${escapar(fuente.etapaOrigen || '-')}</span></article>
    <article><strong>Transcripcion</strong><span>${fuente.tieneTranscripcion ? 'Disponible' : 'Pendiente o conservadora'}</span></article>
    <article><strong>Momentos clave</strong><span>${escapar(fuente.momentosClave ?? 0)}</span></article>
    <article><strong>Biblioteca general</strong><span>${escapar(resumenBiblioteca.seleccionadosGeneral ?? 0)} seleccionados de ${escapar(resumenBiblioteca.totalGeneral ?? 0)}</span></article>
    <article><strong>Biblioteca proyecto</strong><span>${escapar(resumenBiblioteca.seleccionadosProyecto ?? 0)} seleccionados de ${escapar(resumenBiblioteca.totalProyecto ?? 0)}</span></article>
    <article><strong>Contexto IA</strong><span>${resumenContexto.listoParaIA ? 'Listo' : 'Pendiente'} - ${escapar(resumenContexto.totalPartes ?? 0)} partes</span></article>
    <article><strong>Plan por partes</strong><span>${escapar(resumenPartes.validadas ?? 0)}/${escapar(resumenPartes.totalPartes ?? 0)} validadas</span></article>
    <article><strong>Proveedor IA</strong><span>${escapar(tecnico.proveedor)}</span></article>
    <article><strong>Efectos visuales</strong><span>${escapar(tecnico.efectosVisuales)} efecto(s) incluyendo zooms si aplica</span></article>
    <article><strong>Animaciones</strong><span>${escapar(tecnico.animaciones)} animacion(es)</span></article>
    <article><strong>Subtitulos</strong><span>${escapar(tecnico.tipoSubtitulos)}</span></article>
    <article><strong>Audio</strong><span>${escapar(tecnico.efectosAudioTexto)} - musica fondo: ${escapar(tecnico.musicaTexto)}</span></article>
    <article><strong>Necesidades</strong><span>${necesidades.map(escapar).join(' - ') || 'Sin necesidades criticas'}</span></article>
  `;
}

function renderContexto(plan = {}) {
  const contexto = obtenerContexto(plan);
  const resumen = contexto.resumen || contexto || {};
  const contextoIA = plan.contextoIA || contexto.contextoIA || {};
  const transcripcion = contexto.transcripcion || {};
  const recursos = Array.isArray(contexto.recursosPlan) ? contexto.recursosPlan : [];
  const partes = Array.isArray(contexto.partesIncluidas) ? contexto.partesIncluidas : [];
  const estado = $('planContextoEstado');
  const detalle = $('planContextoDetalle');
  if (estado) estado.textContent = resumen.listoParaIA || contextoIA.listoParaIA ? 'Listo IA' : 'Sin datos';
  if (!detalle) return;
  if (!contexto || (!contexto.tipo && !resumen.totalPartes)) { detalle.innerHTML = '<div class="plan-empty">Sin contexto construido.</div>'; return; }
  detalle.innerHTML = `
    <article><strong>Partes absorbidas</strong><span>${escapar(partes.join(' - ') || `${resumen.totalPartes || 0} partes`)}</span></article>
    <article><strong>Transcripcion</strong><span>${transcripcion.textoDisponible || resumen.tieneTranscripcion ? 'Disponible' : 'Pendiente'} - ${escapar(resumen.segmentosTranscripcion || 0)} segmento(s)</span></article>
    <article><strong>Frames / Momentos</strong><span>${escapar(resumen.framesClave || 0)} frame(s) - ${escapar(resumen.momentosClave || 0)} momento(s)</span></article>
    <article><strong>Biblioteca para IA</strong><span>${escapar(resumen.recursosBibliotecaProyecto || 0)} temporales - ${escapar(resumen.recursosBibliotecaGeneral || 0)} generales - ${escapar(recursos.length)} recurso(s)</span></article>
    <article><strong>Salida esperada</strong><span>Resumen humano + JSON tecnico ejecutable</span></article>
    <article><strong>Prompt base</strong><span>${contextoIA.promptBase ? 'Preparado' : 'Pendiente'}</span></article>
  `;
}

function renderPartes(plan = {}) {
  const planPorPartes = obtenerPlanPorPartes(plan);
  const partes = Array.isArray(planPorPartes.partes) ? planPorPartes.partes : [];
  const resumen = planPorPartes.resumen || planPorPartes.progreso || {};
  const estado = $('planPartesEstado');
  const detalle = $('planPartesDetalle');
  if (estado) estado.textContent = `${resumen.validadas ?? resumen.completadas ?? 0}/${resumen.totalPartes ?? planPorPartes.totalPartes ?? partes.length}`;
  if (!detalle) return;
  if (!partes.length) { detalle.innerHTML = '<div class="plan-empty">Sin partes generadas.</div>'; return; }
  detalle.innerHTML = partes.map((parte) => `
    <article>
      <strong>${escapar(parte.orden)}. ${escapar(parte.titulo || parte.id)}</strong>
      <span>${escapar(parte.estado || 'generada')} - ${escapar(parte.proveedor || 'fallback')} - ${parte.validacion?.ok ? 'validada' : 'revisar'}</span>
      <small>${escapar(parte.resumenHumano || '')}</small>
    </article>
  `).join('');
}

function renderEditor(plan = {}) {
  const editorPlan = obtenerEditorPlan(plan);
  const planEjecutable = obtenerPlanEjecutable(plan);
  const acciones = Array.isArray(planEjecutable?.timeline) ? planEjecutable.timeline : [];
  const estado = $('planEditorEstado');
  const detalle = $('planEditorDetalle');
  const aprobarBtn = $('planAprobarBtn');
  if (estado) estado.textContent = editorPlan.aprobado ? 'Aprobado' : acciones.length ? 'En revision' : 'Sin datos';
  if (aprobarBtn) aprobarBtn.disabled = !acciones.length || Boolean(editorPlan.aprobado);
  if (!detalle) return;
  if (!acciones.length) { detalle.innerHTML = '<div class="plan-empty">Sin JSON tecnico para editar.</div>'; return; }
  detalle.innerHTML = `
    <article><strong>Estado</strong><span>${editorPlan.aprobado ? 'Aprobado para Produccion' : 'Pendiente de aprobacion'} - cambios: ${escapar(editorPlan.totalCambios || 0)}</span></article>
    ${acciones.slice(0, 40).map((accion) => `
      <article class="plan-editor-item" data-accion-id="${escapar(accion.id)}">
        <strong>${escapar(accion.orden || '')}. ${escapar(accion.accion || accion.tipo || 'accion')} · ${escapar(accion.inicio)}s-${escapar(accion.fin)}s</strong>
        <span>${escapar(accion.textoPantalla || accion.subtitulo || accion.efecto || accion.audio || accion.recursoBiblioteca || 'Sin texto visible')}</span>
        <small>${escapar(accion.motivo || '')}</small>
        <div class="plan-actions">
          <button type="button" class="secondary-button" data-editor-operacion="actualizar_accion" data-accion-id="${escapar(accion.id)}">Editar texto</button>
          <button type="button" class="secondary-button" data-editor-operacion="duplicar_accion" data-accion-id="${escapar(accion.id)}">Duplicar</button>
          <button type="button" class="secondary-button" data-editor-operacion="eliminar_accion" data-accion-id="${escapar(accion.id)}">Eliminar</button>
        </div>
      </article>
    `).join('')}
  `;
}

function renderTimeline(plan = {}) {
  const pistas = obtenerTimeline(plan);
  const elementos = obtenerElementos(plan);
  setTexto('planTimelineEstado', String(pistas.length || elementos.length));
  if (!pistas.length) {
    const agrupados = elementos.slice(0, 12);
    $('planTimeline').innerHTML = agrupados.length ? agrupados.map(renderTimelineItem).join('') : '<div class="plan-empty">No hay linea de tiempo cargada.</div>';
    return;
  }
  $('planTimeline').innerHTML = pistas.slice(0, 8).map((pista) => {
    const items = Array.isArray(pista.elementos) ? pista.elementos : Array.isArray(pista.items) ? pista.items : [];
    return `<article class="plan-track"><header><strong>${escapar(pista.nombre || pista.tipo || pista.id || 'Pista')}</strong><span>${items.length} item(s)</span></header>${items.slice(0, 8).map(renderTimelineItem).join('') || '<small>Sin elementos</small>'}</article>`;
  }).join('');
}

function renderTimelineItem(item = {}) {
  const inicio = numero(item.inicio);
  const fin = numero(item.fin);
  const bibliotecaDato = item.biblioteca || item.datos?.biblioteca || null;
  const biblioteca = bibliotecaDato ? ` - ${bibliotecaDato.origen || bibliotecaDato.alcance}` : '';
  return `<div class="plan-timeline-item"><span>${escapar(item.tipo || item.pista || 'item')}${escapar(biblioteca)}</span><strong>${escapar(item.nombre || item.titulo || item.id || 'Elemento')}</strong><small>${inicio !== null ? inicio + 's' : '-'} - ${fin !== null ? fin + 's' : '-'}</small></div>`;
}

function renderElementos(plan = {}) {
  const elementos = obtenerElementos(plan);
  setTexto('planElementosEstado', String(elementos.length));
  if (!elementos.length) { $('planElementos').innerHTML = '<div class="plan-empty">No hay elementos revisables en el plan.</div>'; return; }
  const rows = elementos.slice(0, 100).map((item) => {
    const biblioteca = item.biblioteca || item.datos?.biblioteca || null;
    const origen = biblioteca?.origen || biblioteca?.alcance || 'plan';
    const nombreBiblioteca = biblioteca?.nombre ? `<small>Biblioteca ${escapar(origen)}: ${escapar(biblioteca.nombre)}</small>` : '';
    return `<tr><td><strong>${escapar(item.nombre || item.titulo || item.id)}</strong><small>${escapar(item.descripcion || item.comentario || '')}</small>${nombreBiblioteca}</td><td>${escapar(item.tipo)}</td><td>${escapar(origen)}</td><td>${escapar(item.inicio ?? '-')}</td><td>${escapar(item.fin ?? '-')}</td><td><span class="plan-pill ${item.aprobado ? 'is-ok' : item.rechazado ? 'is-bad' : 'is-warn'}">${item.aprobado ? 'aprobado' : item.rechazado ? 'rechazado' : 'revision'}</span></td></tr>`;
  }).join('');
  $('planElementos').innerHTML = `<div class="plan-table-wrap"><table class="plan-table"><thead><tr><th>Elemento</th><th>Tipo</th><th>Origen</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderResultado(datos = {}) {
  const plan = extraerPlan(datos);
  renderKpis(plan);
  renderLectura(plan);
  renderFuente(plan);
  renderContexto(plan);
  renderPartes(plan);
  renderEditor(plan);
  renderTimeline(plan);
  renderElementos(plan);
  const editorPlan = obtenerEditorPlan(plan);
  const aprobado = Boolean(editorPlan.aprobado || plan.resumen?.planAprobadoParaProduccion);
  const listo = Boolean(plan.resumen?.listoParaProduccion || plan.validacion?.ok) && aprobado;
  const producirBtn = $('planProducirBtn');
  if (producirBtn) producirBtn.disabled = !listo;
  setChip(listo ? 'Aprobado' : aprobado ? 'Plan aprobado' : 'Revisar', listo ? 'ok' : 'warn');
}

async function cargarPlan() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Escribe o pega el proyectoId para cargar el plan.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Cargando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/plan`);
  if (!datos.resultado) { setMensaje('Todavia no existe plan para este proyecto. Presiona Crear plan.', 'warn'); setChip('Sin resultado', 'warn'); return; }
  renderResultado(datos);
  setMensaje('Plan cargado correctamente.', 'ok');
}

async function procesarPlan() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Primero necesitas el proyectoId creado en Nuevo proyecto.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Planificando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/plan/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-plan-edicion' }) });
  renderResultado(datos);
  const plan = extraerPlan(datos);
  const resumen = datos.biblioteca?.resumen || datos.resultado?.biblioteca?.resumen || {};
  const partes = datos.planPorPartes?.resumen || datos.resultado?.planPorPartes?.resumen || {};
  const tecnico = construirResumenTecnico(plan);
  setMensaje(datos.mensaje || `Plan creado: ${resumen.seleccionadosProyecto || 0} temporales, ${resumen.seleccionadosGeneral || 0} generales, ${partes.validadas || 0}/${partes.totalPartes || 0} partes, ${tecnico.efectosVisuales} efecto(s) visual(es), ${tecnico.animaciones} animacion(es), ${tecnico.efectosAudioTexto} y musica: ${tecnico.musicaTexto}. Revisa y aprueba antes de producir.`, 'ok');
}

async function editarPlan(operacion, accionId = '') {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId para editar.', 'warn'); return; }
  let cambios = {};
  if (operacion === 'actualizar_accion') {
    const nuevoTexto = window.prompt('Nuevo texto en pantalla para esta accion:');
    if (nuevoTexto === null) return;
    cambios = { textoPantalla: nuevoTexto, motivo: 'Texto editado manualmente desde la pantalla Plan.' };
  }
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/plan/editor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operacion, accionId, cambios, comentario: 'Editado desde UI Plan' })
  });
  setMensaje(datos.mensaje || 'Plan editado correctamente.', 'ok');
  await cargarPlan();
}

async function aprobarPlan() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId para aprobar.', 'warn'); return; }
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/plan/editor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operacion: 'aprobar_plan', comentario: 'Aprobado desde UI Plan' })
  });
  setMensaje(datos.mensaje || 'Plan aprobado para Produccion.', 'ok');
  await cargarPlan();
}

async function producirPlaceholder() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId para continuar.', 'warn'); return; }
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/produccion/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-plan-edicion' }) });
  setMensaje(datos.mensaje || 'Solicitud registrada.', 'ok');
}

function enlazarEventos() {
  const root = document.querySelector('[data-plan-root]');
  if (!root || root.dataset.planInicializado === '1') return;
  root.dataset.planInicializado = '1';
  const input = $('planProyectoId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  $('planCargarBtn')?.addEventListener('click', () => cargarPlan().catch((error) => setMensaje(error.message, 'error')));
  $('planProcesarBtn')?.addEventListener('click', () => procesarPlan().catch((error) => setMensaje(error.message, 'error')));
  $('planAprobarBtn')?.addEventListener('click', () => aprobarPlan().catch((error) => setMensaje(error.message, 'error')));
  $('planProducirBtn')?.addEventListener('click', () => producirPlaceholder().catch((error) => setMensaje(error.message, 'error')));
  $('planEditorDetalle')?.addEventListener('click', (evento) => {
    const boton = evento.target?.closest?.('[data-editor-operacion]');
    if (!boton) return;
    editarPlan(boton.dataset.editorOperacion, boton.dataset.accionId || '').catch((error) => setMensaje(error.message, 'error'));
  });
}

export function inicializarPlanEdicionUI() {
  if (typeof document === 'undefined') return;
  enlazarEventos();
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'plan-edicion') setTimeout(enlazarEventos, 0);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarPlanEdicionUI);
}
