/* =========================================================
Nombre completo: rev.js
Ruta o ubicación: /src/pantallas/12-revision-exportacion/index/rev.js
Funciones principales:
- Iniciar el paso Revisión y exportación.
- Reutilizar la lógica estable de Exportar video final.
- Traducir rutas antiguas hacia la nueva estructura ideal.
Con qué se conecta:
- rev.html
- rev.css
- 19-exportar-video-final/index/ex.js
========================================================= */

import { iniciarPantallaExportarFinal } from "../../19-exportar-video-final/index/ex.js";

function crearRouterCompatible(router) {
  return {
    ...router,
    irA(routeId) {
      const rutas = {
        "04-subtitulos-automaticos": "11-subtitulos-finales"
      };
      return router.irA(rutas[routeId] || routeId);
    }
  };
}

export async function iniciarPantallaRevisionExportacion({ root, router, estadoApp }) {
  return iniciarPantallaExportarFinal({
    root,
    router: crearRouterCompatible(router),
    estadoApp
  });
}
