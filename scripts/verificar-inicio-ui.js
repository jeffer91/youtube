/* Verificación Inicio UI guiado por pasos. */

import fs from 'fs';
import { renderInicioView } from '../app/pantallas/inicio.view.js';
import { activarPasoInicio, inicializarInicioUI } from '../app/inicio-ui.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(contenido, claves, contexto) {
  for (const clave of claves) exigir(contenido.includes(clave), `${contexto} no contiene ${clave}`);
}

function main() {
  const vista = renderInicioView();
  const ui = leer('app/inicio-ui.js');
  const css = leer('app/inicio.css');
  const bootstrap = leer('app/navegacion/navegacion-bootstrap.js');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  exigir(typeof inicializarInicioUI === 'function', 'inicializarInicioUI no se exporta.');
  exigir(typeof activarPasoInicio === 'function', 'activarPasoInicio no se exporta.');

  contiene(vista, [
    'data-inicio-root',
    'data-proceso-root="inicio"',
    'data-proceso-resumen="inicio"',
    'data-inicio-wizard-go="estado"',
    'data-inicio-wizard-go="accesos"',
    'data-inicio-wizard-go="servidor"',
    'data-inicio-wizard-go="diagnostico"',
    'data-inicio-wizard-panel="estado"',
    'data-inicio-wizard-panel="accesos"',
    'data-inicio-wizard-panel="servidor"',
    'data-inicio-wizard-panel="diagnostico"',
    'data-pantalla-destino="nuevo-proyecto"',
    'data-pantalla-destino="entendimiento"',
    'data-pantalla-destino="biblioteca"',
    'data-pantalla-destino="plan-edicion"',
    'data-pantalla-destino="laboratorio-efectos"',
    'data-pantalla-destino="historial"',
    'data-pantalla-destino="diagnostico"',
    'inicioServidorEstado',
    'inicioServidorTitulo',
    'data-inicio-action="refresh-server"'
  ], 'Vista inicio');

  contiene(ui, [
    './procesos-ui/proceso-visual.service.js',
    'PASOS_INICIO',
    'MAPA_PASO_PROCESO',
    'activarPasoInicio',
    'actualizarServidorLocal',
    'data-inicio-wizard-go',
    'data-inicio-action',
    'autovideojeff.inicioPaso'
  ], 'UI inicio');

  contiene(css, [
    'aj-home-dashboard[data-inicio-root]',
    'inicio-flow',
    'inicio-step',
    'inicio-wizard',
    'inicio-wizard-panel',
    'inicio-status-grid',
    'inicio-actions-grid',
    'inicio-server-card',
    'inicio-diagnostic-card'
  ], 'CSS inicio');

  contiene(bootstrap, ['inicializarInicioUI', 'inicio.css', 'inicioStyles'], 'Bootstrap navegación');
  contiene(procesos, ['inicio', 'estado-general', 'accesos-rapidos', 'servidor-local', 'diagnostico-rapido'], 'Procesos UI');

  console.log('OK inicio UI guiado: estado, accesos, servidor, diagnóstico, CSS y navegación conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR inicio UI:', error.message);
  process.exit(1);
}
