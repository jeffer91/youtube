import { crearDiagnosticoPerfilesVisuales } from '../perfiles/diagnostico-perfiles.service.js';
import { aplicarPerfilVisual, obtenerPerfilVisual, obtenerResumenPerfilesVisuales } from '../perfiles/perfiles.conexion.js';

async function main() {
  const diagnostico = await crearDiagnosticoPerfilesVisuales();
  const resumen = obtenerResumenPerfilesVisuales();
  const perfilEducacion = obtenerPerfilVisual('educacion');
  const opcionesFutbol = aplicarPerfilVisual({ perfilVisual: 'futbol' });

  const validaciones = {
    diagnosticoOk: diagnostico.ok,
    perfilesRegistrados: resumen.perfiles.length >= 4,
    educacionExiste: perfilEducacion.id === 'educacion',
    futbolAplicaSubtitulos: opcionesFutbol.estiloSubtitulos === 'alto-contraste',
    futbolAplicaTextos: opcionesFutbol.estiloTextosFlotantes === 'impacto',
    futbolAplicaSonidos: opcionesFutbol.agregarSonidosEdicion === true
  };

  const errores = Object.entries(validaciones)
    .filter(([, ok]) => !ok)
    .map(([nombre]) => `Validación fallida: ${nombre}`);

  const resultado = {
    ok: errores.length === 0,
    modulo: 'perfiles',
    resumen,
    validaciones,
    diagnostico,
    errores,
    creadoEn: new Date().toISOString()
  };

  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-perfiles] Error:', error);
  process.exit(1);
});
