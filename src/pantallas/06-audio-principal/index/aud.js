/* =========================================================
Nombre completo: aud.js
Ruta o ubicación: /src/pantallas/06-audio-principal/index/aud.js
Funciones principales:
- Iniciar el paso Audio principal.
- Reutilizar la lógica estable de Mejorar audio.
- Traducir rutas antiguas hacia la nueva estructura ideal.
Con qué se conecta:
- aud.html
- aud.css
- 02-mejorar-audio/index/ma.js
========================================================= */

import { iniciarPantallaMejorarAudio } from "../../02-mejorar-audio/index/ma.js";

function crearRouterCompatible(router) {
  return {
    ...router,
    irA(routeId) {
      const rutas = {
        "11-musica-fondo": "07-musica-sonidos"
      };
      return router.irA(rutas[routeId] || routeId);
    }
  };
}

export async function iniciarPantallaAudioPrincipal({ root, router, estadoApp }) {
  return iniciarPantallaMejorarAudio({
    root,
    router: crearRouterCompatible(router),
    estadoApp
  });
}
