/*
  Bloque 1: Catalogo de efectos
  Funcion: definir y validar la forma minima de cada efecto visual.
*/

export const CATEGORIAS_EFECTO = Object.freeze({
  MOVIMIENTO: 'movimiento',
  COLOR: 'color',
  TEXTO: 'texto',
  OVERLAY: 'overlay',
  TRANSICION: 'transicion',
  RITMO: 'ritmo',
  MARCA: 'marca'
});

export const SOPORTES_FORMATO_EFECTO = Object.freeze({
  VERTICAL: '9:16',
  HORIZONTAL: '16:9',
  CUADRADO: '1:1',
  TODOS: 'todos'
});

export const NIVELES_INTENSIDAD_EFECTO = Object.freeze(['suave', 'normal', 'fuerte']);

export const CAMPOS_REQUERIDOS_EFECTO = Object.freeze([
  'id',
  'nombre',
  'categoria',
  'descripcion',
  'perfilesRecomendados',
  'intensidadesPermitidas',
  'formatosCompatibles',
  'requiereTexto',
  'requiereTranscripcion',
  'requiereMomentoClave',
  'pesoBase'
]);

function esArregloConDatos(valor) {
  return Array.isArray(valor) && valor.length > 0;
}

export function validarEfectoCatalogo(efecto) {
  const errores = [];

  if (!efecto || typeof efecto !== 'object') {
    return { ok: false, errores: ['El efecto no es un objeto valido.'] };
  }

  for (const campo of CAMPOS_REQUERIDOS_EFECTO) {
    if (!(campo in efecto)) errores.push(`Falta campo requerido: ${campo}`);
  }

  if (typeof efecto.id !== 'string' || efecto.id.trim().length < 3) errores.push('El id debe ser texto valido.');
  if (typeof efecto.nombre !== 'string' || efecto.nombre.trim().length < 3) errores.push('El nombre debe ser texto valido.');
  if (!Object.values(CATEGORIAS_EFECTO).includes(efecto.categoria)) errores.push(`Categoria no valida: ${efecto.categoria}`);
  if (!esArregloConDatos(efecto.perfilesRecomendados)) errores.push('Debe tener al menos un perfil recomendado.');
  if (!esArregloConDatos(efecto.intensidadesPermitidas)) errores.push('Debe tener intensidades permitidas.');
  if (!esArregloConDatos(efecto.formatosCompatibles)) errores.push('Debe tener formatos compatibles.');
  if (typeof efecto.requiereTexto !== 'boolean') errores.push('requiereTexto debe ser booleano.');
  if (typeof efecto.requiereTranscripcion !== 'boolean') errores.push('requiereTranscripcion debe ser booleano.');
  if (typeof efecto.requiereMomentoClave !== 'boolean') errores.push('requiereMomentoClave debe ser booleano.');
  if (!Number.isFinite(Number(efecto.pesoBase))) errores.push('pesoBase debe ser numerico.');

  return { ok: errores.length === 0, errores };
}

export function validarCatalogoEfectos(catalogo = []) {
  const errores = [];
  const ids = new Set();

  if (!Array.isArray(catalogo)) {
    return { ok: false, total: 0, errores: ['El catalogo debe ser un arreglo.'] };
  }

  catalogo.forEach((efecto, index) => {
    const validacion = validarEfectoCatalogo(efecto);
    if (!validacion.ok) errores.push({ index, id: efecto?.id || null, errores: validacion.errores });
    if (efecto?.id) {
      if (ids.has(efecto.id)) errores.push({ index, id: efecto.id, errores: ['Id duplicado.'] });
      ids.add(efecto.id);
    }
  });

  return { ok: errores.length === 0, total: catalogo.length, errores };
}
