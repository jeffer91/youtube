/*
Nombre completo: YTMessages.js
Ruta: 01_interfaz_principal/YTMessages.js
Función o funciones:
  - Mostrar mensajes claros por etapa.
  - Mostrar resultados técnicos solo en el panel de detalles.
  - Evitar mensajes de prueba como flujo principal.
Se conecta con:
  - 01_interfaz_principal/YTScreenActions.js
  - 01_interfaz_principal/YTLayout.js
  - 01_interfaz_principal/YTState.js
*/

(function () {
  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function normalizeType(type) {
    const value = String(type || "info").toLowerCase();
    return ["info", "success", "warning", "error"].includes(value) ? value : "info";
  }

  function getMessageBox() {
    return document.getElementById("yt-message-box");
  }

  function getResultBox() {
    return document.getElementById("yt-result-box");
  }

  function showMessage(message, type = "info") {
    const box = getMessageBox();
    const normalizedType = normalizeType(type);

    if (window.YTState) window.YTState.setMessage(message, normalizedType);
    if (!box) return;

    box.innerHTML = `<div class="yt-message yt-message-${normalizedType}">${escapeText(message || "")}</div>`;
  }

  function showStageMessage(step, status = "READY") {
    const messages = {
      CREATE_PROJECT: "Crea un proyecto para iniciar el flujo.",
      LOAD_MATERIAL: "Carga un video largo o varios videos cortos.",
      AUTO_PROCESSING: "Procesamiento automático en curso o listo para iniciar.",
      REVIEW_LONG_VIDEO: "Revisa el video largo y las sugerencias generadas.",
      SELECT_CLIPS: "Elige los clips que quieres editar y exportar.",
      AUTO_EDITING: "La app prepara la edición automática.",
      REVIEW_RESULTS: "Revisa los resultados antes de exportar.",
      EXPORT_ALL: "Exporta todas las salidas necesarias.",
      FINAL_PACKAGE: "Crea el paquete final del proyecto.",
      COMPLETED: "Proyecto completado."
    };

    const type = status === "ERROR" ? "error" : status === "WARNING" ? "warning" : "info";
    showMessage(messages[step] || "Flujo listo.", type);
  }

  function showResult(data) {
    const box = getResultBox();
    if (!box) return;
    try { box.textContent = JSON.stringify(data || {}, null, 2); } catch (_error) { box.textContent = String(data || ""); }
  }

  function clear() {
    const messageBox = getMessageBox();
    const resultBox = getResultBox();
    if (messageBox) messageBox.innerHTML = "";
    if (resultBox) resultBox.textContent = "";
  }

  window.YTMessages = { showMessage, showStageMessage, showResult, clear };
})();
