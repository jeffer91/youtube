window.YTFinalButtons = {
  bindFinalButtons() {
    const packageBtn = document.getElementById("yt-btn-create-package");
    if (!packageBtn) return;
    packageBtn.addEventListener("click", async () => {
      if (!window.YTExport || typeof window.YTExport.createPackage !== "function") {
        window.YTMessages.message("warning", "El guardado del paquete final no está disponible.");
        return;
      }
      const state = window.YTState.getState();
      const result = await window.YTExport.createPackage({
        title: state.currentProject ? state.currentProject.name : "Video AutoEdit",
        tags: ["autoedit", "video"]
      });
      if (!result.ok) {
        window.YTMessages.message("error", result.message || "No se pudo guardar el paquete final.");
        window.YTMessages.result("Paquete final con error", result);
        return;
      }
      window.YTState.setCurrentExportPackage(result.publicationPackage || result.package || result);
      window.YTLayout.refreshFromState();
      window.YTMessages.message("success", "Paquete final guardado correctamente.");
      window.YTMessages.result("Paquete final guardado", result);
    });
  }
};
