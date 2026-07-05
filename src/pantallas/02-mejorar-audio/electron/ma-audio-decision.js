/* =========================================================
Nombre completo: ma-audio-decision.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/electron/ma-audio-decision.js
Funciones principales:
- Decidir qué motor de audio usar: DSP, IA + DSP o limpieza extrema.
- Leer el diagnóstico del audio original.
- Leer el perfil elegido por el usuario.
- Priorizar una voz natural para videos hablando a cámara.
- Evitar IA o limpieza extrema cuando no hacen falta.
Con qué se conecta:
- ma-audio-electron.js
- ma-audio-analisis.js
- ma-audio-modelos.js
- ma-audio-filtros.js
========================================================= */

const MOTORES_AUDIO = {
  DSP: "dsp",
  IA: "ia",
  EXTREMO: "extremo"
};

function limpiarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function normalizarPerfilAudio(perfilAudio) {
  const perfil = limpiarTexto(perfilAudio);

  if (!perfil) {
    return "natural";
  }

  if (perfil === "suave" || perfil === "voz-natural" || perfil === "voz natural") {
    return "natural";
  }

  if (perfil === "voz baja" || perfil === "volumen-bajo") {
    return "voz-baja";
  }

  if (perfil === "ruido medio" || perfil === "ruido-moderado") {
    return "ruido-medio";
  }

  return perfil;
}

