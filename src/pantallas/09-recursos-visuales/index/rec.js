/* =========================================================
Nombre completo: rec.js
Ruta o ubicación: /src/pantallas/09-recursos-visuales/index/rec.js
Funciones principales:
- Iniciar Recursos visuales.
- Guardar decisión/capa provisional de imágenes, logos o capturas.
- Continuar hacia Textos y animaciones.
Con qué se conecta:
- rec.html
- rec.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaRecursosVisuales({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "09-recursos-visuales",
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
      botonId: "recBtnContinuar",
      botonVolverId: "recBtnVolver",
      anterior: "08-color-limpieza",
      siguiente: "10-textos-animaciones"
    }
  });
}
