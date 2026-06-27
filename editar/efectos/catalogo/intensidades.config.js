/*
  Bloque 1: Catalogo de efectos
  Funcion: reglas de intensidad para que el selector no aplique efectos excesivos.
*/

export const INTENSIDADES_EFECTOS = Object.freeze({
  suave: Object.freeze({
    id: 'suave',
    nombre: 'Suave',
    maxEfectosPorMinuto: 5,
    maxEfectosSimultaneos: 2,
    duracionTextoSegundos: 2.0,
    duracionMovimientoSegundos: 2.6,
    prioridadMovimiento: 40,
    prioridadTexto: 35,
    permiteImpactosFuertes: false,
    descripcion: 'Edicion limpia, poco invasiva y segura para institucional o educacion.'
  }),
  normal: Object.freeze({
    id: 'normal',
    nombre: 'Normal',
    maxEfectosPorMinuto: 8,
    maxEfectosSimultaneos: 3,
    duracionTextoSegundos: 1.8,
    duracionMovimientoSegundos: 2.2,
    prioridadMovimiento: 35,
    prioridadTexto: 30,
    permiteImpactosFuertes: true,
    descripcion: 'Edicion balanceada para videos hablados y contenido general.'
  }),
  fuerte: Object.freeze({
    id: 'fuerte',
    nombre: 'Fuerte',
    maxEfectosPorMinuto: 12,
    maxEfectosSimultaneos: 4,
    duracionTextoSegundos: 1.5,
    duracionMovimientoSegundos: 1.8,
    prioridadMovimiento: 25,
    prioridadTexto: 22,
    permiteImpactosFuertes: true,
    descripcion: 'Edicion energica para futbol, anime, clips cortos y redes sociales.'
  })
});

export const INTENSIDAD_PREDETERMINADA_EFECTOS = 'normal';

export function obtenerIntensidadEfectos(valor = INTENSIDAD_PREDETERMINADA_EFECTOS) {
  const id = String(valor || INTENSIDAD_PREDETERMINADA_EFECTOS).trim().toLowerCase();
  return INTENSIDADES_EFECTOS[id] || INTENSIDADES_EFECTOS[INTENSIDAD_PREDETERMINADA_EFECTOS];
}
