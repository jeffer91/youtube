/* =========================================================
Nombre completo: trs.js
Ruta o ubicación: /src/pantallas/05-transiciones-selectivas/index/trs.js
Funciones principales:
- Iniciar Transiciones selectivas.
- Guardar decisión/capa provisional de transiciones.
- Continuar hacia Audio principal.
Con qué se conecta:
- trs.html
- trs.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaTransicionesSelectivas({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "05-transiciones-selectivas",
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
      botonId: "trsBtnContinuar",
      botonVolverId: "trsBtnVolver",
      anterior: "04-cortes-inteligentes",
      siguiente: "06-audio-principal"
    }
  });
}
