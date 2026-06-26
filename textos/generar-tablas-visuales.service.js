/*
  Modulo: textos
  Funcion: crear tablas visuales compactas para explicar informacion.
*/

export function generarTablaVisual({ columnas = [], filas = [], titulo = 'Tabla', inicio = 0, perfil = 'general' } = {}) {
  const columnasLimpias = columnas.map((columna) => String(columna).trim()).filter(Boolean).slice(0, 4);
  const filasLimpias = filas.slice(0, 6).map((fila) => {
    if (Array.isArray(fila)) return fila.slice(0, columnasLimpias.length).map(String);
    return columnasLimpias.map((columna) => String(fila[columna] ?? ''));
  });

  return {
    id: `tabla-${Date.now()}`,
    tipo: 'tabla_visual',
    titulo,
    columnas: columnasLimpias,
    filas: filasLimpias,
    inicio: Number(inicio),
    fin: Number(inicio) + 5,
    estilo: { perfil, compacto: true, zonaSegura: true },
    requiereRevision: true,
    creadoEn: new Date().toISOString()
  };
}

export function generarTablasVisuales(lista = []) {
  return lista.map((tabla) => generarTablaVisual(tabla));
}
