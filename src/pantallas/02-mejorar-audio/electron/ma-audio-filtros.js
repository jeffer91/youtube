/* =========================================================
Nombre completo: ma-audio-filtros.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/electron/ma-audio-filtros.js
Funciones principales:
- Normalizar controles de audio recibidos desde la interfaz.
- Construir filtros FFmpeg para mejorar voz hablada a cámara.
- Aplicar limpieza suave, nivelación y claridad sin sobreprocesar.
- Crear cadena principal, respaldo DSP y respaldo ultra seguro.
- Evitar que el audio suene metálico, aplastado o artificial.
Con qué se conecta:
- ma-audio-electron.js
- ma-audio-analisis.js
- ma-audio-decision.js
========================================================= */

function limpiarNivel(nivel) {
  const valor = String(nivel || "").trim();

  if (["bajo", "medio", "alto"].includes(valor)) {
    return valor;
  }

  return "medio";
}

function normalizarControl(control, activoPorDefecto = true) {
  const fuente = control && typeof control === "object" ? control : {};

  return {
    activo: typeof fuente.activo === "boolean" ? fuente.activo : activoPorDefecto,
    nivel: limpiarNivel(fuente.nivel)
  };
}

function normalizarControlesAudio(controles) {
  const fuente = controles && typeof controles === "object" ? controles : {};

  return {
    reducirRuido: normalizarControl(fuente.reducirRuido, true),
    mejorarVoz: normalizarControl(fuente.mejorarVoz, true),
    nivelarVolumen: normalizarControl(fuente.nivelarVolumen, true)
  };
}

function existeAlMenosUnaMejora(controles) {
  return Object.values(controles || {}).some((control) => Boolean(control?.activo));
}

function obtenerValorPorNivel(nivel, valores) {
  const nivelFinal = limpiarNivel(nivel);
  return valores[nivelFinal] ?? valores.medio;
}

function ajustarNumero(valor, minimo, maximo) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return minimo;
  }

  return Math.min(Math.max(numero, minimo), maximo);
}

function redondearFiltro(valor, decimales = 3) {
  const factor = 10 ** decimales;
  return Math.round(Number(valor) * factor) / factor;
}

function normalizarDecisionAudio(decisionAudio) {
  const fuente = decisionAudio && typeof decisionAudio === "object" ? decisionAudio : {};

  return {
    motorAudio: fuente.motorAudio || "dsp",
    usaIA: Boolean(fuente.usaIA),
    usarArnndn: Boolean(fuente.usarArnndn),
    filtroArnndn: String(fuente.filtroArnndn || "").trim(),
    intensidadDSP: fuente.intensidadDSP || "baja",
    perfilAudio: fuente.perfilAudio || "natural",
    razon: fuente.razon || ""
  };
}

function obtenerPerfil(decisionAudio) {
  return String(normalizarDecisionAudio(decisionAudio).perfilAudio || "natural").trim().toLowerCase();
}

function esMotorExtremo(decisionAudio) {
  return normalizarDecisionAudio(decisionAudio).motorAudio === "extremo";
}

function esModoLocutorPro(controles, decisionAudio) {
  return obtenerPerfil(decisionAudio) === "locutor-pro";
}

function perfilEsClaseVirtual(decisionAudio) {
  const perfil = obtenerPerfil(decisionAudio);
  return perfil === "clase-virtual" || perfil === "educativo";
}

function perfilEsAnalisisTactico(decisionAudio) {
  const perfil = obtenerPerfil(decisionAudio);
  return perfil === "analisis-tactico" || perfil === "dinamico";
}

function perfilEsNatural(decisionAudio) {
  const perfil = obtenerPerfil(decisionAudio);
  return perfil === "natural" || perfil === "suave" || perfil === "automatico";
}

function perfilEsVozBaja(decisionAudio) {
  return obtenerPerfil(decisionAudio) === "voz-baja";
}

function perfilEsRuidoMedio(decisionAudio) {
  return obtenerPerfil(decisionAudio) === "ruido-medio";
}

function perfilEsRuidoFuerte(decisionAudio) {
  return obtenerPerfil(decisionAudio) === "ruido-fuerte";
}

