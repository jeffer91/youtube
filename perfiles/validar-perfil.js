import { PERFILES_VISUALES } from './perfiles.config.js';

function esObjeto(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function agregarError(errores, condicion, mensaje) {
  if (!condicion) errores.push(mensaje);
}

export function validarPerfilVisual(perfil = {}) {
  const errores = [];
  const advertencias = [];

  agregarError(errores, esObjeto(perfil), 'El perfil debe ser un objeto.');
  if (!esObjeto(perfil)) return { ok: false, errores, advertencias };

  agregarError(errores, typeof perfil.id === 'string' && perfil.id.trim().length > 0, 'El perfil debe tener id.');
  agregarError(errores, typeof perfil.nombre === 'string' && perfil.nombre.trim().length > 0, 'El perfil debe tener nombre.');
  agregarError(errores, esObjeto(perfil.transcripcion), 'El perfil debe tener bloque transcripcion.');
  agregarError(errores, esObjeto(perfil.edicion), 'El perfil debe tener bloque edicion.');
  agregarError(errores, esObjeto(perfil.sonido), 'El perfil debe tener bloque sonido.');
  agregarError(errores, esObjeto(perfil.visual), 'El perfil debe tener bloque visual.');

  if (perfil.transcripcion) {
    agregarError(errores, typeof perfil.transcripcion.estiloSubtitulos === 'string', 'El perfil debe definir estiloSubtitulos.');
    agregarError(errores, typeof perfil.transcripcion.estiloTextosFlotantes === 'string', 'El perfil debe definir estiloTextosFlotantes.');
    agregarError(errores, Number.isFinite(Number(perfil.transcripcion.maxTextosFlotantes)), 'El perfil debe definir maxTextosFlotantes numérico.');
  }

  if (perfil.edicion) {
    agregarError(errores, Number.isFinite(Number(perfil.edicion.nivelEdicion)), 'El perfil debe definir nivelEdicion numérico.');
    agregarError(errores, typeof perfil.edicion.intensidadEdicion === 'string', 'El perfil debe definir intensidadEdicion.');
  }

  if (perfil.sonido) {
    agregarError(errores, Number.isFinite(Number(perfil.sonido.volumenSonidosEdicion)), 'El perfil debe definir volumenSonidosEdicion numérico.');
  }

  if (perfil.visual) {
    agregarError(errores, typeof perfil.visual.colorPrincipal === 'string', 'El perfil debe definir colorPrincipal.');
  }

  return {
    ok: errores.length === 0,
    errores,
    advertencias
  };
}

export function validarTodosLosPerfiles() {
  const resultados = Object.entries(PERFILES_VISUALES).map(([id, perfil]) => ({ id, ...validarPerfilVisual(perfil) }));
  const errores = resultados.flatMap((resultado) => resultado.errores.map((error) => `${resultado.id}: ${error}`));
  return {
    ok: errores.length === 0,
    resultados,
    errores
  };
}

export default validarPerfilVisual;
