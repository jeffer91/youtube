export const PERFILES_VERSION = '0.1.0';

export const PERFIL_PREDETERMINADO = 'educacion';

export const PERFILES_VISUALES = Object.freeze({
  educacion: Object.freeze({
    id: 'educacion',
    nombre: 'Educación',
    descripcion: 'Perfil claro para clases, tutoriales, explicaciones y contenido académico.',
    ritmo: 'medio',
    transcripcion: Object.freeze({
      estiloSubtitulos: 'tiktok-profesional',
      estiloTextosFlotantes: 'badge',
      maxTextosFlotantes: 6,
      agregarSubtitulos: true,
      agregarTextosFlotantes: true
    }),
    edicion: Object.freeze({
      nivelEdicion: 2,
      intensidadEdicion: 'automatica',
      modoEdicionDinamica: 'automatica',
      cortarSilencios: true,
      agregarZooms: true,
      agregarPunchIn: true,
      agregarBarraProgreso: true,
      agregarEtiquetasVisuales: true
    }),
    sonido: Object.freeze({
      agregarSonidosEdicion: true,
      modoSonidosEdicion: 'normal',
      volumenSonidosEdicion: 0.18,
      separacionMinimaSonidos: 1.4,
      cantidadMaximaSonidos: 12
    }),
    visual: Object.freeze({
      colorPrincipal: '#2563eb',
      colorSecundario: '#60a5fa',
      fuente: 'Arial',
      tono: 'claro-profesional'
    })
  }),
  futbol: Object.freeze({
    id: 'futbol',
    nombre: 'Fútbol',
    descripcion: 'Perfil dinámico para análisis deportivo, jugadas, reacciones y narrativas de partido.',
    ritmo: 'alto',
    transcripcion: Object.freeze({
      estiloSubtitulos: 'alto-contraste',
      estiloTextosFlotantes: 'impacto',
      maxTextosFlotantes: 8,
      agregarSubtitulos: true,
      agregarTextosFlotantes: true
    }),
    edicion: Object.freeze({
      nivelEdicion: 3,
      intensidadEdicion: 'rapida',
      modoEdicionDinamica: 'rapida',
      cortarSilencios: true,
      agregarZooms: true,
      agregarPunchIn: true,
      agregarBarraProgreso: true,
      agregarEtiquetasVisuales: true
    }),
    sonido: Object.freeze({
      agregarSonidosEdicion: true,
      modoSonidosEdicion: 'dinamico',
      volumenSonidosEdicion: 0.28,
      separacionMinimaSonidos: 0.9,
      cantidadMaximaSonidos: 18
    }),
    visual: Object.freeze({
      colorPrincipal: '#16a34a',
      colorSecundario: '#facc15',
      fuente: 'Arial',
      tono: 'deportivo-energetico'
    })
  }),
  formal: Object.freeze({
    id: 'formal',
    nombre: 'Formal',
    descripcion: 'Perfil sobrio para instituciones, informes, reuniones y contenido profesional.',
    ritmo: 'bajo',
    transcripcion: Object.freeze({
      estiloSubtitulos: 'minimalista',
      estiloTextosFlotantes: 'elegante',
      maxTextosFlotantes: 4,
      agregarSubtitulos: true,
      agregarTextosFlotantes: true
    }),
    edicion: Object.freeze({
      nivelEdicion: 1,
      intensidadEdicion: 'suave',
      modoEdicionDinamica: 'suave',
      cortarSilencios: true,
      agregarZooms: false,
      agregarPunchIn: false,
      agregarBarraProgreso: false,
      agregarEtiquetasVisuales: false
    }),
    sonido: Object.freeze({
      agregarSonidosEdicion: false,
      modoSonidosEdicion: 'suave',
      volumenSonidosEdicion: 0.08,
      separacionMinimaSonidos: 2.5,
      cantidadMaximaSonidos: 4
    }),
    visual: Object.freeze({
      colorPrincipal: '#334155',
      colorSecundario: '#94a3b8',
      fuente: 'Arial',
      tono: 'institucional'
    })
  }),
  entretenimiento: Object.freeze({
    id: 'entretenimiento',
    nombre: 'Entretenimiento',
    descripcion: 'Perfil llamativo para videos rápidos, redes sociales, reacción y contenido viral.',
    ritmo: 'alto',
    transcripcion: Object.freeze({
      estiloSubtitulos: 'tiktok-profesional',
      estiloTextosFlotantes: 'alerta',
      maxTextosFlotantes: 10,
      agregarSubtitulos: true,
      agregarTextosFlotantes: true
    }),
    edicion: Object.freeze({
      nivelEdicion: 4,
      intensidadEdicion: 'rapida',
      modoEdicionDinamica: 'rapida',
      cortarSilencios: true,
      agregarZooms: true,
      agregarPunchIn: true,
      agregarBarraProgreso: true,
      agregarEtiquetasVisuales: true
    }),
    sonido: Object.freeze({
      agregarSonidosEdicion: true,
      modoSonidosEdicion: 'dinamico',
      volumenSonidosEdicion: 0.3,
      separacionMinimaSonidos: 0.8,
      cantidadMaximaSonidos: 20
    }),
    visual: Object.freeze({
      colorPrincipal: '#e11d48',
      colorSecundario: '#f97316',
      fuente: 'Arial',
      tono: 'viral-dinamico'
    })
  })
});

export function listarPerfilesVisuales() {
  return Object.values(PERFILES_VISUALES).map((perfil) => ({
    id: perfil.id,
    nombre: perfil.nombre,
    descripcion: perfil.descripcion,
    ritmo: perfil.ritmo
  }));
}

export default PERFILES_VISUALES;
