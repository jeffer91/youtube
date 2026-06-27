import {
  CATALOGO_EFECTOS,
  TOTAL_EFECTOS_CATALOGO,
  buscarEfectoPorId,
  filtrarEfectosPorPerfil,
  validarCatalogoEfectos
} from '../editar/efectos/catalogo/index.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function main() {
  const validacion = validarCatalogoEfectos(CATALOGO_EFECTOS);
  exigir(validacion.ok, `Catalogo invalido: ${JSON.stringify(validacion.errores, null, 2)}`);
  exigir(TOTAL_EFECTOS_CATALOGO >= 50, `El catalogo debe tener minimo 50 efectos. Total actual: ${TOTAL_EFECTOS_CATALOGO}`);

  const requeridos = [
    'zoom_suave',
    'zoom_deportivo',
    'texto_impacto',
    'barra_progreso',
    'color_futbol_vibrante',
    'nitidez_rostro',
    'identidad_perfil'
  ];

  requeridos.forEach((id) => exigir(buscarEfectoPorId(id), `Falta efecto requerido: ${id}`));

  const perfiles = ['general', '11-contra-11', 'jeff-isekai', 'creciaula', 'institucional', 'el-don-historia', 'jeff-verso'];
  perfiles.forEach((perfil) => {
    const efectos = filtrarEfectosPorPerfil(perfil);
    exigir(efectos.length >= 8, `Perfil ${perfil} tiene pocos efectos compatibles: ${efectos.length}`);
  });

  console.log('OK catalogo efectos:', { total: TOTAL_EFECTOS_CATALOGO, perfiles: perfiles.length });
}

try {
  main();
} catch (error) {
  console.error('ERROR catalogo efectos:', error.message);
  process.exit(1);
}
