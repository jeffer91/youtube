/*
  Modulo: visual
  Funcion: calcular zonas disponibles para textos, imagenes y graficos.
*/

function intersecta(a, b) {
  return !(
    a.x + a.ancho < b.x ||
    b.x + b.ancho < a.x ||
    a.y + a.alto < b.y ||
    b.y + b.alto < a.y
  );
}

export function detectarZonasSeguras({ plataforma = {}, sujeto = {}, rostro = {} } = {}) {
  const width = plataforma.width || 1080;
  const height = plataforma.height || 1920;
  const margen = plataforma.zonaSegura || { top: 160, bottom: 260, left: 80, right: 80 };

  const zonas = [
    { id: 'superior', x: margen.left, y: margen.top, ancho: width - margen.left - margen.right, alto: Math.round(height * 0.22) },
    { id: 'centro_lateral', x: margen.left, y: Math.round(height * 0.34), ancho: width - margen.left - margen.right, alto: Math.round(height * 0.22) },
    { id: 'inferior', x: margen.left, y: height - margen.bottom - Math.round(height * 0.18), ancho: width - margen.left - margen.right, alto: Math.round(height * 0.18) }
  ];

  const ocupadas = [sujeto.caja, rostro.caja].filter(Boolean);
  const libres = zonas.map((zona) => ({
    ...zona,
    libre: !ocupadas.some((ocupada) => intersecta(zona, ocupada)),
    prioridad: zona.id === 'superior' ? 1 : zona.id === 'centro_lateral' ? 2 : 3
  }));

  return {
    ok: true,
    width,
    height,
    zonas: libres,
    recomendada: libres.find((zona) => zona.libre)?.id || 'superior',
    creadoEn: new Date().toISOString()
  };
}
