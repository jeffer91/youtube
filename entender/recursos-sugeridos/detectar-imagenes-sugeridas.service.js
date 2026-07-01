/*
  Detecta sugerencias de imágenes a partir del Entendimiento.
  No busca ni descarga imágenes: solo propone qué debe buscar/subir el usuario.
*/

const PAISES = [
  'Ecuador', 'Argentina', 'Brasil', 'Uruguay', 'Paraguay', 'Chile', 'Perú', 'Peru', 'Colombia', 'Venezuela', 'Bolivia',
  'México', 'Mexico', 'Estados Unidos', 'Canadá', 'Canada', 'Costa Rica', 'Panamá', 'Panama', 'Honduras', 'Guatemala',
  'España', 'Espana', 'Francia', 'Alemania', 'Italia', 'Inglaterra', 'Portugal', 'Países Bajos', 'Paises Bajos', 'Bélgica', 'Belgica',
  'Croacia', 'Suiza', 'Dinamarca', 'Marruecos', 'Egipto', 'Nigeria', 'Senegal', 'Ghana', 'Japón', 'Japon', 'Corea del Sur',
  'Arabia Saudita', 'Irán', 'Iran', 'Irak', 'Australia', 'Nueva Zelanda', 'Surinam', 'Jamaica', 'Catar', 'Qatar'
];

const TEMAS_VISUALES = [
  { patron: /copa\s+del\s+mundo|mundial/i, nombre: 'Copa del Mundo', etiquetas: ['copa-del-mundo', 'mundial'], uso: 'imagen de contexto general cuando se hable del Mundial o la Copa del Mundo' },
  { patron: /eliminatoria|clasificaci[oó]n|clasificar|clasificado|tabla\s+de\s+posiciones/i, nombre: 'Tabla de posiciones', etiquetas: ['tabla', 'posiciones', 'clasificacion'], uso: 'imagen o captura de tabla para explicar posiciones y clasificación' },
  { patron: /repechaje|playoff|repesca/i, nombre: 'Repechaje', etiquetas: ['repechaje', 'clasificacion'], uso: 'imagen de apoyo para explicar el repechaje o cruce pendiente' },
  { patron: /grupo\s+[a-z0-9]|fase\s+de\s+grupos/i, nombre: 'Grupo o fase de grupos', etiquetas: ['grupo', 'fase-de-grupos'], uso: 'imagen de apoyo para explicar el grupo mencionado' },
  { patron: /mapa|ubicaci[oó]n|continente|sudam[eé]rica|europa|asia|[aá]frica|concacaf|conmebol/i, nombre: 'Mapa de contexto', etiquetas: ['mapa', 'contexto'], uso: 'mapa o imagen de ubicación para contextualizar países o confederaciones' },
  { patron: /estad[ií]stica|porcentaje|probabilidad|n[uú]mero|goles|puntos|diferencia\s+de\s+gol/i, nombre: 'Gráfico o estadística', etiquetas: ['grafico', 'estadistica'], uso: 'gráfico simple o captura visual para explicar datos importantes' }
];

const PALABRAS_IGNORADAS = new Set([
  'AutoVideoJeff', 'Video', 'Proyecto', 'Entendimiento', 'Transcripción', 'Transcripcion', 'Bueno', 'Entonces', 'Ahora', 'También', 'Tambien', 'Pero', 'Porque', 'Cuando', 'Donde', 'Como', 'Para', 'Con', 'Sin', 'Este', 'Esta', 'Eso', 'Ese', 'Esa', 'Los', 'Las', 'Una', 'Uno', 'Hay', 'No', 'Si'
]);

function texto(valor = '') {
  return String(valor ?? '').trim();
}

function normalizar(valor = '') {
  return texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slug(valor = '') {
  return normalizar(valor)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'imagen';
}

function agregarTexto(lista, valor) {
  const limpio = texto(valor);
  if (limpio && limpio.length > 2) lista.push(limpio);
}

function extraerTextosProfundos(objeto, lista = [], profundidad = 0) {
  if (!objeto || profundidad > 4) return lista;
  if (typeof objeto === 'string') {
    agregarTexto(lista, objeto);
    return lista;
  }
  if (Array.isArray(objeto)) {
    objeto.slice(0, 80).forEach((item) => extraerTextosProfundos(item, lista, profundidad + 1));
    return lista;
  }
  if (typeof objeto === 'object') {
    ['textoCompleto', 'texto', 'transcripcion', 'titulo', 'nombre', 'descripcion', 'descripción', 'resumen', 'motivo', 'necesidad', 'tema', 'momento'].forEach((clave) => {
      if (typeof objeto[clave] === 'string') agregarTexto(lista, objeto[clave]);
    });
    ['segmentos', 'momentosClave', 'necesidades', 'ideas', 'temas', 'resultadosPorVideo', 'analisisVideo', 'analisisVideoGlobal'].forEach((clave) => {
      if (objeto[clave]) extraerTextosProfundos(objeto[clave], lista, profundidad + 1);
    });
  }
  return lista;
}

function obtenerTextoEntendimiento(resultado = {}) {
  const textos = [];
  agregarTexto(textos, resultado?.transcripcionGlobal?.textoCompleto);
  agregarTexto(textos, resultado?.transcripcionPrincipal?.textoCompleto);
  agregarTexto(textos, resultado?.transcripcion?.textoCompleto);
  agregarTexto(textos, resultado?.transcripcion?.texto);
  agregarTexto(textos, resultado?.entendimientoGlobal?.transcripcionGlobal?.textoCompleto);
  extraerTextosProfundos(resultado?.analisisVideo, textos);
  extraerTextosProfundos(resultado?.analisisVideoGlobal, textos);
  extraerTextosProfundos(resultado?.entendimientoGlobal?.analisisVideoGlobal, textos);
  extraerTextosProfundos(resultado?.resultadosPorVideo, textos);
  return textos.join('\n').slice(0, 60000);
}

function contarApariciones(textoBase = '', termino = '') {
  const base = normalizar(textoBase);
  const t = normalizar(termino).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!t) return 0;
  return (base.match(new RegExp(`\\b${t}\\b`, 'g')) || []).length;
}

