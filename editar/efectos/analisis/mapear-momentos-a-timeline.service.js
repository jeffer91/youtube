/*
  Bloque 2: Analisis de contexto visual
  Funcion: normalizar momentos importantes en una linea de tiempo segura.
*/

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function redondear(valor) {
  return Math.round(numero(valor, 0) * 1000) / 1000;
}

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, numero(valor, minimo)));
}

function obtenerTextoMomento(momento = {}, respaldo = '') {
  return String(momento.texto || momento.titulo || momento.frase || momento.label || respaldo || '').replace(/\s+/g, ' ').trim();
}

export function normalizarMomentoTimeline(momento = {}, { duracion = 0, index = 0, origen = 'desconocido' } = {}) {
  const duracionVideo = Math.max(0, numero(duracion, 0));
  const inicioBase = numero(momento.inicio ?? momento.start ?? momento.tiempo ?? momento.segundo, index * 4);
  const inicio = limitar(inicioBase, 0, Math.max(0, duracionVideo - 0.2));
  const finBase = numero(momento.fin ?? momento.end, inicio + numero(momento.duracion, 2));
  const fin = limitar(finBase, inicio + 0.8, duracionVideo || inicio + 2.0);

  return {
    id: `${origen}-${index + 1}`,
    origen,
    inicio: redondear(inicio),
    fin: redondear(fin),
    duracion: redondear(fin - inicio),
    texto: obtenerTextoMomento(momento, `Momento ${index + 1}`),
    prioridad: numero(momento.prioridad, 50 + index),
    tipo: momento.tipo || 'momento-clave',
    motivo: momento.motivo || `Momento generado desde ${origen}.`
  };
}

export function mapearMomentosATimeline(momentos = [], { duracion = 0, origen = 'desconocido', maximo = 16 } = {}) {
  if (!Array.isArray(momentos) || momentos.length === 0) return [];
  return momentos
    .slice(0, Math.max(1, numero(maximo, 16)))
    .map((momento, index) => normalizarMomentoTimeline(momento, { duracion, index, origen }))
    .filter((momento) => momento.fin > momento.inicio)
    .sort((a, b) => a.inicio - b.inicio || a.prioridad - b.prioridad);
}

export default mapearMomentosATimeline;
