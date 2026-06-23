import { unirCapasConFiltroBase } from '../../transcripcion/capas/unir-capas-video.js';

export function aplicarCapasTranscripcion({ filtroBase, transcripcion = null } = {}) {
  if (!filtroBase || typeof filtroBase !== 'string') {
    throw new Error('No se puede aplicar capas de transcripción porque falta el filtro base.');
  }
  const capasVideo = transcripcion?.capasVideo;
  if (!capasVideo || capasVideo.omitido || capasVideo.ok !== true) {
    return { ok: true, aplicadas: false, filtroVideo: filtroBase, capasVideo: null, mensaje: 'No hay capas de transcripción para aplicar.' };
  }
  const filtroVideo = unirCapasConFiltroBase({ filtroBase, capasVideo });
  return { ok: true, aplicadas: filtroVideo !== filtroBase, filtroVideo, capasVideo, mensaje: filtroVideo !== filtroBase ? 'Capas de transcripción aplicadas al filtro de video.' : 'El filtro de video no cambió.' };
}

export default aplicarCapasTranscripcion;
