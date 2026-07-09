/* =========================================================
Nombre completo: fin.js
Ruta o ubicación: /src/pantallas/02-formato-inteligente/index/fin.js
Funciones principales:
- Iniciar Formato inteligente.
- Guardar decisión/capa provisional de formato.
- Continuar hacia Transcripción y análisis.
Con qué se conecta:
- fin.html
- fin.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaFormatoInteligente({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "02-formato-inteligente",
      numero: "02",
      titulo: "Formato inteligente",
      descripcion: "Elegir cuadrado, vertical u horizontal manteniendo el sujeto centrado.",
      criterio: "El formato va al inicio para que textos, recursos y subtítulos no se desordenen después.",
      acciones: [
        "Detectar orientación del video.",
        "Reencuadrar con sujeto centrado.",
        "Guardar zona segura para subtítulos y elementos visuales."
      ],
      capaId: "formato-inteligente",
      tipo: "formato",
      botonId: "finBtnContinuar",
      botonVolverId: "finBtnVolver",
      anterior: "01-video-base-diagnostico",
      siguiente: "03-transcripcion-analisis"
    }
  });
}
