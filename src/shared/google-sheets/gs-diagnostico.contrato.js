/* =========================================================
Nombre completo: gs-diagnostico.contrato.js
Ruta o ubicación: /src/shared/google-sheets/gs-diagnostico.contrato.js
Funciones principales:
- Validar el contrato local de Google Sheets antes de conectar la base real.
- Comprobar que existan hojas y columnas obligatorias.
- Entregar un diagnóstico simple para mostrar en pantalla o consola.
Con qué se conecta:
- gs-base-principal.config.js
- gs-hojas.contrato.js
- Bloques futuros de diagnóstico y sincronización
========================================================= */

import {
  GS_BASE_PRINCIPAL_CONFIG,
  esGoogleSheetsBasePrincipalGS
} from "./gs-base-principal.config.js";

import {
  GS_CONTRATO_HOJAS,
  obtenerNombresHojasGS,
  obtenerColumnasHojaGS
} from "./gs-hojas.contrato.js";

const COLUMNAS_OBLIGATORIAS_GS = Object.freeze([
  "id",
  "estado",
  "creadoEn",
  "actualizadoEn",
  "origen",
  "versionContrato"
]);

function validarColumnasObligatoriasGS(nombreHoja) {
  const columnas = obtenerColumnasHojaGS(nombreHoja);
  const faltantes = COLUMNAS_OBLIGATORIAS_GS.filter((columna) => !columnas.includes(columna));

  return {
    hoja: nombreHoja,
    ok: faltantes.length === 0,
    faltantes
  };
}

export function diagnosticarContratoGoogleSheetsGS() {
  const hojas = obtenerNombresHojasGS();
  const validaciones = hojas.map(validarColumnasObligatoriasGS);
  const errores = [];

  if (!esGoogleSheetsBasePrincipalGS()) {
    errores.push("Google Sheets no está declarado como base principal.");
  }

  if (!hojas.length) {
    errores.push("No hay hojas definidas en el contrato de Google Sheets.");
  }

  validaciones.forEach((validacion) => {
    if (!validacion.ok) {
      errores.push(`La hoja ${validacion.hoja} no tiene columnas obligatorias: ${validacion.faltantes.join(", ")}`);
    }
  });

  return {
    ok: errores.length === 0,
    proveedor: GS_BASE_PRINCIPAL_CONFIG.proveedor,
    rol: GS_BASE_PRINCIPAL_CONFIG.rol,
    versionContrato: GS_BASE_PRINCIPAL_CONFIG.versionContrato,
    totalHojas: hojas.length,
    hojas,
    contrato: GS_CONTRATO_HOJAS,
    validaciones,
    errores
  };
}

export function crearMensajeDiagnosticoContratoGS() {
  const diagnostico = diagnosticarContratoGoogleSheetsGS();

  if (diagnostico.ok) {
    return `Contrato Google Sheets OK: ${diagnostico.totalHojas} hojas definidas.`;
  }

  return `Contrato Google Sheets con errores: ${diagnostico.errores.join(" | ")}`;
}
