import { limitarNumero } from './sonidos.config.js';
import { seleccionarSonidoParaEvento } from './seleccionar-sonido-evento.js';

function redondear(valor, decimales = 3) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function obtenerEventosVisuales(visualDinamico) {
  const eventos = [];
  if (Array.isArray(visualDinamico?.eventosVisuales)) eventos.push(...visualDinamico.eventosVisuales);
  if (Array.isArray(visualDinamico?.etiquetas?.filtros)) eventos.push(...visualDinamico.etiquetas.filtros.map((item) => ({ ...item, tipo: 'etiqueta-visual' })));
  return eventos;
}

function eventoValido(evento) {
  const inicio = Number(evento?.inicio);
  const fin = Number(evento?.fin ?? inicio + 0.2);
  return Number.isFinite(inicio) && inicio >= 0 && Number.isFinite(fin) && fin >= inicio;
}

function filtrarEventosMuyCercanos(eventos, separacionMinimaSegundos) {
  const salida = [];
  let ultimoTiempo = -Infinity;

  for (const evento of eventos) {
    if (evento.tiempo - ultimoTiempo < separacionMinimaSegundos) continue;
    salida.push(evento);
    ultimoTiempo = evento.tiempo;
  }

  return salida;
}

function filtrarInicioSeguro(eventos, inicioSeguroSegundos) {
  const limite = Number(inicioSeguroSegundos || 0);
  if (!Number.isFinite(limite) || limite <= 0) return eventos;
  return eventos.filter((evento) => evento.tiempo >= limite);
}

export function crearEventosSonido({ visualDinamico = null, config, opciones = {} } = {}) {
  if (!config?.activo || opciones?.agregarSonidosEdicion === false) {
    return { ok: true, omitido: true, eventos: [], mensaje: 'Sonidos de edición desactivados.' };
  }

  const eventosVisuales = obtenerEventosVisuales(visualDinamico)
    .filter(eventoValido)
    .sort((a, b) => Number(a.inicio) - Number(b.inicio));

  if (eventosVisuales.length === 0) {
    return { ok: true, omitido: true, eventos: [], mensaje: 'No hay eventos visuales para sonorizar.' };
  }

  const eventosSonidoBase = eventosVisuales.map((evento, index) => {
    const tipoSonido = seleccionarSonidoParaEvento(evento);
    const volumen = limitarNumero(evento.volumenSonido || config.volumen, 0.04, config.volumenMaximo, config.volumen);

    return {
      id: index + 1,
      tipo: 'sonido-edicion',
      origenVisual: evento.tipo || 'visual',
      tiempo: redondear(Number(evento.inicio)),
      sonido: tipoSonido,
      volumen,
      texto: evento.texto || '',
      motivo: evento.motivo || 'Sonido sincronizado con evento visual.'
    };
  });

  const eventosConInicioSeguro = filtrarInicioSeguro(eventosSonidoBase, config.inicioSeguroSegundos);
  const filtrados = filtrarEventosMuyCercanos(eventosConInicioSeguro, config.separacionMinimaSegundos)
    .slice(0, config.cantidadMaximaEventos)
    .map((evento, index) => ({ ...evento, id: index + 1 }));

  return {
    ok: true,
    omitido: filtrados.length === 0,
    eventos: filtrados,
    descartados: eventosSonidoBase.length - filtrados.length,
    inicioSeguroSegundos: config.inicioSeguroSegundos,
    mensaje: filtrados.length > 0 ? 'Eventos de sonido creados correctamente con inicio seguro.' : 'No quedaron eventos de sonido luego de aplicar seguridad.'
  };
}

export default crearEventosSonido;
