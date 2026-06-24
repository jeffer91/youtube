/*
  Nombre completo: resultado-edicion-dinamica.js
  Ruta: /app/resultado-edicion-dinamica.js

  Función:
  - Crear un resumen claro de la edición dinámica.
  - Mostrar porcentajes de impacto si existen.
*/

function numero(valor, respaldo = 0) { const n = Number(valor); return Number.isFinite(n) ? n : respaldo; }
function formatoSegundos(valor) { const segundos = numero(valor, 0); if (segundos <= 0) return '0 s'; if (segundos < 60) return `${segundos.toFixed(1)} s`; const min = Math.floor(segundos / 60); const sec = Math.round(segundos % 60); return `${min} min ${sec} s`; }
function opcionActiva(datos = {}, clave) { const opciones = datos.opcionesProcesamiento || datos.resumenProcesamiento?.opcionesProcesamiento || {}; return opciones[clave] === true; }
function estaOmitidoPorUsuario(objeto) { return objeto?.omitido === true || objeto?.activo === false; }
function textoEstadoModulo(nombre, activo, modulo = null, cantidad = null) { if (!activo) return `${nombre}: omitido por selección`; const impacto = modulo ? ` · impacto ${modulo.impacto ?? 0}%` : ''; if (cantidad !== null && cantidad !== undefined) return `${nombre}: ${cantidad}${impacto}`; return `${nombre}: ${modulo?.impacto !== undefined ? 'aplicado' : 'sin cambios'}${impacto}`; }

export function obtenerResumenEdicionDinamica(datos = {}) {
  const dinamica = datos.edicionDinamica || datos.edicion?.edicionDinamica || null;
  const edicion = datos.edicion || null;
  const resultado = datos.resultado || null;
  const m = datos.reporteImpacto?.modulos || {};
  const cortesActivos = opcionActiva(datos, 'cortes');
  const zoomsActivos = opcionActiva(datos, 'zooms');
  const barraActiva = opcionActiva(datos, 'barraProgreso');
  const etiquetasActivas = opcionActiva(datos, 'etiquetasVisuales');
  const sonidosActivos = opcionActiva(datos, 'sonidos');

  if (!cortesActivos) return `Edición dinámica: omitida por selección del usuario. No se aplicaron cortes automáticos. Impacto ${m.cortes?.impacto ?? 0}%.`;
  if (!dinamica) return 'Edición dinámica: no se recibió información del módulo.';
  if (estaOmitidoPorUsuario(dinamica)) return `Edición dinámica: omitida. ${dinamica.motivo || dinamica.mensaje || 'No se aplicaron cortes dinámicos.'} Impacto ${m.cortes?.impacto ?? 0}%.`.trim();

  const cortes = dinamica.cortes?.resumen || {};
  const visual = edicion?.visualDinamico || dinamica.visual || null;
  const sonidos = edicion?.sonidos || dinamica.sonidos || null;
  const audioTipo = resultado?.audio?.tipo || null;
  const cantidadCortes = numero(cortes.cantidadCortesAplicados, 0);
  const segundosEliminados = numero(cortes.segundosEliminados, 0);
  const partes = [];
  partes.push(`Cortes: impacto ${m.cortes?.impacto ?? dinamica.impactoEdicionDinamica?.impacto ?? 0}%`);
  partes.push(`Silencios cortados: ${cantidadCortes}`);
  partes.push(`Tiempo reducido: ${formatoSegundos(segundosEliminados)}`);
  const eventosVisuales = numero(visual?.eventosVisuales?.length, 0);
  const cantidadSonidos = numero(sonidos?.eventosSonido?.length, 0);
  partes.push(textoEstadoModulo('Zooms', zoomsActivos, m.zooms));
  partes.push(textoEstadoModulo('Barra', barraActiva, m.barraProgreso));
  partes.push(textoEstadoModulo('Etiquetas', etiquetasActivas, m.etiquetasVisuales, eventosVisuales || null));
  partes.push(textoEstadoModulo('Sonidos', sonidosActivos, m.sonidos, cantidadSonidos));
  if (audioTipo) partes.push(`Audio final: ${audioTipo}`);
  return `Edición dinámica: ${partes.join(' · ')}.`;
}

export default obtenerResumenEdicionDinamica;
