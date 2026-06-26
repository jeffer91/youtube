/* Verificacion agrupada Bloque 7 AutoVideoJeff. */

import { MENU_PRINCIPAL } from '../app/navegacion/menu.config.js';
import { renderizarSubmenu } from '../app/navegacion/submenus.service.js';
import { renderResultadoView } from '../app/pantallas/resultado.view.js';
import { crearResultadoController } from '../app/controladores/resultado.controller.js';
import { crearDiagnosticoController } from '../app/controladores/diagnostico.controller.js';

function main() {
  const ids = MENU_PRINCIPAL.map((item) => item.id);
  const requeridos = ['inicio', 'nuevo-proyecto', 'biblioteca', 'produccion', 'historial', 'perfiles', 'ajustes', 'diagnostico'];
  const faltantes = requeridos.filter((id) => !ids.includes(id));
  if (faltantes.length) throw new Error(`Faltan items de menu: ${faltantes.join(', ')}`);

  const submenuProduccion = renderizarSubmenu('produccion');
  if (!submenuProduccion.includes('reemplazos')) throw new Error('El submenu de produccion no incluye reemplazos.');

  const resultadoHtml = renderResultadoView();
  const resultadoEstado = crearResultadoController().obtenerEstado();
  const diagnosticoEstado = crearDiagnosticoController().obtenerEstado();

  if (!resultadoHtml.includes('Videos finales')) throw new Error('La vista resultado no esta lista.');
  if (!resultadoEstado.formatos.includes('9:16')) throw new Error('Resultado no contiene formato vertical.');
  if (!diagnosticoEstado.modulos.includes('gemini')) throw new Error('Diagnostico no contiene modulo Gemini.');

  console.log('OK Bloque 7 AutoVideoJeff:', ids.join(', '));
}

try {
  main();
} catch (error) {
  console.error('ERROR Bloque 7 AutoVideoJeff:', error.message);
  process.exit(1);
}