function crearDescripcionMejora(controles, analisis, decisionAudio) {
  const diagnostico = analisis?.diagnostico || {};
  const decision = normalizarDecisionAudio(decisionAudio);
  const partes = [];

  if (decision.motorAudio === "ia") {
    partes.push("IA suave + DSP");
  } else if (decision.motorAudio === "extremo") {
    partes.push("Limpieza extrema controlada");
  } else {
    partes.push("DSP natural");
  }

  if (esModoLocutorPro(controles, decision)) {
    partes.push("Locutor Pro moderado");
  }

  if (controles.reducirRuido.activo) {
    partes.push(`Ruido ${controles.reducirRuido.nivel}`);
  }

  if (controles.mejorarVoz.activo) {
    partes.push(`Voz ${controles.mejorarVoz.nivel}`);
  }

  if (controles.nivelarVolumen.activo) {
    partes.push(`Volumen ${controles.nivelarVolumen.nivel}`);
  }

  if (diagnostico.nivelDificultad) {
    partes.push(`Dificultad ${diagnostico.nivelDificultad}`);
  }

  return partes.length ? partes.join(" · ") : "Sin mejoras activas";
}

function crearFiltroPasoAlto(controles, decisionAudio) {
  if (!controles.mejorarVoz.activo && !controles.reducirRuido.activo) {
    return [];
  }

  if (esMotorExtremo(decisionAudio)) {
    return ["highpass=f=85"];
  }

  if (esModoLocutorPro(controles, decisionAudio)) {
    return ["highpass=f=80"];
  }

  return ["highpass=f=70"];
}

function crearFiltroPasoBajo(controles, decisionAudio) {
  if (!controles.mejorarVoz.activo && !controles.reducirRuido.activo) {
    return [];
  }

  if (esMotorExtremo(decisionAudio)) {
    return ["lowpass=f=13500"];
  }

  if (controles.reducirRuido.activo && controles.reducirRuido.nivel === "alto") {
    return ["lowpass=f=14500"];
  }

  return ["lowpass=f=16000"];
}

function crearFiltrosReduccionRuidoDSP(controles, diagnostico, decisionAudio) {
  if (!controles.reducirRuido.activo) {
    return [];
  }

  const nivel = controles.reducirRuido.nivel;
  const decision = normalizarDecisionAudio(decisionAudio);
  const necesidad = diagnostico?.necesidadReduccionRuido || "suave";

  let reduccion = obtenerValorPorNivel(nivel, {
    bajo: 4,
    medio: 7,
    alto: 10
  });

  let pisoRuido = obtenerValorPorNivel(nivel, {
    bajo: -22,
    medio: -27,
    alto: -32
  });

  if (decision.intensidadDSP === "media") {
    reduccion += 1;
    pisoRuido -= 1;
  }

  if (decision.intensidadDSP === "alta") {
    reduccion += 2;
    pisoRuido -= 2;
  }

  if (necesidad === "alta") {
    reduccion += 2;
    pisoRuido -= 2;
  }

  if (necesidad === "suave") {
    reduccion -= 1;
    pisoRuido += 1;
  }

  if (perfilEsNatural(decision)) {
    reduccion -= 1;
    pisoRuido += 2;
  }

  if (perfilEsRuidoMedio(decision) || perfilEsRuidoFuerte(decision)) {
    reduccion += 1;
    pisoRuido -= 1;
  }

  if (esModoLocutorPro(controles, decision)) {
    reduccion += 1;
  }

  if (esMotorExtremo(decision)) {
    reduccion += 3;
    pisoRuido -= 2;
  }

  reduccion = ajustarNumero(reduccion, 3, 16);
  pisoRuido = ajustarNumero(pisoRuido, -38, -20);

  return [`afftdn=nr=${redondearFiltro(reduccion, 2)}:nf=${redondearFiltro(pisoRuido, 2)}`];
}

function crearFiltrosIA(decisionAudio) {
  const decision = normalizarDecisionAudio(decisionAudio);

  if (!decision.usarArnndn || !decision.filtroArnndn) {
    return [];
  }

  return [decision.filtroArnndn];
}

