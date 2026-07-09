/* =========================================================
Nombre completo: ds.js
Ruta o ubicación: /src/pantallas/05-detectar-silencios/index/ds.js
Funciones principales:
- Iniciar Cortes inteligentes.
- Guardar decisión/capa provisional de cortes con margen.
- Continuar hacia Transiciones selectivas.
Con qué se conecta:
- ds.html
- ds.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaDetectarSilencios({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "05-detectar-silencios",
      numero: "04",
      titulo: "Cortes inteligentes",
      descripcion: "Cortar silencios y partes muertas manteniendo ritmo natural.",
      criterio: "Los cortes cambian la línea de tiempo; por eso van antes de audio final, recursos, textos y subtítulos.",
      acciones: [
        "Detectar silencios y pausas largas.",
        "Dejar margen corto antes y después del corte.",
        "Evitar cortes robóticos o demasiado agresivos."
      ],
      capaId: "cortes-inteligentes",
      tipo: "cortes",
      botonId: "dsBtnContinuar",
      botonVolverId: "dsBtnVolver",
      anterior: "03-transcribir-video",
      siguiente: "15-transiciones"
    }
  });
}
