import { obtenerPerfilVisual } from './obtener-perfil.service.js';

function convertirBooleano(valor, respaldo = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return respaldo;
}

function numero(valor, respaldo) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function aplicarSoloSiFalta(actual, valorPerfil) {
  if (actual === undefined || actual === null || actual === '') return valorPerfil;
  return actual;
}

export function aplicarPerfilVisualAOpciones(opciones = {}) {
  const idPerfil = opciones.perfilVisual || opciones.perfil || 'educacion';
  const perfil = obtenerPerfilVisual(idPerfil);
  const forzarPerfil = convertirBooleano(opciones.forzarPerfilVisual ?? opciones.aplicarPerfilVisual, true);

  const salida = {
    ...opciones,
    perfilVisual: perfil.id,
    perfilAplicado: perfil,
    perfilVisualAplicado: true,
    perfilVisualForzado: forzarPerfil
  };

  if (forzarPerfil) {
    salida.estiloSubtitulos = perfil.transcripcion.estiloSubtitulos;
    salida.estiloTextosFlotantes = perfil.transcripcion.estiloTextosFlotantes;
    salida.maxTextosFlotantes = perfil.transcripcion.maxTextosFlotantes;
    salida.agregarSubtitulos = perfil.transcripcion.agregarSubtitulos;
    salida.agregarTextosFlotantes = perfil.transcripcion.agregarTextosFlotantes;

    salida.nivelEdicion = perfil.edicion.nivelEdicion;
    salida.intensidadEdicion = perfil.edicion.intensidadEdicion;
    salida.modoEdicionDinamica = perfil.edicion.modoEdicionDinamica;
    salida.cortarSilencios = perfil.edicion.cortarSilencios;
    salida.agregarZooms = perfil.edicion.agregarZooms;
    salida.agregarPunchIn = perfil.edicion.agregarPunchIn;
    salida.agregarBarraProgreso = perfil.edicion.agregarBarraProgreso;
    salida.agregarEtiquetasVisuales = perfil.edicion.agregarEtiquetasVisuales;

    salida.agregarSonidosEdicion = perfil.sonido.agregarSonidosEdicion;
    salida.modoSonidosEdicion = perfil.sonido.modoSonidosEdicion;
    salida.volumenSonidosEdicion = perfil.sonido.volumenSonidosEdicion;
    salida.separacionMinimaSonidos = perfil.sonido.separacionMinimaSonidos;
    salida.cantidadMaximaSonidos = perfil.sonido.cantidadMaximaSonidos;
  } else {
    salida.estiloSubtitulos = aplicarSoloSiFalta(salida.estiloSubtitulos, perfil.transcripcion.estiloSubtitulos);
    salida.estiloTextosFlotantes = aplicarSoloSiFalta(salida.estiloTextosFlotantes, perfil.transcripcion.estiloTextosFlotantes);
    salida.maxTextosFlotantes = numero(salida.maxTextosFlotantes, perfil.transcripcion.maxTextosFlotantes);
    salida.nivelEdicion = numero(salida.nivelEdicion, perfil.edicion.nivelEdicion);
    salida.intensidadEdicion = aplicarSoloSiFalta(salida.intensidadEdicion, perfil.edicion.intensidadEdicion);
    salida.modoEdicionDinamica = aplicarSoloSiFalta(salida.modoEdicionDinamica, perfil.edicion.modoEdicionDinamica);
  }

  salida.colorPrincipalPerfil = perfil.visual.colorPrincipal;
  salida.colorSecundarioPerfil = perfil.visual.colorSecundario;
  salida.fuentePerfil = perfil.visual.fuente;
  salida.tonoPerfil = perfil.visual.tono;

  return salida;
}

export default aplicarPerfilVisualAOpciones;
