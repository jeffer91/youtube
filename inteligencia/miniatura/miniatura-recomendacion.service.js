import { recortarTexto } from '../utilidades-extraer-texto.js';

function elegirMomentoMiniatura({ hook = null, transcripcion = {}, entendimiento = null } = {}) {
  if (hook?.activo && Number.isFinite(Number(hook.inicio))) return Number(hook.inicio);
  const duracion = Number(entendimiento?.analisis?.duracionSegundos || transcripcion?.duracionSegundos || 0);
  if (Number.isFinite(duracion) && duracion > 0) return Math.min(Math.max(duracion * 0.18, 1), 12);
  return 2;
}

export function recomendarMiniatura({ hook = null, seo = null, perfilVisual = null, transcripcion = {}, entendimiento = null } = {}) {
  const titulo = seo?.tituloPrincipal || hook?.tituloCorto || hook?.texto || 'Punto clave';
  const momento = elegirMomentoMiniatura({ hook, transcripcion, entendimiento });
  const colorPrincipal = perfilVisual?.visual?.colorPrincipal || '#2563eb';
  const colorSecundario = perfilVisual?.visual?.colorSecundario || '#60a5fa';

  return {
    ok: true,
    estado: 'RECOMENDADA_LOCAL',
    momentoSegundos: Number(momento.toFixed(2)),
    textoPrincipal: recortarTexto(titulo, 48),
    textoSecundario: perfilVisual?.nombre ? `Perfil ${perfilVisual.nombre}` : 'AutoVideoJeff',
    estilo: {
      colorPrincipal,
      colorSecundario,
      fuente: perfilVisual?.visual?.fuente || 'Arial',
      tono: perfilVisual?.visual?.tono || 'claro-profesional'
    },
    instrucciones: [
      'Usar un frame donde el rostro u objeto principal esté claro.',
      'Colocar el texto principal grande y con alto contraste.',
      'Evitar saturar la miniatura con demasiadas palabras.'
    ]
  };
}

export default recomendarMiniatura;
