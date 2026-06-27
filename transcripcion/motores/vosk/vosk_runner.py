import argparse
import json
import sys
import time
import wave
from pathlib import Path


def escribir_json(ruta, datos):
    Path(ruta).parent.mkdir(parents=True, exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as archivo:
        json.dump(datos, archivo, ensure_ascii=False, indent=2)


def crear_error(mensaje, args=None):
    return {
        'ok': False,
        'motor': 'vosk',
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
    parser = argparse.ArgumentParser(description='Runner local de Vosk para AutoVideoJeff')
    parser.add_argument('--audio', required=True, help='Ruta del audio WAV preparado')
    parser.add_argument('--output', required=True, help='Ruta JSON de salida')
    parser.add_argument('--model', required=True, help='Ruta de carpeta del modelo Vosk')
    parser.add_argument('--language', default='es', help='Idioma esperado')
    parser.add_argument('--words', default='true', help='Incluir palabras con tiempos')
    return parser.parse_args()


def abrir_wav_valido(ruta_audio):
    wav = wave.open(str(ruta_audio), 'rb')
    if wav.getnchannels() != 1:
        raise ValueError('Vosk necesita audio mono. El audio preparado no es mono.')
    if wav.getsampwidth() != 2:
        raise ValueError('Vosk necesita audio PCM 16-bit. El audio preparado no cumple.')
    if wav.getframerate() not in (8000, 16000, 22050, 44100, 48000):
        raise ValueError(f'Frecuencia no esperada para Vosk: {wav.getframerate()}')
    return wav


def normalizar_segmento(resultado, indice):
    texto = (resultado.get('text') or '').strip()
    palabras = resultado.get('result') or []
    inicio = 0.0
    fin = None
    confianza = None

    if palabras:
        inicio = float(palabras[0].get('start', 0) or 0)
        fin = float(palabras[-1].get('end', inicio) or inicio)
        confianzas = [float(p.get('conf', 0)) for p in palabras if p.get('conf') is not None]
        if confianzas:
            confianza = sum(confianzas) / len(confianzas)

    return {
        'id': f'seg-{indice + 1:04d}',
        'indice': indice,
        'inicio': round(inicio, 3),
        'fin': round(fin, 3) if fin is not None else None,
        'texto': texto,
        'confianza': round(confianza, 4) if confianza is not None else None,
        'metadata': {
            'palabras': palabras,
            'origen': 'vosk'
        }
    }


def main():
    args = parsear_argumentos()
    audio = Path(args.audio)
    modelo = Path(args.model)

    if not audio.exists():
        resultado = crear_error(f'No existe el audio para Vosk: {audio}', args)
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 2

    if not modelo.exists() or not modelo.is_dir():
        resultado = crear_error(f'No existe la carpeta del modelo Vosk: {modelo}', args)
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 3

    try:
        from vosk import Model, KaldiRecognizer, SetLogLevel
    except Exception as error:
        resultado = crear_error('Vosk no está instalado. Instala con: pip install vosk', args)
        resultado['error']['detalle'] = str(error)
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 4

    inicio_tiempo = time.time()
    try:
        SetLogLevel(-1)
        wav = abrir_wav_valido(audio)
        model = Model(str(modelo))
        recognizer = KaldiRecognizer(model, wav.getframerate())
        recognizer.SetWords(str(args.words).lower() != 'false')

        resultados = []
        while True:
            data = wav.readframes(4000)
            if len(data) == 0:
                break
            if recognizer.AcceptWaveform(data):
                parcial = json.loads(recognizer.Result())
                if (parcial.get('text') or '').strip():
                    resultados.append(parcial)

        final = json.loads(recognizer.FinalResult())
        if (final.get('text') or '').strip():
            resultados.append(final)

        segmentos = [normalizar_segmento(resultado, indice) for indice, resultado in enumerate(resultados)]
        texto_completo = ' '.join([segmento['texto'] for segmento in segmentos if segmento['texto']]).strip()
        duracion = None
        try:
            duracion = wav.getnframes() / float(wav.getframerate())
        except Exception:
            duracion = None
        wav.close()

        resultado = {
            'ok': bool(texto_completo),
            'motor': 'vosk',
            'estado': 'ok' if texto_completo else 'vacia',
            'idioma': args.language,
            'textoCompleto': texto_completo,
            'segmentos': segmentos,
            'cantidadSegmentos': len(segmentos),
            'duracionSegundos': round(duracion, 3) if duracion is not None else None,
            'confianza': None,
            'mensaje': 'Transcripción generada con Vosk.' if texto_completo else 'Vosk no encontró texto útil.',
            'metadata': {
                'modelo': str(modelo),
                'audio': str(audio),
                'tiempoSegundos': round(time.time() - inicio_tiempo, 3),
                'words': str(args.words).lower() != 'false'
            },
            'creadoEn': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 0 if texto_completo else 5
    except Exception as error:
        resultado = crear_error(f'Error ejecutando Vosk: {error}', args)
        resultado['metadata'] = {
            'modelo': str(modelo),
            'audio': str(audio)
        }
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 6


if __name__ == '__main__':
    sys.exit(main())
