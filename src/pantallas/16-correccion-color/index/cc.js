/* =========================================================
Nombre completo: cc.js
Ruta o ubicación: /src/pantallas/16-correccion-color/index/cc.js
Funciones principales:
- Iniciar Color y limpieza.
- Guardar decisión/capa provisional de corrección visual.
- Continuar hacia Recursos visuales.
Con qué se conecta:
- cc.html
- cc.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaCorreccionColor({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "16-correccion-color",
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
      botonId: "ccBtnContinuar",
      botonVolverId: "ccBtnVolver",
      anterior: "11-musica-fondo",
      siguiente: "13-agregar-imagen-video"
    }
  });
}
