/* Verificacion agrupada Bloque 3 AutoVideoJeff. */

import {
  detectarSujeto,
  detectarRostro,
  detectarZonasSeguras,
  crearPlanZoom,
  crearPlanAnimaciones,
  crearPlanEfectos,
  crearPlanEncuadreDinamico
} from '../visual/visual.conexion.js';
import { obtenerPlataformaExportacion } from '../exportacion/exportacion.conexion.js';

function main() {
  const plataforma = obtenerPlataformaExportacion('youtube');
  const sujeto = detectarSujeto({ video: { width: plataforma.width, height: plataforma.height } });
  const rostro = detectarRostro({}, sujeto);
  const zonas = detectarZonasSeguras({ plataforma, sujeto, rostro });
  const momentos = [{ inicio: 1, texto: 'uno' }, { inicio: 6, texto: 'dos' }, { inicio: 10, texto: 'tres' }];
  const zooms = crearPlanZoom({ momentos, perfil: 'jeff-verso', sujeto });
  const animaciones = crearPlanAnimaciones({ elementos: momentos, perfil: 'jeff-verso' });
  const efectos = crearPlanEfectos({ momentos, perfil: 'jeff-verso' });
  const encuadre = crearPlanEncuadreDinamico({ perfil: 'jeff-verso', plataforma, sujeto, rostro });

  if (!zonas.ok) throw new Error('Zonas seguras invalidas.');
  if (zooms.total !== momentos.length) throw new Error('Zooms incompletos.');
  if (animaciones.total !== momentos.length) throw new Error('Animaciones incompletas.');
  if (efectos.total !== momentos.length) throw new Error('Efectos incompletos.');
  if (!encuadre.mantenerRostroVisible) throw new Error('El encuadre no cuida el rostro.');

  console.log('OK Bloque 3 AutoVideoJeff:', {
    zona: zonas.recomendada,
    zooms: zooms.total,
    animaciones: animaciones.total,
    efectos: efectos.total
  });
}

try {
  main();
} catch (error) {
  console.error('ERROR Bloque 3 AutoVideoJeff:', error.message);
  process.exit(1);
}
