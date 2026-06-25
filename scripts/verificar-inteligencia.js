import { crearDiagnosticoInteligencia } from '../inteligencia/diagnostico-inteligencia.service.js';
import { procesarInteligenciaCreativa } from '../inteligencia/inteligencia.conexion.js';

async function main() {
  const diagnostico = await crearDiagnosticoInteligencia();
  const inteligencia = await procesarInteligenciaCreativa({
    entrada: { rutas: { carpetaProyecto: null } },
    entendimiento: { analisis: { duracionSegundos: 40 } },
    transcripcion: {
      transcripcion: {
        segmentos: [
          { inicio: 0, fin: 3, texto: 'Hoy vamos a evitar un error importante al editar videos.' },
          { inicio: 4, fin: 7, texto: 'Este punto clave mejora la retención del público.' }
        ]
      }
    },
    opciones: {
      inteligenciaCreativa: true,
      perfilAplicado: { id: 'educacion', nombre: 'Educación', ritmo: 'medio', visual: { colorPrincipal: '#2563eb', colorSecundario: '#60a5fa', fuente: 'Arial', tono: 'claro-profesional' } }
    },
    guardar: false
  });

  const validaciones = {
    diagnosticoOk: diagnostico.ok,
    inteligenciaOk: inteligencia.ok === true,
    hookGenerado: Boolean(inteligencia.hook?.texto),
    seoGenerado: Boolean(inteligencia.seo?.tituloPrincipal),
    hashtagsGenerados: Array.isArray(inteligencia.seo?.hashtags),
    miniaturaGenerada: Boolean(inteligencia.miniatura?.textoPrincipal),
    puntosImportantes: Array.isArray(inteligencia.puntosImportantes?.puntos)
  };

  const errores = Object.entries(validaciones)
    .filter(([, ok]) => !ok)
    .map(([nombre]) => `Validación fallida: ${nombre}`);

  const resultado = {
    ok: errores.length === 0,
    modulo: 'inteligencia',
    validaciones,
    diagnostico,
    muestra: {
      hook: inteligencia.hook,
      tituloPrincipal: inteligencia.seo?.tituloPrincipal,
      hashtags: inteligencia.seo?.hashtags,
      miniatura: inteligencia.miniatura
    },
    errores,
    creadoEn: new Date().toISOString()
  };

  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-inteligencia] Error:', error);
  process.exit(1);
});
