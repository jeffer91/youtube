/*
  Modulo: recursos-externos
  Funcion: crear nombres entendibles para recursos descargados o sugeridos.
*/

function limpiar(texto = '') {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function nombrarRecurso({ tipo = 'imagen', perfil = 'general', tema = '', frase = '', extension = null } = {}) {
  const base = [perfil, tema || frase || 'recurso', tipo].map(limpiar).filter(Boolean).join('-');
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sufijo = Math.random().toString(36).slice(2, 6);
  const ext = extension ? `.${limpiar(extension).replace('.', '')}` : '';
  return `${base}-${fecha}-${sufijo}${ext}`;
}

export function crearNombreEntendibleRecurso(recurso = {}) {
  const tema = recurso.tema || recurso.fraseRelacionada || recurso.nombre || 'recurso';
  return nombrarRecurso({ tipo: recurso.tipo, perfil: recurso.perfil, tema, extension: recurso.extension });
}