function crearSugerencia({ nombre, motivo, usoSugerido, etiquetas = [], prioridad = 50, fuente = 'auto-entendimiento' }) {
  return {
    id: `auto-${slug(nombre)}`,
    nombre,
    motivo,
    usoSugerido,
    categoria: 'otro',
    tipo: 'imagen',
    formato: 'imagen',
    etiquetas: [...new Set(['auto', 'apoyo-visual', 'temporal', ...etiquetas.map((item) => slug(item))])],
    estado: 'pendiente',
    prioridad,
    fuente,
    actualizadoEn: new Date().toISOString()
  };
}

function detectarPaises(textoBase = '') {
  return PAISES
    .map((pais) => ({ pais, veces: contarApariciones(textoBase, pais) }))
    .filter((item) => item.veces > 0)
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 8)
    .map((item) => crearSugerencia({
      nombre: item.pais,
      motivo: `Se menciona ${item.veces} vez/veces en la transcripción o análisis.`,
      usoSugerido: `imagen de apoyo cuando se mencione ${item.pais}`,
      etiquetas: [item.pais, 'pais', 'seleccion'],
      prioridad: 90 + Math.min(item.veces, 9)
    }));
}

function detectarTemasVisuales(textoBase = '') {
  return TEMAS_VISUALES
    .filter((tema) => tema.patron.test(textoBase))
    .map((tema, indice) => crearSugerencia({
      nombre: tema.nombre,
      motivo: 'El Entendimiento detectó un tema que se explica mejor con apoyo visual.',
      usoSugerido: tema.uso,
      etiquetas: tema.etiquetas,
      prioridad: 80 - indice
    }));
}

function detectarNombresPropios(textoBase = '') {
  const conteo = new Map();
  const coincidencias = textoBase.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2}\b/g) || [];
  coincidencias.forEach((item) => {
    const limpio = item.trim();
    if (limpio.length < 4 || PALABRAS_IGNORADAS.has(limpio)) return;
    if (PAISES.some((pais) => normalizar(pais) === normalizar(limpio))) return;
    const key = limpio;
    conteo.set(key, (conteo.get(key) || 0) + 1);
  });
  return [...conteo.entries()]
    .filter(([, veces]) => veces >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nombre, veces]) => crearSugerencia({
      nombre,
      motivo: `Nombre propio mencionado ${veces} vez/veces. Puede necesitar apoyo visual si es importante.`,
      usoSugerido: `imagen de apoyo si ${nombre} es relevante para el video`,
      etiquetas: [nombre, 'nombre-propio'],
      prioridad: 65 + Math.min(veces, 9)
    }));
}

function quitarDuplicados(sugerencias = []) {
  const mapa = new Map();
  sugerencias.forEach((sugerencia) => {
    const key = slug(sugerencia.nombre);
    const actual = mapa.get(key);
    if (!actual || Number(sugerencia.prioridad || 0) > Number(actual.prioridad || 0)) mapa.set(key, sugerencia);
  });
  return [...mapa.values()].sort((a, b) => Number(b.prioridad || 0) - Number(a.prioridad || 0));
}

export function detectarImagenesSugeridasDesdeEntendimiento(resultado = {}) {
  const textoBase = obtenerTextoEntendimiento(resultado);
  if (!textoBase || textoBase.length < 20) {
    return {
      ok: true,
      total: 0,
      sugerencias: [],
      mensaje: 'No hay suficiente texto de Entendimiento para generar imágenes sugeridas automáticamente.'
    };
  }

  const sugerencias = quitarDuplicados([
    ...detectarPaises(textoBase),
    ...detectarTemasVisuales(textoBase),
    ...detectarNombresPropios(textoBase)
  ]).slice(0, 12);

  return {
    ok: true,
    total: sugerencias.length,
    sugerencias,
    fuente: 'entendimiento',
    mensaje: sugerencias.length
      ? `Se detectaron ${sugerencias.length} imágenes sugeridas desde el Entendimiento.`
      : 'No se detectaron imágenes específicas; se mantendrán sugerencias base.'
  };
}
