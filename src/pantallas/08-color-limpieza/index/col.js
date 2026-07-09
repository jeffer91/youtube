/* =========================================================
Nombre completo: col.js
Ruta o ubicación: /src/pantallas/08-color-limpieza/index/col.js
Funciones principales:
- Iniciar Color y limpieza.
- Guardar decisión/capa provisional de corrección visual.
- Continuar hacia Recursos visuales.
Con qué se conecta:
- col.html
- col.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaColorLimpieza({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "08-color-limpieza",
      numero: "08",
      titulo: "Color y limpieza",
      descripcion: "Mejorar brillo, contraste, nitidez y limpieza del video base.",
      criterio: "Debe ocurrir antes de logos, textos y subtítulos para no alterar esas capas.",
      acciones: [
        "Corregir brillo, contraste y saturación.",
        "Aplicar nitidez suave si conviene.",
        "Reducir ruido visual sin destruir detalle."
      ],
      capaId: "color-y-limpieza",
      tipo: "color",
      botonId: "colBtnContinuar",
      botonVolverId: "colBtnVolver",
      anterior: "07-musica-sonidos",
      siguiente: "09-recursos-visuales"
    }
  });
}
