/* =========================================================
Nombre completo: tn.js
Ruta o ubicación: /src/pantallas/15-transiciones/index/tn.js
Funciones principales:
- Iniciar Transiciones selectivas.
- Guardar decisión/capa provisional de transiciones.
- Continuar hacia Audio principal.
Con qué se conecta:
- tn.html
- tn.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaTransiciones({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "15-transiciones",
      numero: "05",
      titulo: "Transiciones selectivas",
      descripcion: "Aplicar transiciones solo cuando ayudan al cambio de escena o idea.",
      criterio: "No conviene poner transición en cada corte. Un corte limpio suele verse más profesional.",
      acciones: [
        "Revisar cortes bruscos.",
        "Aplicar transición solo si hay cambio visual fuerte.",
        "Mantener subtítulos y overlays fuera de esta etapa."
      ],
      capaId: "transiciones-selectivas",
      tipo: "transiciones",
      botonId: "tnBtnContinuar",
      botonVolverId: "tnBtnVolver",
      anterior: "05-detectar-silencios",
      siguiente: "02-mejorar-audio"
    }
  });
}
