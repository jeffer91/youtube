/* =========================================================
Nombre completo: gs-base-principal.config.js
Ruta o ubicación: /src/shared/google-sheets/gs-base-principal.config.js
Funciones principales:
- Declarar que Google Sheets es la base principal de la app.
- Centralizar nombres oficiales de hojas.
- Evitar que cada pantalla invente su propia estructura de datos.
- Mantener JSON local solo como respaldo, no como base principal.
Con qué se conecta:
- gs-hojas.contrato.js
- gs-registros.mapper.js
- Bloques futuros de conexión Google Sheets
========================================================= */

export const GS_BASE_PRINCIPAL_CONFIG = Object.freeze({
  proveedor: "GOOGLE_SHEETS",
  nombreVisible: "Google Sheets",
  rol: "BASE_PRINCIPAL",
  respaldoLocal: "JSON_LOCAL_RESPALDO",
  versionContrato: "1.0.0",
  zonaHoraria: "America/Guayaquil",
  separadorInterno: "||",
  hojas: Object.freeze({
    PROYECTOS: "Proyectos",
    VIDEOS: "Videos",
    CAPAS: "Capas",
    AUDIOS: "Audios",
    TRANSCRIPCIONES: "Transcripciones",
    SUBTITULOS: "Subtitulos",
    EXPORTACIONES: "Exportaciones",
    PENDIENTES_SYNC: "PendientesSync",
    LOGS: "Logs"
  })
});

export function obtenerNombreHojaGS(claveHoja) {
  return GS_BASE_PRINCIPAL_CONFIG.hojas[claveHoja] || "";
}

export function esGoogleSheetsBasePrincipalGS() {
  return GS_BASE_PRINCIPAL_CONFIG.proveedor === "GOOGLE_SHEETS" &&
    GS_BASE_PRINCIPAL_CONFIG.rol === "BASE_PRINCIPAL";
}

export function crearMetadataBasePrincipalGS() {
  return {
    proveedor: GS_BASE_PRINCIPAL_CONFIG.proveedor,
    nombreVisible: GS_BASE_PRINCIPAL_CONFIG.nombreVisible,
    rol: GS_BASE_PRINCIPAL_CONFIG.rol,
    respaldoLocal: GS_BASE_PRINCIPAL_CONFIG.respaldoLocal,
    versionContrato: GS_BASE_PRINCIPAL_CONFIG.versionContrato,
    zonaHoraria: GS_BASE_PRINCIPAL_CONFIG.zonaHoraria
  };
}
