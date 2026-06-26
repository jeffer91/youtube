/* Verificacion Bloque 3: modulo visual. */

import {
  detectarSujeto,
  detectarRostro,
  detectarZonasSeguras,
  crearPlanRemoverFondo,
  crearPlanFondo,
  crearPlanZoom,
  crearPlanAnimaciones,
  crearPlanEfectos,
  crearPlanEncuadreDinamico
} from '../visual/visual.conexion.js';
import { obtenerPlataformaExportacion } from '../exportacion/exportacion.conexion.js';

function main() {
  const plataforma = obtenerPlataformaExportacion('tiktok');
  const sujeto = detectarSujeto({ video: { width: 1080, height: 1920 } });
  const rostro = detectarRostro({}, sujeto);
  const zonas = detectarZonasSeguras({ plataforma, sujeto, rostro });
  const removerFondo = crearPlanRemoverFondo({ perfil: 'jeff-isekai', sujeto });
  const fondo = crearPlanFondo({ perfil: 'jeff-isekai', removerFondo, recurso: { nombre: 'Fondo prueba', ruta: 'biblioteca/fondo.jpg' } });
  const momentos = [{ inicio: 0, texto: 'Inicio' }, { inicio: 4, texto: 'Dato' }];
  const zoom = crearPlanZoom({ momentos, perfil: '11-contra-11', sujeto });
  const animaciones = crearPlanAnimaciones({ elementos: momentos, perfil: '11-contra-11' });
  const efectos = crearPlanEfectos({ momentos, perfil: '11-contra-11' });
  const encuadre = crearPlanEncuadreDinamico({ perfil: 'jeff-isekai', plataforma, sujeto, rostro });

  if (!sujeto.detectado) throw new Error('No se detecto sujeto.');
  if (!rostro.detectado) throw new Error('No se detecto rostro.');
  if (!zonas.recomendada) throw new Error('No se calculo zona segura.');
  if (!removerFondo.aplicar) throw new Error('No se preparo remocion de fondo para perfil visual.');
  if (!fondo.aplicar) throw new Error('No se preparo fondo.');
  if (!zoom.total || !animaciones.total || !efectos.total) throw new Error('Faltan zooms, animaciones o efectos.');
  if (!encuadre.ok) throw new Error('No se creo encuadre dinamico.');

  console.log('OK visual:', { zona: zonas.recomendada, zooms: zoom.total, efectos: efectos.total, modo: encuadre.modo });
}

try {
  main();
} catch (error) {
  console.error('ERROR visual:', error.message);
  process.exit(1);
}
