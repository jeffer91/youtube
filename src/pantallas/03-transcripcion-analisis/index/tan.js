/* =========================================================
Nombre completo: tan.js
Ruta o ubicación: /src/pantallas/03-transcripcion-analisis/index/tan.js
Funciones principales:
- Iniciar Transcripción y análisis.
- Reutilizar la lógica estable de Transcribir video.
- Traducir rutas antiguas hacia la nueva estructura ideal.
Con qué se conecta:
- tan.html
- tan.css
- 03-transcribir-video/index/tr.js
========================================================= */

import { iniciarPantallaTranscribirVideo } from "../../03-transcribir-video/index/tr.js";

function crearRouterCompatible(router) {
  return {
    ...router,
    irA(routeId) {
      const rutas = {
        "17-adaptar-cuadrado": "02-formato-inteligente",
        "05-detectar-silencios": "04-cortes-inteligentes",
        "04-subtitulos-automaticos": "11-subtitulos-finales"
      };
      return router.irA(rutas[routeId] || routeId);
    }
  };
}

export async function iniciarPantallaTranscripcionAnalisis({ root, router, estadoApp }) {
  return iniciarPantallaTranscribirVideo({
    root,
    router: crearRouterCompatible(router),
    estadoApp
  });
}
