import fs from 'fs';
import path from 'path';
import { obtenerRutasDatosBase, asegurarCarpeta } from '../comun/archivos.js';

async function verificarEscritura(carpeta) {
  const archivoPrueba = path.join(carpeta, `.autovideojeff-test-${Date.now()}.tmp`);
  await fs.promises.writeFile(archivoPrueba, 'ok', 'utf-8');
  await fs.promises.unlink(archivoPrueba);
}

async function verificarCarpeta(nombre, ruta) {
  const errores = [];
  const advertencias = [];

  try {
    asegurarCarpeta(ruta);
    await verificarEscritura(ruta);
  } catch (error) {
    errores.push(`${nombre}: ${error.message}`);
  }

  return {
    nombre,
    ruta,
    ok: errores.length === 0,
    errores,
    advertencias
  };
}

export async function verificarCarpetasDiagnostico() {
  const rutas = obtenerRutasDatosBase();
  const verificaciones = [];

  for (const [nombre, ruta] of Object.entries(rutas)) {
    if (nombre === 'raiz') continue;
    verificaciones.push(await verificarCarpeta(nombre, ruta));
  }

  const errores = verificaciones.flatMap((item) => item.errores);
  const advertencias = verificaciones.flatMap((item) => item.advertencias);

  return {
    ok: errores.length === 0,
    bloqueante: errores.length > 0,
    etapa: 'diagnostico-carpetas',
    raiz: rutas.raiz,
    rutas,
    verificaciones,
    errores,
    advertencias,
    mensaje: errores.length === 0 ? 'Carpetas y permisos de escritura correctos.' : `Hay carpetas sin permisos: ${errores.join(' ')}`,
    creadoEn: new Date().toISOString()
  };
}

export default verificarCarpetasDiagnostico;
