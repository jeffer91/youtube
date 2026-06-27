import argparse
import json
import sys
import time
from pathlib import Path


def escribir_json(ruta, datos):
    Path(ruta).parent.mkdir(parents=True, exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as archivo:
        json.dump(datos, archivo, ensure_ascii=False, indent=2)


def crear_error(mensaje, args=None):
    return {
        'ok': False,
        'motor': 'faster-whisper',
        'estado': 'error',
        'textoCompleto': '',
        'segmentos': [],
        'cantidadSegmentos': 0,
        'idioma': getattr(args, 'language', 'es') if args else 'es',
        'mensaje': mensaje,
        'error': {'mensaje': mensaje},
        'creadoEn': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    }


def parsear_argumentos():
    parser = argparse.ArgumentParser(description='Runner local de faster-whisper para AutoVideoJeff')
    parser.add_argument('--audio', required=True, help='Ruta del audio WAV preparado')
    parser.add_argument('--output', required=True, help='Ruta JSON de salida')
    parser.add_argument('--model', default='small', help='Modelo faster-whisper: tiny, base, small, medium, large-v3')
    parser.add_argument('--language', default='es', help='Idioma esperado')
    parser.add_argument('--device', default='cpu', help='cpu o cuda')
    parser.add_argument('--compute-type', default='int8', help='int8, float16, float32')
    parser.add_argument('--beam-size', type=int, default=5)
    parser.add_argument('--vad-filter', default='true')
    return parser.parse_args()


def main():
    args = parsear_argumentos()
    audio = Path(args.audio)
    if not audio.exists():
        resultado = crear_error(f'No existe el audio para faster-whisper: {audio}', args)
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 2

    try:
        from faster_whisper import WhisperModel
    except Exception as error:
        resultado = crear_error(
            'faster-whisper no está instalado. Instala con: pip install faster-whisper',
            args
        )
        resultado['error']['detalle'] = str(error)
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 3

    inicio = time.time()
    try:
        modelo = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
        segmentos_iter, info = modelo.transcribe(
            str(audio),
            language=args.language or None,
            beam_size=args.beam_size,
            vad_filter=str(args.vad_filter).lower() != 'false'
        )

        segmentos = []
        textos = []
        for indice, segmento in enumerate(segmentos_iter):
            texto = (segmento.text or '').strip()
            if texto:
                textos.append(texto)
            segmentos.append({
                'id': f'seg-{indice + 1:04d}',
                'indice': indice,
                'inicio': round(float(segmento.start or 0), 3),
                'fin': round(float(segmento.end or 0), 3),
                'texto': texto,
                'confianza': None,
                'metadata': {
                    'avg_logprob': getattr(segmento, 'avg_logprob', None),
                    'no_speech_prob': getattr(segmento, 'no_speech_prob', None)
                }
            })

        texto_completo = ' '.join(textos).strip()
        resultado = {
            'ok': bool(texto_completo),
            'motor': 'faster-whisper',
            'estado': 'ok' if texto_completo else 'vacia',
            'idioma': getattr(info, 'language', args.language) or args.language,
            'textoCompleto': texto_completo,
            'segmentos': segmentos,
            'cantidadSegmentos': len(segmentos),
            'duracionSegundos': getattr(info, 'duration', None),
            'confianza': getattr(info, 'language_probability', None),
            'mensaje': 'Transcripción generada con faster-whisper.' if texto_completo else 'faster-whisper no encontró texto útil.',
            'metadata': {
                'modelo': args.model,
                'device': args.device,
                'computeType': args.compute_type,
                'beamSize': args.beam_size,
                'vadFilter': str(args.vad_filter).lower() != 'false',
                'tiempoSegundos': round(time.time() - inicio, 3),
                'audio': str(audio)
            },
            'creadoEn': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 0 if texto_completo else 4
    except Exception as error:
        resultado = crear_error(f'Error ejecutando faster-whisper: {error}', args)
        resultado['metadata'] = {
            'modelo': args.model,
            'device': args.device,
            'computeType': args.compute_type,
            'audio': str(audio)
        }
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 5


if __name__ == '__main__':
    sys.exit(main())
