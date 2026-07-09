/* =========================================================
Nombre completo: coi.js
Ruta o ubicación: /src/pantallas/04-cortes-inteligentes/index/coi.js
Funciones principales:
- Iniciar Cortes inteligentes.
- Guardar decisión/capa provisional de cortes con margen.
- Continuar hacia Transiciones selectivas.
Con qué se conecta:
- coi.html
- coi.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaCortesInteligentes({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "04-cortes-inteligentes",
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
      botonId: "coiBtnContinuar",
      botonVolverId: "coiBtnVolver",
      anterior: "03-transcripcion-analisis",
      siguiente: "05-transiciones-selectivas"
    }
  });
}
