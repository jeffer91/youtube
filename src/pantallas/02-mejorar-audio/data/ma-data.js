/* =========================================================
Nombre completo: ma-data.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/data/ma-data.js
Funciones principales:
- Guardar datos fijos de la pantalla Mejorar audio.
- Definir páginas internas de la pantalla.
- Definir controles disponibles.
- Definir perfiles inteligentes de audio.
- Usar Voz Natural como configuración inicial segura para videos hablando a cámara.
- Evitar que la app arranque con filtros fuertes que dañen la voz.
Con qué se conecta:
- ma-estado.js
- ma-controles.js
- ma-service.js
- ma-audio.js
========================================================= */

export const MA_PAGINAS = [
  {
    id: "controles",
    numero: 1,
    titulo: "Controles",
    texto: "Mejora el audio."
  },
  {
    id: "comparar",
    numero: 2,
    titulo: "Comparar",
    texto: "Original o mejorado."
  },
  {
    id: "guardar",
    numero: 3,
    titulo: "Guardar capa",
    texto: "Guarda el cambio."
  }
];

export const MA_NIVELES = [
  {
    id: "bajo",
    nombre: "Bajo"
  },
  {
    id: "medio",
    nombre: "Medio"
  },
  {
    id: "alto",
    nombre: "Alto"
  }
];

export const MA_CONTROLES = [
  {
    id: "reducirRuido",
    nombre: "Reducir ruido",
    descripcion: "Quita ruido constante de fondo sin destruir la voz.",
    activoInicial: true,
    nivelInicial: "bajo"
  },
  {
    id: "mejorarVoz",
    nombre: "Mejorar voz",
    descripcion: "Da claridad suave para que la voz se entienda mejor.",
    activoInicial: true,
    nivelInicial: "medio"
  },
  {
    id: "nivelarVolumen",
    nombre: "Nivelar volumen",
    descripcion: "Hace que la voz se escuche más pareja y estable.",
    activoInicial: true,
    nivelInicial: "medio"
  }
];

export const MA_PERFILES_AUDIO = [
  {
    id: "natural",
    nombre: "Voz natural",
    descripcion: "Recomendado para hablar a cámara. Mejora sin sonar artificial.",
    recomendado: true,
    motorPreferido: "dsp",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "bajo"
      },
      mejorarVoz: {
        activo: true,
        nivel: "medio"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "medio"
      }
    }
  },
  {
    id: "automatico",
    nombre: "Automático seguro",
    descripcion: "La app analiza el audio y evita filtros fuertes si no hacen falta.",
    recomendado: false,
    motorPreferido: "automatico",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "bajo"
      },
      mejorarVoz: {
        activo: true,
        nivel: "medio"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "medio"
      }
    }
  },
  {
    id: "voz-baja",
    nombre: "Voz baja",
    descripcion: "Para videos donde la voz está clara, pero se escucha con poco volumen.",
    recomendado: false,
    motorPreferido: "dsp",
    controles: {
      reducirRuido: {
        activo: false,
        nivel: "bajo"
      },
      mejorarVoz: {
        activo: true,
        nivel: "medio"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "alto"
      }
    }
  },
  {
    id: "ruido-medio",
    nombre: "Ruido moderado",
    descripcion: "Para ventilador, computador, sala o ambiente leve de fondo.",
    recomendado: false,
    motorPreferido: "dsp",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "medio"
      },
      mejorarVoz: {
        activo: true,
        nivel: "medio"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "medio"
      }
    }
  },
  {
    id: "clase-virtual",
    nombre: "Clase o tutorial",
    descripcion: "Voz clara y cómoda para explicación, clase o tutorial.",
    recomendado: false,
    motorPreferido: "dsp",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "bajo"
      },
      mejorarVoz: {
        activo: true,
        nivel: "medio"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "medio"
      }
    }
  },
  {
    id: "analisis-tactico",
    nombre: "Narración deportiva",
    descripcion: "Voz un poco más firme para narraciones o análisis con energía.",
    recomendado: false,
    motorPreferido: "dsp",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "bajo"
      },
      mejorarVoz: {
        activo: true,
        nivel: "alto"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "medio"
      }
    }
  },
  {
    id: "ruido-fuerte",
    nombre: "Ruido fuerte",
    descripcion: "Para ruido notorio. Limpia más, pero sin usar el modo extremo por defecto.",
    recomendado: false,
    motorPreferido: "automatico",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "alto"
      },
      mejorarVoz: {
        activo: true,
        nivel: "medio"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "medio"
      }
    }
  },
  {
    id: "locutor-pro",
    nombre: "Locutor Pro",
    descripcion: "Más presencia y volumen. Úsalo solo si quieres una voz más procesada.",
    recomendado: false,
    motorPreferido: "dsp",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "medio"
      },
      mejorarVoz: {
        activo: true,
        nivel: "alto"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "alto"
      }
    }
  },
  {
    id: "limpieza-extrema",
    nombre: "Limpieza extrema",
    descripcion: "Último recurso para grabaciones difíciles. Puede sonar menos natural.",
    recomendado: false,
    motorPreferido: "extremo",
    controles: {
      reducirRuido: {
        activo: true,
        nivel: "alto"
      },
      mejorarVoz: {
        activo: true,
        nivel: "medio"
      },
      nivelarVolumen: {
        activo: true,
        nivel: "medio"
      }
    }
  }
];

