/*
  Modulo: textos
  Funcion: crear especificaciones simples de graficos visuales para produccion.
*/

export function generarGraficosVisuales({ datos = [], titulo = 'Grafico', inicio = 0, perfil = 'general' } = {}) {
  if (!Array.isArray(datos) || datos.length === 0) {
    return { ok: true, total: 0, graficos: [] };
  }

  const grafico = {
    id: `grafico-${Date.now()}`,
    tipo: 'grafico_barras',
    titulo,
    inicio: Number(inicio),
    fin: Number(inicio) + 5,
    datos: datos.slice(0, 6).map((item, indice) => ({
      etiqueta: item.etiqueta || item.nombre || `Dato ${indice + 1}`,
      valor: Number(item.valor ?? item.value ?? 0)
    })),
    estilo: { perfil, contorno: true, zonaSegura: true },
    requiereRevision: true
  };

  return { ok: true, total: 1, graficos: [grafico], creadoEn: new Date().toISOString() };
}
