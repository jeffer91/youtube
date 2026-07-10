/* =========================================================
Nombre completo: verificar-formato-cuadrado.mjs
Ruta o ubicación: /tools/verificar-formato-cuadrado.mjs
Funciones principales:
- Verificar por análisis estático que el paso 02 tenga motor real.
- Confirmar que main y preload registren el IPC de formato cuadrado.
- Confirmar que la interfaz incluya Antes, Después y conversión 1080 x 1080.
========================================================= */

import fs from "node:fs";

const comprobaciones = [
  ["electron/main/main.js", "registrarFormatoInteligenteElectron"],
  ["electron/preload/preload.js", "convertirVideoCuadrado"],
  ["src/pantallas/02-formato-inteligente/electron/fin-electron.js", "formato:convertir-cuadrado"],
  ["src/pantallas/02-formato-inteligente/electron/fin-electron.js", "1080"],
  ["src/pantallas/02-formato-inteligente/index/fin.js", "ANTES"],
  ["src/pantallas/02-formato-inteligente/index/fin.js", "DESPUÉS"],
  ["src/pantallas/02-formato-inteligente/index/fin.js", "Convertir todos a cuadrado"]
];

const errores = comprobaciones.flatMap(([archivo, texto]) => {
  if (!fs.existsSync(archivo)) return [`Falta ${archivo}`];
  const contenido = fs.readFileSync(archivo, "utf8");
  return contenido.includes(texto) ? [] : [`${archivo} no contiene ${texto}`];
});

if (errores.length) {
  console.error("Verificación de formato cuadrado: ERROR");
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Verificación de formato cuadrado: OK");
