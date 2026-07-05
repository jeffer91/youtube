/* =========================================================
Nombre completo: mn-app.js
Ruta o ubicación: /src/pantallas/99-manual-app/index/mn-app.js
Funciones principales:
- Iniciar el manual interno de la app.
- Mantener una función inicial compatible con el router.
- Evitar lógica pesada en la pantalla de ayuda.
Con qué se conecta:
- mn-app.html
- mn-app.css
- router.js
========================================================= */

export async function iniciarPantallaManualApp() {
  const raiz = document.getElementById("mnRoot");

  if (!raiz) {
    return;
  }

  raiz.dataset.manualActivo = "true";
}
