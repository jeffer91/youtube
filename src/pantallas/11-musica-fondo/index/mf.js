/* =========================================================
Nombre completo: mf.js
Ruta o ubicación: /src/pantallas/11-musica-fondo/index/mf.js
Funciones principales:
- Iniciar Música y sonidos.
- Guardar decisión/capa provisional de música con ducking.
- Continuar hacia Color y limpieza.
Con qué se conecta:
- mf.html
- mf.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaMusicaFondo({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "11-musica-fondo",
      numero: "07",
      titulo: "Música y sonidos",
      descripcion: "Agregar música o sonidos sin tapar la voz principal.",
      criterio: "La música debe bajar automáticamente cuando hay voz y subir solo en espacios sin habla.",
      acciones: [
        "Agregar música de fondo.",
        "Aplicar ducking automático.",
        "Evitar que música o efectos tapen la voz."
      ],
      capaId: "musica-y-sonidos",
      tipo: "audio-extra",
      botonId: "mfBtnContinuar",
      botonVolverId: "mfBtnVolver",
      anterior: "02-mejorar-audio",
      siguiente: "16-correccion-color"
    }
  });
}
