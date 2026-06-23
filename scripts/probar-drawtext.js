import { construirDrawtextsFfmpeg } from '../transcripcion/textos-flotantes/construir-drawtext-ffmpeg.js';
import { verificarFiltrosFfmpeg } from '../transcripcion/diagnostico/verificar-filtros-ffmpeg.js';

const textos = [{ inicio: 1, fin: 4, texto: 'PUNTO CLAVE', estilo: 'badge', posicion: 'arriba' }, { inicio: 6, fin: 9, texto: 'EVITA ESTE ERROR', estilo: 'alerta', posicion: 'centro' }];
const drawtexts = construirDrawtextsFfmpeg(textos);
const diagnostico = verificarFiltrosFfmpeg({ filtroCapasFinal: drawtexts.map((item) => item.filtro).join(','), filtrosTextosFlotantes: drawtexts.map((item) => item.filtro) });

console.log('\nAutoVideoJeff - Prueba drawtext\n');
drawtexts.forEach((item) => {
  console.log(`\nTexto ${item.id}:`);
  console.log(item.filtro);
});
console.log('\nDiagnóstico:');
console.log(JSON.stringify(diagnostico, null, 2));

if (!diagnostico.ok) process.exitCode = 1;
