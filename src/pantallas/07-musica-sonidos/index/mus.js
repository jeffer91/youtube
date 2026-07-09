/* =========================================================
Nombre completo: mus.js
Ruta o ubicación: /src/pantallas/07-musica-sonidos/index/mus.js
Funciones principales:
- Iniciar Música y sonidos.
- Guardar decisión/capa provisional de música con ducking.
- Continuar hacia Color y limpieza.
Con qué se conecta:
- mus.html
- mus.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaMusicaSonidos({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "07-musica-sonidos",
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
      botonId: "musBtnContinuar",
      botonVolverId: "musBtnVolver",
      anterior: "06-audio-principal",
      siguiente: "08-color-limpieza"
    }
  });
}