function crearFiltrosEcualizacionVoz(controles, decisionAudio) {
  if (!controles.mejorarVoz.activo) {
    return [];
  }

  const nivel = controles.mejorarVoz.nivel;
  const locutorPro = esModoLocutorPro(controles, decisionAudio);
  const extremo = esMotorExtremo(decisionAudio);

  let cuerpo = obtenerValorPorNivel(nivel, {
    bajo: 0.5,
    medio: 1,
    alto: 1.6
  });

  let limpiezaCaja = obtenerValorPorNivel(nivel, {
    bajo: -0.4,
    medio: -0.9,
    alto: -1.4
  });

  let limpiezaNasal = obtenerValorPorNivel(nivel, {
    bajo: -0.2,
    medio: -0.5,
    alto: -0.8
  });

  let claridad = obtenerValorPorNivel(nivel, {
    bajo: 0.8,
    medio: 1.6,
    alto: 2.4
  });

  let presencia = obtenerValorPorNivel(nivel, {
    bajo: 0.5,
    medio: 1,
    alto: 1.7
  });

  let aire = obtenerValorPorNivel(nivel, {
    bajo: 0,
    medio: 0.25,
    alto: 0.5
  });

  if (perfilEsClaseVirtual(decisionAudio)) {
    cuerpo -= 0.2;
    limpiezaCaja -= 0.2;
    claridad += 0.2;
    presencia -= 0.1;
  }

  if (perfilEsAnalisisTactico(decisionAudio)) {
    cuerpo += 0.4;
    claridad += 0.4;
    presencia += 0.5;
  }

  if (perfilEsNatural(decisionAudio)) {
    cuerpo *= 0.8;
    limpiezaCaja *= 0.8;
    limpiezaNasal *= 0.8;
    claridad *= 0.8;
    presencia *= 0.8;
    aire *= 0.8;
  }

  if (perfilEsVozBaja(decisionAudio)) {
    claridad += 0.3;
    presencia += 0.2;
  }

  if (locutorPro) {
    cuerpo = 2;
    limpiezaCaja = -1.8;
    limpiezaNasal = -1;
    claridad = 3;
    presencia = 2.2;
    aire = 0.6;
  }

  if (extremo) {
    cuerpo = 1.4;
    limpiezaCaja = -2;
    limpiezaNasal = -1.1;
    claridad = 2.4;
    presencia = 1.5;
    aire = 0.2;
  }

  return [
    `equalizer=f=150:t=q:w=1:g=${redondearFiltro(cuerpo, 2)}`,
    `equalizer=f=280:t=q:w=1:g=${redondearFiltro(limpiezaCaja, 2)}`,
    `equalizer=f=520:t=q:w=1:g=${redondearFiltro(limpiezaNasal, 2)}`,
    `equalizer=f=3200:t=q:w=1:g=${redondearFiltro(claridad, 2)}`,
    `equalizer=f=5600:t=q:w=1:g=${redondearFiltro(presencia, 2)}`,
    `equalizer=f=10000:t=q:w=1:g=${redondearFiltro(aire, 2)}`
  ];
}

function crearFiltrosCompresion(controles, diagnostico, decisionAudio) {
  if (!controles.nivelarVolumen.activo && !controles.mejorarVoz.activo) {
    return [];
  }

  const necesidad = diagnostico?.necesidadCompresion || "media";
  const locutorPro = esModoLocutorPro(controles, decisionAudio);
  const extremo = esMotorExtremo(decisionAudio);

  const nivel = controles.nivelarVolumen.activo
    ? controles.nivelarVolumen.nivel
    : controles.mejorarVoz.nivel;

  let threshold = obtenerValorPorNivel(nivel, {
    bajo: 0.22,
    medio: 0.16,
    alto: 0.12
  });

  let ratio = obtenerValorPorNivel(nivel, {
    bajo: 1.6,
    medio: 2.1,
    alto: 2.8
  });

  let makeup = obtenerValorPorNivel(nivel, {
    bajo: 1,
    medio: 1.35,
    alto: 1.8
  });

  if (perfilEsClaseVirtual(decisionAudio)) {
    threshold = 0.17;
    ratio = 2;
    makeup = 1.3;
  }

  if (perfilEsAnalisisTactico(decisionAudio)) {
    threshold = 0.12;
    ratio = 2.8;
    makeup = 1.8;
  }

  if (perfilEsNatural(decisionAudio)) {
    threshold = 0.2;
    ratio = 1.8;
    makeup = 1.15;
  }

  if (perfilEsVozBaja(decisionAudio)) {
    threshold = 0.14;
    ratio = 2.4;
    makeup = 1.7;
  }

  if (necesidad === "alta") {
    threshold -= 0.015;
    ratio += 0.25;
    makeup += 0.15;
  }

  if (necesidad === "suave") {
    threshold += 0.015;
    ratio -= 0.2;
    makeup -= 0.1;
  }

  if (locutorPro) {
    threshold = 0.11;
    ratio = 3;
    makeup = 2;
  }

  if (extremo) {
    threshold = 0.1;
    ratio = 3.2;
    makeup = 1.8;
  }

  threshold = ajustarNumero(threshold, 0.08, 0.26);
  ratio = ajustarNumero(ratio, 1.4, 3.6);
  makeup = ajustarNumero(makeup, 0.9, 2.4);

  return [
    `acompressor=threshold=${redondearFiltro(threshold, 3)}:ratio=${redondearFiltro(ratio, 2)}:attack=10:release=220:makeup=${redondearFiltro(makeup, 2)}:knee=3`
  ];
}

