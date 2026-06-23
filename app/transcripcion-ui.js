function $(id) {
  return document.getElementById(id);
}

function obtenerElementos() {
  return {
    crearTranscripcion: $('createTranscription'),
    agregarSubtitulos: $('addSubtitles'),
    agregarTextosFlotantes: $('addFloatingTexts'),
    textoManual: $('manualTranscriptText'),
    estiloSubtitulos: $('subtitleStyle'),
    estiloTextosFlotantes: $('floatingTextStyle'),
    maxTextosFlotantes: $('maxFloatingTexts'),
    idiomaTranscripcion: $('transcriptionLanguage')
  };
}

function sincronizarDisponibilidad(elementos) {
  const activa = Boolean(elementos.crearTranscripcion?.checked);
  [elementos.agregarSubtitulos, elementos.agregarTextosFlotantes, elementos.textoManual, elementos.estiloSubtitulos, elementos.estiloTextosFlotantes, elementos.maxTextosFlotantes, elementos.idiomaTranscripcion].forEach((elemento) => {
    if (elemento) elemento.disabled = !activa;
  });
}

export function obtenerOpcionesTranscripcion() {
  const elementos = obtenerElementos();
  return {
    crearTranscripcion: elementos.crearTranscripcion?.checked ? 'true' : 'false',
    agregarSubtitulos: elementos.agregarSubtitulos?.checked ? 'true' : 'false',
    agregarTextosFlotantes: elementos.agregarTextosFlotantes?.checked ? 'true' : 'false',
    textoTranscripcionManual: elementos.textoManual?.value?.trim() || '',
    estiloSubtitulos: elementos.estiloSubtitulos?.value || 'tiktok-profesional',
    estiloTextosFlotantes: elementos.estiloTextosFlotantes?.value || 'badge',
    maxTextosFlotantes: elementos.maxTextosFlotantes?.value || '6',
    idiomaTranscripcion: elementos.idiomaTranscripcion?.value || 'es',
    modoTranscripcion: 'manual'
  };
}

export function bloquearControlesTranscripcion(bloquear) {
  const elementos = obtenerElementos();
  Object.values(elementos).forEach((elemento) => {
    if (elemento) elemento.disabled = bloquear;
  });
  if (!bloquear) sincronizarDisponibilidad(elementos);
}

export function inicializarTranscripcionUI() {
  const elementos = obtenerElementos();
  if (!elementos.crearTranscripcion) return;
  elementos.crearTranscripcion.addEventListener('change', () => sincronizarDisponibilidad(elementos));
  sincronizarDisponibilidad(elementos);
}

export default inicializarTranscripcionUI;
