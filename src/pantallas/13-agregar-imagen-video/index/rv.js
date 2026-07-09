/* =========================================================
Nombre completo: rv.js
Ruta o ubicación: /src/pantallas/13-agregar-imagen-video/index/rv.js
Funciones principales:
- Iniciar Recursos visuales.
- Guardar decisión/capa provisional de imágenes, logos o capturas.
- Continuar hacia Textos y animaciones.
Con qué se conecta:
- rv.html
- rv.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaRecursosVisuales({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "13-agregar-imagen-video",
      numero: "09",
      titulo: "Recursos visuales",
      descripcion: "Agregar imágenes, logos, capturas o recursos útiles.",
      criterio: "Los recursos deben ayudar al video, no ensuciarlo ni tapar la zona segura de subtítulos.",
      acciones: [
        "Agregar logos o imágenes.",
        "Respetar zona segura de subtítulos.",
        "Mantener recursos debajo de la capa final de subtítulos."
      ],
      capaId: "recursos-visuales",
      tipo: "recursos",
      botonId: "rvBtnContinuar",
      botonVolverId: "rvBtnVolver",
      anterior: "16-correccion-color",
      siguiente: "10-texto-graficos"
    }
  });
}
