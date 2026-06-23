const elementosModal = {
  modal: () => document.getElementById('errorModal'),
  title: () => document.getElementById('errorModalTitle'),
  stage: () => document.getElementById('errorModalStage'),
  detail: () => document.getElementById('errorModalDetail'),
  file: () => document.getElementById('errorModalFile'),
  recommendation: () => document.getElementById('errorModalRecommendation'),
  close: () => document.getElementById('closeErrorModal')
};

export function mostrarModalErrorEdicion(error = {}) {
  const modal = elementosModal.modal();
  if (!modal) return;

  elementosModal.title().textContent = error.titulo || 'Fallo de edición';
  elementosModal.stage().textContent = `Etapa: ${error.etapa || 'desconocida'}`;
  elementosModal.detail().textContent = error.detalle || error.mensaje || error.error?.mensaje || 'No se recibió detalle del error.';
  elementosModal.file().textContent = `Archivo sugerido: ${error.archivo || 'no identificado'}`;
  elementosModal.recommendation().textContent = error.recomendacion || (error.archivo ? `Revisar ${error.archivo}` : 'Revisar el diagnóstico y el historial de edición.');
  modal.hidden = false;
}

export function ocultarModalErrorEdicion() {
  const modal = elementosModal.modal();
  if (modal) modal.hidden = true;
}

export function inicializarModalErrorEdicion() {
  const modal = elementosModal.modal();
  const close = elementosModal.close();
  if (!modal || !close) return;
  close.addEventListener('click', ocultarModalErrorEdicion);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) ocultarModalErrorEdicion();
  });
}

export default { inicializarModalErrorEdicion, mostrarModalErrorEdicion, ocultarModalErrorEdicion };
