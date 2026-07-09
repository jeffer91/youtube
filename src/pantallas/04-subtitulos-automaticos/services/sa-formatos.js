/* =========================================================
Nombre completo: sa-formatos.js
Ruta o ubicación: /src/pantallas/04-subtitulos-automaticos/services/sa-formatos.js
Funciones principales:
- Definir los tres formatos automáticos de subtítulos.
- Entregar datos visuales para la interfaz.
- Entregar datos ASS para quemar subtítulos con FFmpeg.
Con qué se conecta:
- sa.js
- sa-subtitulos.js
========================================================= */

export const SA_FORMATO_DEFECTO = "negro-clasico";

export const SA_FORMATOS_SUBTITULOS = Object.freeze([
  {
    id: "verde-institucional",
    nombre: "Verde institucional",
    descripcion: "Fondo verde oscuro con texto blanco. Recomendado para videos formales.",
    etiqueta: "Formal",
    previewClass: "sa-preview-style--green",
    ass: {
      fontName: "Arial",
      fontSize: 62,
      primaryColour: "&H00FFFFFF",
      secondaryColour: "&H00FFFFFF",
      outlineColour: "&H00122C22",
      backColour: "&H00164A37",
      bold: -1,
      borderStyle: 3,
      outline: 1,
      shadow: 0,
      alignment: 2,
      marginL: 90,
      marginR: 90,
      marginV: 78
    }
  },
  {
    id: "negro-clasico",
    nombre: "Negro clásico",
    descripcion: "Fondo negro semiopaco con texto blanco. Es el formato más seguro.",
    etiqueta: "Recomendado",
    previewClass: "sa-preview-style--black",
    recomendado: true,
    ass: {
      fontName: "Arial",
      fontSize: 62,
      primaryColour: "&H00FFFFFF",
      secondaryColour: "&H00FFFFFF",
      outlineColour: "&H00000000",
      backColour: "&H99000000",
      bold: -1,
      borderStyle: 3,
      outline: 1,
      shadow: 0,
      alignment: 2,
      marginL: 90,
      marginR: 90,
      marginV: 78
    }
  },
  {
    id: "amarillo-destacado",
    nombre: "Amarillo destacado",
    descripcion: "Texto amarillo con borde negro. Útil para contenido dinámico y redes.",
    etiqueta: "Dinámico",
    previewClass: "sa-preview-style--yellow",
    ass: {
      fontName: "Arial",
      fontSize: 66,
      primaryColour: "&H0000DDFF",
      secondaryColour: "&H0000DDFF",
      outlineColour: "&H00000000",
      backColour: "&H00000000",
      bold: -1,
      borderStyle: 1,
      outline: 5,
      shadow: 2,
      alignment: 2,
      marginL: 90,
      marginR: 90,
      marginV: 82
    }
  }
]);

export function obtenerFormatosSubtitulosSA() {
  return SA_FORMATOS_SUBTITULOS.map((formato) => ({ ...formato }));
}

export function obtenerFormatoSubtitulosSA(formatoId = SA_FORMATO_DEFECTO) {
  const id = String(formatoId || SA_FORMATO_DEFECTO).trim();
  return SA_FORMATOS_SUBTITULOS.find((formato) => formato.id === id) ||
    SA_FORMATOS_SUBTITULOS.find((formato) => formato.id === SA_FORMATO_DEFECTO) ||
    SA_FORMATOS_SUBTITULOS[0];
}