function crearFiltrosNormalizacion(controles, decisionAudio) {
  if (!controles.nivelarVolumen.activo) {
    return [];
  }

  if (perfilEsVozBaja(decisionAudio)) {
    return [
      "dynaudnorm=f=301:g=11:p=0.9",
      "volume=1.08"
    ];
  }

  if (perfilEsAnalisisTactico(decisionAudio)) {
    return [
      "dynaudnorm=f=301:g=10:p=0.9",
      "volume=1.06"
    ];
  }

  if (perfilEsNatural(decisionAudio) || perfilEsClaseVirtual(decisionAudio)) {
    return [
      "dynaudnorm=f=301:g=7:p=0.86",
      "volume=1.02"
    ];
  }

  if (esModoLocutorPro(controles, decisionAudio)) {
    return [
      "dynaudnorm=f=301:g=11:p=0.9",
      "volume=1.07"
    ];
  }

  if (esMotorExtremo(decisionAudio)) {
    return [
      "dynaudnorm=f=301:g=9:p=0.88",
      "volume=1.04"
    ];
  }

  return [
    "dynaudnorm=f=301:g=8:p=0.88",
    "volume=1.03"
  ];
}

function crearFiltroLimitador(controles, decisionAudio) {
  if (!existeAlMenosUnaMejora(controles)) {
    return [];
  }

  const limite = esMotorExtremo(decisionAudio) ? 0.9 : 0.94;
  return [`alimiter=limit=${limite}`];
}

function crearFiltrosDSP({ controles, analisis, decisionAudio }) {
  const diagnostico = analisis?.diagnostico || {};
  const filtros = [];

  filtros.push(...crearFiltroPasoAlto(controles, decisionAudio));
  filtros.push(...crearFiltrosReduccionRuidoDSP(controles, diagnostico, decisionAudio));
  filtros.push(...crearFiltroPasoBajo(controles, decisionAudio));
  filtros.push(...crearFiltrosEcualizacionVoz(controles, decisionAudio));
  filtros.push(...crearFiltrosCompresion(controles, diagnostico, decisionAudio));
  filtros.push(...crearFiltrosNormalizacion(controles, decisionAudio));
  filtros.push(...crearFiltroLimitador(controles, decisionAudio));

  return filtros.length ? filtros : ["anull"];
}

function crearFiltrosIAHibrida({ controles, analisis, decisionAudio }) {
  const diagnostico = analisis?.diagnostico || {};
  const filtros = [];

  filtros.push(...crearFiltroPasoAlto(controles, decisionAudio));
  filtros.push(...crearFiltrosIA(decisionAudio));

  if (esMotorExtremo(decisionAudio)) {
    filtros.push(...crearFiltrosReduccionRuidoDSP(controles, diagnostico, decisionAudio));
  }

  filtros.push(...crearFiltroPasoBajo(controles, decisionAudio));
  filtros.push(...crearFiltrosEcualizacionVoz(controles, decisionAudio));
  filtros.push(...crearFiltrosCompresion(controles, diagnostico, decisionAudio));
  filtros.push(...crearFiltrosNormalizacion(controles, decisionAudio));
  filtros.push(...crearFiltroLimitador(controles, decisionAudio));

  return filtros.length ? filtros : ["anull"];
}

