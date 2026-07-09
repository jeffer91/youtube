/* =========================================================
Nombre completo: vbd.js
Ruta o ubicación: /src/pantallas/01-video-base-diagnostico/index/vbd.js
Funciones principales:
- Iniciar el paso Video base y diagnóstico.
- Reutilizar la lógica estable de Cargar proyecto.
- Traducir rutas antiguas hacia la nueva estructura ideal.
Con qué se conecta:
- vbd.html
- vbd.css
- 01-cargar-proyecto/index/cp.js
========================================================= */

import { iniciarPantallaCargarProyecto } from "../../01-cargar-proyecto/index/cp.js";

function crearRouterCompatible(router) {
  return {
    ...router,
    irA(routeId) {
      const rutas = {
        "17-adaptar-cuadrado": "02-formato-inteligente"
      };
      return router.irA(rutas[routeId] || routeId);
    }
  };
}

export async function iniciarPantallaVideoBaseDiagnostico({ root, router, estadoApp }) {
  return iniciarPantallaCargarProyecto({
    root,
    router: crearRouterCompatible(router),
    estadoApp
  });
}