function numeroSeguro(valor, respaldo = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function diagnosticoSeguro(analisis) {
  return analisis?.diagnostico && typeof analisis.diagnostico === "object"
    ? analisis.diagnostico
    : {};
}

function capacidadesSeguras(capacidadesIA) {
  return capacidadesIA && typeof capacidadesIA === "object"
    ? capacidadesIA
    : {
        iaDisponible: false,
        filtroArnndn: "",
        mensaje: "IA no disponible."
      };
}

function audioTieneRuidoAlto(diagnostico) {
  return diagnostico.necesidadReduccionRuido === "alta" ||
    diagnostico.ruidoEstimado === "alto" ||
    diagnostico.nivelDificultad === "alto";
}

function audioTieneRuidoMedio(diagnostico) {
  return diagnostico.necesidadReduccionRuido === "media" ||
    diagnostico.ruidoEstimado === "medio" ||
    diagnostico.nivelDificultad === "medio";
}

function audioEsMuyVariable(diagnostico) {
  return diagnostico.rangoDinamico === "muy_variable" ||
    diagnostico.rangoDinamico === "variable";
}

function audioTieneMuchoSilencio(diagnostico) {
  return diagnostico.silencio === "mucho_silencio" ||
    numeroSeguro(diagnostico.porcentajeSilencio, 0) >= 35;
}

function audioTieneProblemaFuerte(diagnostico) {
  return audioTieneRuidoAlto(diagnostico) ||
    diagnostico.saturacion === "alta" ||
    diagnostico.clipping === "alto" ||
    diagnostico.nivelDificultad === "alto";
}

function perfilPideIA(perfilAudio) {
  const perfil = normalizarPerfilAudio(perfilAudio);

  return [
    "locutor-pro"
  ].includes(perfil);
}

function perfilPideExtremo(perfilAudio) {
  const perfil = normalizarPerfilAudio(perfilAudio);

  return [
    "limpieza-extrema",
    "extremo"
  ].includes(perfil);
}

function perfilPideNatural(perfilAudio) {
  const perfil = normalizarPerfilAudio(perfilAudio);

  return [
    "natural",
    "automatico",
    "clase-virtual",
    "educativo",
    "voz-baja",
    "ruido-medio"
  ].includes(perfil);
}

function calcularMotorAutomatico({ diagnostico, iaDisponible }) {
  if (audioTieneProblemaFuerte(diagnostico) && iaDisponible) {
    return MOTORES_AUDIO.IA;
  }

  return MOTORES_AUDIO.DSP;
}

function calcularIntensidadDSP({ perfilAudio, diagnostico, motorAudio }) {
  const perfil = normalizarPerfilAudio(perfilAudio);

  if (motorAudio === MOTORES_AUDIO.EXTREMO) {
    return "alta";
  }

  if (perfil === "natural" || perfil === "automatico" || perfil === "clase-virtual" || perfil === "educativo") {
    return audioTieneRuidoMedio(diagnostico) ? "media" : "baja";
  }

  if (perfil === "voz-baja" || perfil === "ruido-medio") {
    return "media";
  }

  if (perfil === "analisis-tactico" || perfil === "dinamico" || perfil === "locutor-pro") {
    return "media";
  }

  if (audioTieneRuidoAlto(diagnostico)) {
    return "media";
  }

  return "baja";
}

function crearRazonDecision({
  perfilAudio,
  diagnostico,
  capacidadesIA,
  motorAudio
}) {
  const perfil = normalizarPerfilAudio(perfilAudio);

  if (motorAudio === MOTORES_AUDIO.EXTREMO && capacidadesIA.iaDisponible) {
    return "Se eligió limpieza extrema. Se aplicará con cuidado porque puede sonar menos natural.";
  }

  if (motorAudio === MOTORES_AUDIO.EXTREMO && !capacidadesIA.iaDisponible) {
    return "Se pidió limpieza extrema, pero no hay IA. Se usará DSP seguro.";
  }

  if (motorAudio === MOTORES_AUDIO.IA) {
    return "Hay ruido o dificultad fuerte. Se usará IA con filtros suaves de apoyo.";
  }

  if (perfilPideIA(perfil) && !capacidadesIA.iaDisponible) {
    return "El perfil puede usar IA, pero no está disponible. Se usará DSP seguro.";
  }

  if (perfilPideNatural(perfil)) {
    return "Perfil natural: se prioriza claridad sin sobreprocesar la voz.";
  }

  if (audioTieneMuchoSilencio(diagnostico)) {
    return "Hay bastante silencio; se mantendrá procesamiento moderado para no cortar la voz.";
  }

  if (audioEsMuyVariable(diagnostico)) {
    return "La voz cambia de volumen; se usará nivelación moderada.";
  }

  return "Se usará DSP suave para mejorar claridad y volumen sin dañar la voz.";
}

function decidirMotorAudio({
  perfilAudio = "natural",
  analisis = null,
  capacidadesIA = null
}) {
  const perfil = normalizarPerfilAudio(perfilAudio);
  const diagnostico = diagnosticoSeguro(analisis);
  const capacidades = capacidadesSeguras(capacidadesIA);
  const iaDisponible = Boolean(capacidades.iaDisponible && capacidades.filtroArnndn);

  let motorAudio = MOTORES_AUDIO.DSP;

  if (perfilPideExtremo(perfil)) {
    motorAudio = iaDisponible ? MOTORES_AUDIO.EXTREMO : MOTORES_AUDIO.DSP;
  } else if (perfil === "ruido-fuerte") {
    motorAudio = audioTieneProblemaFuerte(diagnostico) && iaDisponible
      ? MOTORES_AUDIO.IA
      : MOTORES_AUDIO.DSP;
  } else if (perfilPideIA(perfil)) {
    motorAudio = audioTieneProblemaFuerte(diagnostico) && iaDisponible
      ? MOTORES_AUDIO.IA
      : MOTORES_AUDIO.DSP;
  } else if (perfilPideNatural(perfil)) {
    motorAudio = MOTORES_AUDIO.DSP;
  } else {
    motorAudio = calcularMotorAutomatico({
      diagnostico,
      iaDisponible
    });
  }

  const usaIA = motorAudio === MOTORES_AUDIO.IA || motorAudio === MOTORES_AUDIO.EXTREMO;

  return {
    ok: true,
    perfilAudio: perfil,
    motorAudio,
    usaIA,
    usarArnndn: usaIA && iaDisponible,
    filtroArnndn: usaIA && iaDisponible ? capacidades.filtroArnndn : "",
    intensidadDSP: calcularIntensidadDSP({
      perfilAudio: perfil,
      diagnostico,
      motorAudio
    }),
    respaldoMotor: MOTORES_AUDIO.DSP,
    razon: crearRazonDecision({
      perfilAudio: perfil,
      diagnostico,
      capacidadesIA: capacidades,
      motorAudio
    }),
    diagnosticoEntrada: diagnostico,
    capacidadesIA: capacidades
  };
}

function crearDecisionDSPForzada(motivo = "DSP seguro forzado.") {
  return {
    ok: true,
    perfilAudio: "natural",
    motorAudio: MOTORES_AUDIO.DSP,
    usaIA: false,
    usarArnndn: false,
    filtroArnndn: "",
    intensidadDSP: "baja",
    respaldoMotor: MOTORES_AUDIO.DSP,
    razon: motivo,
    diagnosticoEntrada: {},
    capacidadesIA: capacidadesSeguras(null)
  };
}

module.exports = {
  MOTORES_AUDIO,
  decidirMotorAudio,
  crearDecisionDSPForzada,
  normalizarPerfilAudio
};