export const MA_CAPA_AUDIO = {
  id: "audio-mejorado",
  tipo: "audio",
  nombre: "Audio mejorado",
  activa: true
};

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

export function obtenerPaginasMA() {
  return clonar(MA_PAGINAS);
}

export function obtenerControlesMA() {
  return clonar(MA_CONTROLES);
}

export function obtenerNivelesMA() {
  return clonar(MA_NIVELES);
}

export function obtenerPerfilesAudioMA() {
  return clonar(MA_PERFILES_AUDIO);
}

export function obtenerPaginaPorId(paginaId) {
  return MA_PAGINAS.find((pagina) => pagina.id === paginaId) || MA_PAGINAS[0];
}

export function obtenerPerfilAudioPorId(perfilId) {
  if (perfilId === "personalizado") {
    return {
      id: "personalizado",
      nombre: "Personalizado",
      descripcion: "Ajustes manuales del usuario.",
      recomendado: false,
      motorPreferido: "automatico",
      controles: crearControlesInicialesMA()
    };
  }

  return MA_PERFILES_AUDIO.find((perfil) => perfil.id === perfilId) || MA_PERFILES_AUDIO[0];
}

export function obtenerPerfilInicialMA() {
  const recomendado = MA_PERFILES_AUDIO.find((perfil) => perfil.recomendado);
  return recomendado ? recomendado.id : MA_PERFILES_AUDIO[0].id;
}

export function crearControlesInicialesMA() {
  const perfilInicial = obtenerPerfilAudioPorId(obtenerPerfilInicialMA());

  if (perfilInicial?.controles) {
    return clonar(perfilInicial.controles);
  }

  const controles = {};

  MA_CONTROLES.forEach((control) => {
    controles[control.id] = {
      activo: Boolean(control.activoInicial),
      nivel: control.nivelInicial || "medio"
    };
  });

  return controles;
}

export function crearControlesDesdePerfilMA(perfilId) {
  const perfil = obtenerPerfilAudioPorId(perfilId);
  return clonar(perfil.controles || crearControlesInicialesMA());
}

export function obtenerMotorPreferidoPerfilMA(perfilId) {
  const perfil = obtenerPerfilAudioPorId(perfilId);
  return perfil.motorPreferido || "automatico";
}

export function nivelEsValidoMA(nivel) {
  return MA_NIVELES.some((item) => item.id === nivel);
}

export function limpiarNivelMA(nivel) {
  return nivelEsValidoMA(nivel) ? nivel : "medio";
}

export function perfilAudioExisteMA(perfilId) {
  return perfilId === "personalizado" || MA_PERFILES_AUDIO.some((perfil) => perfil.id === perfilId);
}

export function limpiarPerfilAudioMA(perfilId) {
  return perfilAudioExisteMA(perfilId) ? perfilId : obtenerPerfilInicialMA();
}