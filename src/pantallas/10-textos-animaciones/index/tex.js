/* =========================================================
Nombre completo: tex.js
Ruta o ubicación: /src/pantallas/10-textos-animaciones/index/tex.js
Funciones principales:
- Iniciar Textos y animaciones.
- Guardar decisión/capa provisional de textos y animaciones.
- Continuar hacia Subtítulos finales.
Con qué se conecta:
- tex.html
- tex.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaTextosAnimaciones({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "10-textos-animaciones",
      numero: "10",
      titulo: "Textos y animaciones",
      descripcion: "Agregar rótulos, títulos, frases y animaciones simples.",
      criterio: "Texto y animación van juntos porque normalmente la animación pertenece a un texto o recurso ya creado.",
      acciones: [
        "Agregar títulos o rótulos normales.",
        "Aplicar animaciones de entrada y salida.",
        "Evitar animaciones exageradas o que tapen subtítulos."
      ],
      capaId: "textos-y-animaciones",
      tipo: "texto-animacion",
      botonId: "texBtnContinuar",
      botonVolverId: "texBtnVolver",
      anterior: "09-recursos-visuales",
      siguiente: "11-subtitulos-finales"
    }
  });
}
