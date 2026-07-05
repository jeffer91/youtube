/* =========================================================
Nombre completo: ma-audio-analisis.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/electron/ma-audio-analisis.js
Funciones principales:
- Analizar el video antes de aplicar filtros de audio.
- Confirmar si el archivo tiene video y pista de audio.
- Medir volumen promedio y picos.
- Detectar silencios largos.
- Estimar dificultad de limpieza del audio.
- Recomendar si conviene DSP, IA o limpieza extrema.
- Evitar procesar todos los videos a ciegas.
Con qué se conecta:
- ma-audio-electron.js
- ma-ffmpeg-runner.js
- ma-audio-filtros.js
- ma-audio-decision.js
========================================================= */

const {
  inspeccionarEntrada,
  medirAudioVolumen,
  detectarSilencios
} = require("./ma-ffmpeg-runner.js");

function numeroSeguro(valor, respaldo = null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function redondear(valor, decimales = 2) {
  const numero = numeroSeguro(valor, 0);
  const factor = Math.pow(10, decimales);

  return Math.round(numero * factor) / factor;
}

function clasificarVolumenPromedio(meanVolume) {
  const valor = numeroSeguro(meanVolume);

  if (valor === null) {
    return "desconocido";
  }

  if (valor <= -36) {
    return "muy_bajo";
  }

  if (valor <= -27) {
    return "bajo";
  }

  if (valor <= -15) {
    return "normal";
  }

  return "alto";
}

function clasificarPicos(maxVolume) {
  const valor = numeroSeguro(maxVolume);

  if (valor === null) {
    return "desconocido";
  }

  if (valor >= -0.5) {
    return "riesgo_saturacion";
  }

  if (valor >= -2.5) {
    return "altos";
  }

  if (valor <= -10) {
    return "bajos";
  }

  return "controlados";
}

function calcularRangoDinamicoEstimado(meanVolume, maxVolume) {
  const promedio = numeroSeguro(meanVolume);
  const pico = numeroSeguro(maxVolume);

  if (promedio === null || pico === null) {
    return null;
  }

  return redondear(Math.abs(pico - promedio), 2);
}

function clasificarRangoDinamico(rango) {
  const valor = numeroSeguro(rango);

  if (valor === null) {
    return "desconocido";
  }

  if (valor >= 30) {
    return "muy_variable";
  }

  if (valor >= 19) {
    return "variable";
  }

  if (valor <= 8) {
    return "aplastado";
  }

  return "estable";
}

function calcularDuracionSilencioTotal(silencios) {
  if (!Array.isArray(silencios)) {
    return 0;
  }

  const total = silencios.reduce((acumulado, silencio) => {
    return acumulado + (numeroSeguro(silencio?.duracion, 0) || 0);
  }, 0);

  return redondear(total, 3);
}

function calcularPorcentajeSilencio(silencios, duracionSegundos) {
  const duracion = numeroSeguro(duracionSegundos, 0);

  if (!duracion) {
    return 0;
  }

  const totalSilencio = calcularDuracionSilencioTotal(silencios);
  return redondear((totalSilencio / duracion) * 100, 2);
}

function obtenerSilencioMasLargo(silencios) {
  if (!Array.isArray(silencios) || !silencios.length) {
    return 0;
  }

  const mayor = silencios.reduce((maximo, silencio) => {
    const duracion = numeroSeguro(silencio?.duracion, 0);
    return Math.max(maximo, duracion);
  }, 0);

  return redondear(mayor, 3);
}

function clasificarSilencio(porcentajeSilencio) {
  const valor = numeroSeguro(porcentajeSilencio, 0);

  if (valor >= 45) {
    return "mucho_silencio";
  }

  if (valor >= 20) {
    return "silencio_medio";
  }

  return "poco_silencio";
}

function estimarRuidoPorDiagnostico({
  volumenPromedio,
  rangoDinamico,
  porcentajeSilencio,
  silencioMasLargo
}) {
  if (volumenPromedio === "muy_bajo") {
    return "alto";
  }

  if (volumenPromedio === "bajo" && rangoDinamico !== "aplastado") {
    return "medio";
  }

  if (porcentajeSilencio >= 35 && silencioMasLargo >= 2) {
    return "medio";
  }

  return "bajo";
}

function estimarNecesidadReduccionRuido({
  ruidoEstimado,
  volumenPromedio,
  porcentajeSilencio
}) {
  if (ruidoEstimado === "alto" || volumenPromedio === "muy_bajo") {
    return "alta";
  }

  if (ruidoEstimado === "medio" || volumenPromedio === "bajo" || porcentajeSilencio >= 30) {
    return "media";
  }

  return "suave";
}

function estimarNecesidadCompresion({
  volumenPromedio,
  rangoDinamico,
  picos
}) {
  if (picos === "riesgo_saturacion") {
    return "suave";
  }

  if (rangoDinamico === "muy_variable") {
    return "alta";
  }

  if (rangoDinamico === "variable") {
    return "media";
  }

  if (volumenPromedio === "muy_bajo" || volumenPromedio === "bajo") {
    return "media";
  }

  if (rangoDinamico === "aplastado") {
    return "suave";
  }

  return "media";
}

function estimarNecesidadNormalizacion({
  volumenPromedio,
  picos
}) {
  if (volumenPromedio === "muy_bajo" || volumenPromedio === "bajo") {
    return "alta";
  }

  if (picos === "riesgo_saturacion") {
    return "controlar_picos";
  }

  return "media";
}

function estimarNivelDificultad({
  ruidoEstimado,
  necesidadReduccionRuido,
  rangoDinamico,
  picos
}) {
  if (
    ruidoEstimado === "alto" ||
    necesidadReduccionRuido === "alta" ||
    rangoDinamico === "muy_variable"
  ) {
    return "alto";
  }

  if (
    ruidoEstimado === "medio" ||
    necesidadReduccionRuido === "media" ||
    rangoDinamico === "variable" ||
    picos === "riesgo_saturacion"
  ) {
    return "medio";
  }

  return "bajo";
}

function recomendarMotorAudio({
  nivelDificultad,
  ruidoEstimado,
  necesidadReduccionRuido
}) {
  if (nivelDificultad === "alto" && ruidoEstimado === "alto") {
    return "ia";
  }

  if (necesidadReduccionRuido === "alta") {
    return "ia";
  }

  if (nivelDificultad === "medio") {
    return "ia_opcional";
  }

  return "dsp";
}

function crearDiagnosticoAudio({ inspeccion, volumen, silencios }) {
  const meanVolume = volumen?.meanVolume ?? null;
  const maxVolume = volumen?.maxVolume ?? null;
  const rangoEstimado = calcularRangoDinamicoEstimado(meanVolume, maxVolume);
  const listaSilencios = Array.isArray(silencios?.silencios) ? silencios.silencios : [];
  const duracionSegundos = numeroSeguro(inspeccion?.duracionSegundos, 0);
  const totalSilencioSegundos = calcularDuracionSilencioTotal(listaSilencios);
  const porcentajeSilencio = calcularPorcentajeSilencio(listaSilencios, duracionSegundos);
  const silencioMasLargo = obtenerSilencioMasLargo(listaSilencios);

  const volumenPromedio = clasificarVolumenPromedio(meanVolume);
  const picos = clasificarPicos(maxVolume);
  const rangoDinamico = clasificarRangoDinamico(rangoEstimado);
  const silencio = clasificarSilencio(porcentajeSilencio);

  const ruidoEstimado = estimarRuidoPorDiagnostico({
    volumenPromedio,
    rangoDinamico,
    porcentajeSilencio,
    silencioMasLargo
  });

  const necesidadReduccionRuido = estimarNecesidadReduccionRuido({
    ruidoEstimado,
    volumenPromedio,
    porcentajeSilencio
  });

  const necesidadCompresion = estimarNecesidadCompresion({
    volumenPromedio,
    rangoDinamico,
    picos
  });

  const necesidadNormalizacion = estimarNecesidadNormalizacion({
    volumenPromedio,
    picos
  });

  const nivelDificultad = estimarNivelDificultad({
    ruidoEstimado,
    necesidadReduccionRuido,
    rangoDinamico,
    picos
  });

  const recomendacionMotor = recomendarMotorAudio({
    nivelDificultad,
    ruidoEstimado,
    necesidadReduccionRuido
  });

  return {
    meanVolume,
    maxVolume,
    rangoEstimado,
    volumenPromedio,
    picos,
    rangoDinamico,
    totalSilencioSegundos,
    porcentajeSilencio,
    silencioMasLargo,
    silencio,
    ruidoEstimado,
    necesidadReduccionRuido,
    necesidadCompresion,
    necesidadNormalizacion,
    nivelDificultad,
    recomendacionMotor
  };
}

function crearAnalisisFallido(mensaje, extra = {}) {
  return {
    ok: false,
    mensaje,
    inspeccion: extra.inspeccion || null,
    volumen: extra.volumen || null,
    silencios: extra.silencios || null,
    diagnostico: null
  };
}

async function analizarAudioOriginal(rutaEntrada) {
  let inspeccion = null;

  try {
    inspeccion = await inspeccionarEntrada(rutaEntrada);
  } catch (error) {
    return crearAnalisisFallido("No se pudo inspeccionar el video original.", {
      inspeccion: null,
      error: error.message
    });
  }

  if (!inspeccion?.tieneVideo) {
    return crearAnalisisFallido("El archivo seleccionado no contiene video válido.", {
      inspeccion
    });
  }

  if (!inspeccion?.tieneAudio) {
    return crearAnalisisFallido("Este video no tiene pista de audio para mejorar.", {
      inspeccion
    });
  }

  let volumen = {
    ok: false,
    meanVolume: null,
    maxVolume: null,
    error: ""
  };

  try {
    volumen = await medirAudioVolumen(rutaEntrada);
  } catch (error) {
    volumen = {
      ok: false,
      meanVolume: null,
      maxVolume: null,
      error: error.message
    };
  }

  let silencios = {
    ok: false,
    silencios: [],
    totalSilencios: 0,
    error: ""
  };

  try {
    silencios = await detectarSilencios(rutaEntrada);
  } catch (error) {
    silencios = {
      ok: false,
      silencios: [],
      totalSilencios: 0,
      error: error.message
    };
  }

  const diagnostico = crearDiagnosticoAudio({
    inspeccion,
    volumen,
    silencios
  });

  return {
    ok: true,
    mensaje: "Audio analizado correctamente.",
    inspeccion,
    volumen,
    silencios,
    diagnostico
  };
}

module.exports = {
  analizarAudioOriginal,
  crearDiagnosticoAudio,
  clasificarVolumenPromedio,
  clasificarPicos,
  clasificarRangoDinamico
};