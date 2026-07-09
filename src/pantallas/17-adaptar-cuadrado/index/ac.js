/* =========================================================
Nombre completo: ac.js
Ruta o ubicación: /src/pantallas/17-adaptar-cuadrado/index/ac.js
Funciones principales:
- Iniciar Formato inteligente.
- Guardar decisión/capa provisional de formato.
- Continuar hacia Transcripción y análisis.
Con qué se conecta:
- ac.html
- ac.css
- paso-pendiente.js
========================================================= */

import { iniciarPasoFuncionalPendiente } from "../../../shared/flujo/paso-pendiente.js";

export async function iniciarPantallaFormatoInteligente({ root, router, estadoApp }) {
  iniciarPasoFuncionalPendiente({
    root,
    router,
    estadoApp,
    config: {
      routeId: "17-adaptar-cuadrado",
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
      botonId: "acBtnContinuar",
      botonVolverId: "acBtnVolver",
      anterior: "01-cargar-proyecto",
      siguiente: "03-transcribir-video"
    }
  });
}
