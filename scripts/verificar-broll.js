import { crearDiagnosticoBroll } from '../broll/diagnostico-broll.service.js';
import { procesarBrollSugerido } from '../broll/broll.conexion.js';

async function main() {
  const diagnostico = await crearDiagnosticoBroll();
  const broll = await procesarBrollSugerido({
    entrada: { rutas: { carpetaProyecto: null } },
    entendimiento: { analisis: { duracionSegundos: 60 } },
    transcripcion: {
      transcripcion: {
        segmentos: [
          { inicio: 0, fin: 3, texto: 'Este punto clave necesita una imagen de apoyo.' },
          { inicio: 7, fin: 10, texto: 'Aquí conviene mostrar un ejemplo visual para mejorar la explicación.' }
        ]
      }
    },
    inteligencia: {
      puntosImportantes: {
        puntos: [
          { inicio: 0, fin: 3, texto: 'Este punto clave necesita una imagen de apoyo.', puntaje: 6 },
          { inicio: 7, fin: 10, texto: 'Mostrar un ejemplo visual mejora la explicación.', puntaje: 5 }
        ]
      },
      seo: { palabrasClave: [{ palabra: 'imagen' }, { palabra: 'apoyo' }, { palabra: 'ejemplo' }] }
    },
    opciones: {
      brollActivo: true,
      perfilAplicado: { id: 'educacion', nombre: 'Educación' }
    },
    guardar: false
  });

  const validaciones = {
    diagnosticoOk: diagnostico.ok,
    brollOk: broll.ok === true,
    itemsGenerados: Array.isArray(broll.items) && broll.items.length >= 1,
    requiereRevision: broll.items?.every((item) => item.requiereRevision === true),
    noDescargaAutomatica: broll.items?.every((item) => item.descargarAutomaticamente === false)
  };

  const errores = Object.entries(validaciones)
    .filter(([, ok]) => !ok)
    .map(([nombre]) => `Validación fallida: ${nombre}`);

  const resultado = {
    ok: errores.length === 0,
    modulo: 'broll',
    validaciones,
    diagnostico,
    muestra: {
      estado: broll.estado,
      total: broll.total,
      primerItem: broll.items?.[0] || null
    },
    errores,
    creadoEn: new Date().toISOString()
  };

  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-broll] Error:', error);
  process.exit(1);
});