function crearFiltrosRespaldo({ controles, analisis, decisionAudio }) {
  const controlesFinales = normalizarControlesAudio(controles);
  const diagnostico = analisis?.diagnostico || {};

  const decisionRespaldo = {
    ...normalizarDecisionAudio(decisionAudio),
    motorAudio: "dsp",
    usaIA: false,
    usarArnndn: false,
    filtroArnndn: "",
    intensidadDSP: "baja",
    perfilAudio: normalizarDecisionAudio(decisionAudio).perfilAudio || "natural",
    razon: "Respaldo DSP seguro con mejora moderada."
  };

  const filtros = [];

  filtros.push("highpass=f=70");

  if (controlesFinales.reducirRuido.activo) {
    const ruido = diagnostico?.necesidadReduccionRuido === "alta" ? "afftdn=nr=9:nf=-30" : "afftdn=nr=6:nf=-26";
    filtros.push(ruido);
  }

  filtros.push("lowpass=f=15500");

  if (controlesFinales.mejorarVoz.activo) {
    filtros.push("equalizer=f=150:t=q:w=1:g=0.8");
    filtros.push("equalizer=f=280:t=q:w=1:g=-0.8");
    filtros.push("equalizer=f=3200:t=q:w=1:g=1.5");
    filtros.push("equalizer=f=5600:t=q:w=1:g=0.9");
  }

  if (controlesFinales.nivelarVolumen.activo || controlesFinales.mejorarVoz.activo) {
    filtros.push("acompressor=threshold=0.17:ratio=2:attack=12:release=230:makeup=1.2:knee=3");
    filtros.push("dynaudnorm=f=301:g=7:p=0.86");
    filtros.push("volume=1.02");
  }

  filtros.push(...crearFiltroLimitador(controlesFinales, decisionRespaldo));

  return filtros.length ? filtros : ["anull"];
}

function crearFiltrosUltraSeguro() {
  return [
    "highpass=f=70",
    "equalizer=f=3000:t=q:w=1:g=1",
    "dynaudnorm=f=301:g=6:p=0.85",
    "alimiter=limit=0.95"
  ];
}

function construirFiltrosAudioHibrido({
  controles,
  analisis,
  decisionAudio
}) {
  const controlesFinales = normalizarControlesAudio(controles);
  const decision = normalizarDecisionAudio(decisionAudio);

  const filtrosPrincipales = decision.usarArnndn
    ? crearFiltrosIAHibrida({
        controles: controlesFinales,
        analisis,
        decisionAudio: decision
      })
    : crearFiltrosDSP({
        controles: controlesFinales,
        analisis,
        decisionAudio: decision
      });

  const filtrosRespaldo = crearFiltrosRespaldo({
    controles: controlesFinales,
    analisis,
    decisionAudio: decision
  });

  const filtrosUltraSeguro = crearFiltrosUltraSeguro();

  return {
    controles: controlesFinales,
    decisionAudio: decision,
    filtrosPrincipales,
    filtrosRespaldo,
    filtrosUltraSeguro,
    descripcion: crearDescripcionMejora(controlesFinales, analisis, decision),
    diagnostico: analisis?.diagnostico || null
  };
}

function crearFiltrosPrincipales({ controles, analisis, decisionAudio }) {
  return construirFiltrosAudioHibrido({
    controles,
    analisis,
    decisionAudio
  }).filtrosPrincipales;
}

function construirFiltrosAudioInteligente({ controles, analisis }) {
  return construirFiltrosAudioHibrido({
    controles,
    analisis,
    decisionAudio: {
      motorAudio: "dsp",
      usaIA: false,
      usarArnndn: false,
      filtroArnndn: "",
      intensidadDSP: "baja",
      perfilAudio: "natural",
      razon: "Compatibilidad con motor anterior usando DSP natural."
    }
  });
}

module.exports = {
  limpiarNivel,
  normalizarControlesAudio,
  existeAlMenosUnaMejora,
  crearDescripcionMejora,
  construirFiltrosAudioHibrido,
  construirFiltrosAudioInteligente,
  crearFiltrosPrincipales,
  crearFiltrosRespaldo,
  crearFiltrosUltraSeguro
};