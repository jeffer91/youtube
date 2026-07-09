/* =========================================================
Nombre completo: sub.js
Ruta o ubicación: /src/pantallas/11-subtitulos-finales/index/sub.js
Funciones principales:
- Iniciar el paso Subtítulos finales.
- Reutilizar la lógica estable de Subtítulos automáticos.
- Traducir rutas antiguas hacia la nueva estructura ideal.
Con qué se conecta:
- sub.html
- sub.css
- 04-subtitulos-automaticos/index/sa.js
========================================================= */

import { iniciarPantallaSubtitulosAutomaticos } from "../../04-subtitulos-automaticos/index/sa.js";

function crearRouterCompatible(router) {
  return {
    ...router,
    irA(routeId) {
      const rutas = {
        "03-transcribir-video": "03-transcripcion-analisis",
        "19-exportar-video-final": "12-revision-exportacion"
      };
      return router.irA(rutas[routeId] || routeId);
    }
  };
}

export async function iniciarPantallaSubtitulosFinales({ root, router, estadoApp }) {
  return iniciarPantallaSubtitulosAutomaticos({
    root,
    router: crearRouterCompatible(router),
    estadoApp
  });
}
