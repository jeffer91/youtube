/* =========================================================
Nombre completo: tr-tiempo.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/helpers/tr-tiempo.js
Funciones principales:
- Convertir segundos a formatos legibles.
- Convertir segundos a formato SRT.
- Normalizar tiempos de segmentos de transcripción.
- Evitar tiempos negativos o inválidos.
Con qué se conecta:
- tr-srt.js
- tr-resultado.js
- tr-service.js
========================================================= */

export function normalizarSegundosTR(valor, respaldo = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return Math.max(0, Number(respaldo) || 0);
  }

  return numero;
}

export function redondearSegundosTR(valor) {
  return Math.round(normalizarSegundosTR(valor) * 1000) / 1000;
}

function obtenerPartesTiempoTR(segundosEntrada) {
  const totalMilisegundos = Math.max(0, Math.round(normalizarSegundosTR(segundosEntrada) * 1000));
  const horas = Math.floor(totalMilisegundos / 3600000);
  const minutos = Math.floor((totalMilisegundos % 3600000) / 60000);
  const segundos = Math.floor((totalMilisegundos % 60000) / 1000);
  const milisegundos = totalMilisegundos % 1000;

  return {
    horas,
    minutos,
    segundos,
    milisegundos
  };
}

export function formatearTiempoCortoTR(segundosEntrada) {
  const partes = obtenerPartesTiempoTR(segundosEntrada);
  const minutosTotales = partes.horas * 60 + partes.minutos;

  return `${String(minutosTotales).padStart(2, "0")}:${String(partes.segundos).padStart(2, "0")}`;
}

export function formatearTiempoLargoTR(segundosEntrada) {
  const partes = obtenerPartesTiempoTR(segundosEntrada);

  return `${String(partes.horas).padStart(2, "0")}:${String(partes.minutos).padStart(2, "0")}:${String(partes.segundos).padStart(2, "0")}`;
}

export function formatearTiempoSrtTR(segundosEntrada) {
  const partes = obtenerPartesTiempoTR(segundosEntrada);

  return [
    String(partes.horas).padStart(2, "0"),
    String(partes.minutos).padStart(2, "0"),
    String(partes.segundos).padStart(2, "0")
  ].join(":") + `,${String(partes.milisegundos).padStart(3, "0")}`;
}

export function parsearTiempoTR(valor) {
  const texto = String(valor || "").trim().replace(",", ".");

  if (!texto) {
    return 0;
  }

  if (/^\d+(\.\d+)?$/.test(texto)) {
    return normalizarSegundosTR(Number(texto));
  }

  const partes = texto.split(":").map((parte) => parte.trim());

  if (partes.length === 2) {
    const minutos = Number(partes[0]);
    const segundos = Number(partes[1]);
    return normalizarSegundosTR((minutos * 60) + segundos);
  }

  if (partes.length === 3) {
    const horas = Number(partes[0]);
    const minutos = Number(partes[1]);
    const segundos = Number(partes[2]);
    return normalizarSegundosTR((horas * 3600) + (minutos * 60) + segundos);
  }

  return 0;
}

export function normalizarSegmentoTiempoTR(segmento, indice = 0) {
  const inicio = redondearSegundosTR(segmento?.inicio ?? segmento?.start ?? 0);
  const finOriginal = segmento?.fin ?? segmento?.end ?? inicio + 3;
  const fin = Math.max(inicio + 0.5, redondearSegundosTR(finOriginal));

  return {
    id: segmento?.id || `segmento-${indice + 1}`,
    indice: indice + 1,
    inicio,
    fin,
    duracion: redondearSegundosTR(fin - inicio),
    inicioTexto: formatearTiempoCortoTR(inicio),
    finTexto: formatearTiempoCortoTR(fin),
    inicioSrt: formatearTiempoSrtTR(inicio),
    finSrt: formatearTiempoSrtTR(fin)
  };
}

export function normalizarSegmentosTiempoTR(segmentos) {
  if (!Array.isArray(segmentos)) {
    return [];
  }

  let ultimoFin = 0;

  return segmentos.map((segmento, indice) => {
    const normalizado = normalizarSegmentoTiempoTR(segmento, indice);
    const inicio = Math.max(ultimoFin, normalizado.inicio);
    const fin = Math.max(inicio + 0.5, normalizado.fin);

    ultimoFin = fin;

    return {
      ...normalizado,
      inicio,
      fin,
      duracion: redondearSegundosTR(fin - inicio),
      inicioTexto: formatearTiempoCortoTR(inicio),
      finTexto: formatearTiempoCortoTR(fin),
      inicioSrt: formatearTiempoSrtTR(inicio),
      finSrt: formatearTiempoSrtTR(fin)
    };
  });
}

export function estimarDuracionPorTextoTR(texto, palabrasPorMinuto = 145) {
  const palabras = String(texto || "").trim().split(/\s+/).filter(Boolean).length;
  const ppm = Math.max(90, Math.min(210, Number(palabrasPorMinuto) || 145));

  if (!palabras) {
    return 0;
  }

  return redondearSegundosTR((palabras / ppm) * 60);
}
