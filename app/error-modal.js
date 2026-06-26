const elementosModal = {
  modal: () => document.getElementById('errorModal'),
  title: () => document.getElementById('errorModalTitle'),
  stage: () => document.getElementById('errorModalStage'),
  detail: () => document.getElementById('errorModalDetail'),
  file: () => document.getElementById('errorModalFile'),
  recommendation: () => document.getElementById('errorModalRecommendation'),
  close: () => document.getElementById('closeErrorModal')
};

let ultimoError = null;

function obtenerEtapa(error = {}) {
  return error.etapa || error.stage || error.error?.etapa || 'desconocida';
}

function obtenerFormulario() {
  return document.getElementById('videoForm');
}

function asegurarInputReintento(nombre, valor) {
  const form = obtenerFormulario();
  if (!form) return;
  let input = form.querySelector(`input[name="${nombre}"]`);
  if (!input) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = nombre;
    form.appendChild(input);
  }
  input.value = valor || '';
}

function crearBotonReintento() {
  const modal = elementosModal.modal();
  const card = modal?.querySelector('.modal-card');
  if (!card) return null;
  let boton = document.getElementById('retryStageButton');
  if (!boton) {
    boton = document.createElement('button');
    boton.id = 'retryStageButton';
    boton.type = 'button';
    boton.className = 'primary-button';
    boton.textContent = 'Reintentar etapa';
    boton.style.marginTop = '12px';
    card.appendChild(boton);
  }
  return boton;
}

function puedeReintentar(error = {}) {
  const etapa = obtenerEtapa(error);
  if (etapa === 'diagnostico') return false;
  return true;
}

export function mostrarModalErrorEdicion(error = {}) {
  const modal = elementosModal.modal();
  if (!modal) return;
  ultimoError = error;

  elementosModal.title().textContent = error.titulo || 'Fallo de edición';
  elementosModal.stage().textContent = `Etapa: ${obtenerEtapa(error)}`;
  elementosModal.detail().textContent = error.detalle || error.mensaje || error.error?.mensaje || 'No se recibió detalle del error.';
  elementosModal.file().textContent = `Archivo sugerido: ${error.archivo || 'no identificado'}`;
  elementosModal.recommendation().textContent = error.recomendacion || (error.archivo ? `Revisar ${error.archivo}` : 'Revisar el diagnóstico y el historial de edición.');

  const boton = crearBotonReintento();
  if (boton) {
    boton.hidden = !puedeReintentar(error);
    boton.disabled = !puedeReintentar(error);
  }

  modal.hidden = false;
}

export function ocultarModalErrorEdicion() {
  const modal = elementosModal.modal();
  if (modal) modal.hidden = true;
}

function reintentarUltimaEtapa() {
  if (!ultimoError || !puedeReintentar(ultimoError)) return;
  const etapa = obtenerEtapa(ultimoError);
  asegurarInputReintento('reintentarDesdeEtapa', etapa);
  asegurarInputReintento('reintentoMotivo', ultimoError.detalle || ultimoError.mensaje || 'Reintento manual desde ventana de error.');
  ocultarModalErrorEdicion();
  document.dispatchEvent(new CustomEvent('autovideo:reintentar-etapa', { detail: { error: ultimoError, etapa } }));
  const form = obtenerFormulario();
  if (form?.requestSubmit) form.requestSubmit();
}

export function inicializarModalErrorEdicion() {
  const modal = elementosModal.modal();
  const close = elementosModal.close();
  if (!modal || !close) return;
  close.addEventListener('click', ocultarModalErrorEdicion);
  crearBotonReintento()?.addEventListener('click', reintentarUltimaEtapa);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) ocultarModalErrorEdicion();
  });
}

export default { inicializarModalErrorEdicion, mostrarModalErrorEdicion, ocultarModalErrorEdicion };
