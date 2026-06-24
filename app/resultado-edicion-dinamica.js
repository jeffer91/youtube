/*
  Nombre completo: resultado-edicion-dinamica.js
  Ruta: /app/resultado-edicion-dinamica.js

  Función:
  - Crear un resumen claro de la edición dinámica.
  - Evitar que una función omitida por checklist parezca error.
*/

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function formatoSegundos(valor) {
  const segundos = numero(valor, 0);
  if (segundos <= 0) return '0 s';
  if (segundos < 60) return `${segundos.toFixed(1)} s`;
  const min = Math.floor(segundos / 60);
  const sec = Math.round(segundos % 60);
  return `${min} min ${sec} s`;
}

function opcionActiva(datos = {}, clave) {
  const opciones = datos.opcionesProcesamiento || datos.resumenProcesamiento?.opcionesProcesamiento || {};
  return opciones[clave] === true;
}

function estaOmitidoPorUsuario(objeto) {
  return objeto?.omitido === true || objeto?.activo === false;
}

function textoEstadoModulo(nombre, activo, aplicado, cantidad = null) {
  if (!activo) return `${nombre}: omitido por selección`;
  if (aplicado && cantidad !== null) return `${nombre}: ${cantidad}`;
  if (aplicado) return `${nombre}: aplicado`;
  return `${nombre}: sin cambios`;
}

export function obtenerResumenEdicionDinamica(datos = {}) {
  const dinamica = datos.edicionDinamica || datos.edicion?.edicionDinamica || null;
  const edicion = datos.edicion || null;
  const resultado = datos.resultado || null;

  const cortesActivos = opcionActiva(datos, 'cortes');
  const zoomsActivos = opcionActiva(datos, 'zooms');
  const barraActiva = opcionActiva(datos, 'barraProgreso');
  const etiquetasActivas = opcionActiva(datos, 'etiquetasVisuales');
  const sonidosActivos = opcionActiva(datos, 'sonidos');

  if (!cortesActivos) {
    return 'Edición dinámica: omitida por selección del usuario. No se aplicaron cortes automáticos.';
  }

  if (!dinamica) {
    return 'Edición dinámica: no se recibió información del módulo.';
  }

  if (estaOmitidoPorUsuario(dinamica)) {
    return `Edición dinámica: omitida. ${dinamica.motivo || dinamica.mensaje || 'No se aplicaron cortes dinámicos.'}`.trim();
  }

  const cortes = dinamica.cortes?.resumen || {};
  const visual = edicion?.visualDinamico || dinamica.visual || null;
  const sonidos = edicion?.sonidos || dinamica.sonidos || null;
  const audioTipo = resultado?.audio?.tipo || null;

  const cantidadCortes = numero(cortes.cantidadCortesAplicados, 0);
  const segundosEliminados = numero(cortes.segundosEliminados, 0);
  const partes = [];

  partes.push(`Silencios cortados: ${cantidadCortes}`);
  partes.push(`Tiempo reducido: ${formatoSegundos(segundosEliminados)}`);

  const visualAplicado = visual && !visual.omitido;
  const eventosVisuales = numero(visual?.eventosVisuales?.length, 0);

  partes.push(textoEstadoModulo('Zooms', zoomsActivos, visualAplicado && zoomsActivos));
  partes.push(textoEstadoModulo('Barra', barraActiva, visualAplicado && barraActiva));
  partes.push(textoEstadoModulo('Etiquetas', etiquetasActivas, visualAplicado && etiquetasActivas, eventosVisuales || null));

  const sonidosAplicados = sonidos && !sonidos.omitido;
  const cantidadSonidos = numero(sonidos?.eventosSonido?.length, 0);
  partes.push(textoEstadoModulo('Sonidos', sonidosActivos, sonidosAplicados, cantidadSonidos));

  if (audioTipo) partes.push(`Audio final: ${audioTipo}`);

  return `Edición dinámica: ${partes.join(' · ')}.`;
}

export default obtenerResumenEdicionDinamica;
