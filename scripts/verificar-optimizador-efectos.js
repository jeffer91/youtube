import { optimizarPlanEfectos } from '../editar/efectos/optimizador/index.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function crearSeleccionExcesiva() {
  const base = [
    { efectoId: 'zoom_suave', inicio: 1, fin: 3, prioridad: 10, texto: '', intensidad: 'fuerte' },
    { efectoId: 'zoom_deportivo', inicio: 4, fin: 6, prioridad: 11, texto: '', intensidad: 'fuerte' },
    { efectoId: 'color_futbol_vibrante', inicio: 1, fin: 4, prioridad: 12, texto: '', intensidad: 'fuerte' },
    { efectoId: 'color_anime_vivo', inicio: 8, fin: 10, prioridad: 13, texto: '', intensidad: 'fuerte' },
    { efectoId: 'texto_impacto', inicio: 2, fin: 5, prioridad: 14, texto: 'Golpe visual', intensidad: 'fuerte' },
    { efectoId: 'palabra_clave', inicio: 2.2, fin: 5.2, prioridad: 15, texto: 'Presión alta', intensidad: 'fuerte' },
    { efectoId: 'barra_progreso', inicio: 0, fin: 40, prioridad: 16, texto: '', intensidad: 'fuerte' },
    { efectoId: 'nitidez_rostro', inicio: 0, fin: 40, prioridad: 17, texto: '', intensidad: 'fuerte' },
    { efectoId: 'identidad_perfil', inicio: 36, fin: 39, prioridad: 18, texto: '11 contra 11', intensidad: 'fuerte' }
  ];
  return { ok: true, origen: 'local', intensidad: 'fuerte', efectos: base };
}

function main() {
  const contexto = {
    intensidad: { id: 'fuerte' },
    perfil: { id: '11-contra-11', nombre: '11 contra 11' },
    duracionSegundos: 40
  };
  const optimizado = optimizarPlanEfectos(crearSeleccionExcesiva(), contexto, { maxEfectos: 8 });

  exigir(optimizado.optimizado === true, 'El plan no fue marcado como optimizado.');
  exigir(optimizado.efectos.length <= 8, 'El optimizador no respeta maxEfectos.');
  exigir(optimizado.efectos.filter((e) => e.efectoId.startsWith('zoom')).length <= 1, 'El optimizador permite zooms globales acumulados.');
  exigir(optimizado.efectos.filter((e) => e.efectoId.startsWith('color')).length <= 1, 'El optimizador permite colores globales acumulados.');
  exigir(optimizado.advertencias.length > 0, 'El optimizador debe reportar advertencias cuando omite efectos.');

  console.log('OK optimizador efectos:', { entrada: optimizado.totalEntrada, salida: optimizado.total, advertencias: optimizado.advertencias.length });
}

try {
  main();
} catch (error) {
  console.error('ERROR optimizador efectos:', error.message);
  process.exit(1);
}
