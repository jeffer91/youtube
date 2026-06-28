#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analisis visual local para AutoVideoJeff.

Usa OpenCV para medir brillo, contraste, nitidez, cambios entre frames y rostro probable.
Usa PySceneDetect si esta instalado para detectar cambios de escena/cortes.
No usa servicios externos ni Gemini.
"""

import argparse
import json
import math
import os
import sys
from typing import Any, Dict, List, Optional, Tuple


def redondear(valor: Any, decimales: int = 3, respaldo: Optional[float] = None) -> Optional[float]:
    try:
        numero = float(valor)
        if not math.isfinite(numero):
            return respaldo
        return round(numero, decimales)
    except Exception:
        return respaldo


def cargar_json(ruta: str) -> Dict[str, Any]:
    with open(ruta, "r", encoding="utf-8") as archivo:
        return json.load(archivo)


def escribir_json(ruta: str, data: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as archivo:
        json.dump(data, archivo, ensure_ascii=False, indent=2)


def nivel_texto(valor: float, bajo: float, alto: float, etiquetas: Tuple[str, str, str]) -> str:
    if valor < bajo:
        return etiquetas[0]
    if valor > alto:
        return etiquetas[2]
    return etiquetas[1]


def posicion_narrativa(indice: int, total: int) -> str:
    if indice <= 0:
        return "inicio / posible hook"
    if indice >= max(0, total - 1):
        return "cierre"
    return "desarrollo"


def detectar_escenas(video: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    if not video or not os.path.exists(video):
        return [], {"ok": False, "mensaje": "No se recibió video válido para detectar escenas."}

    try:
        from scenedetect import ContentDetector, detect  # type: ignore

        escenas_raw = detect(video, ContentDetector(threshold=27.0))
        escenas = []
        for indice, (inicio, fin) in enumerate(escenas_raw):
            inicio_s = redondear(inicio.get_seconds(), 3, 0) or 0
            fin_s = redondear(fin.get_seconds(), 3, inicio_s) or inicio_s
            escenas.append({
                "id": f"escena-{indice + 1:02d}",
                "inicio": inicio_s,
                "fin": fin_s,
                "duracion": redondear(fin_s - inicio_s, 3, 0),
            })
        return escenas, {
            "ok": True,
            "herramienta": "PySceneDetect ContentDetector",
            "mensaje": f"{len(escenas)} escena(s) detectada(s).",
        }
    except Exception as error:
        return [], {
            "ok": False,
            "herramienta": "PySceneDetect",
            "mensaje": f"PySceneDetect no disponible o falló: {error}",
        }


def escena_para_segundo(segundo: float, escenas: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for escena in escenas:
        inicio = float(escena.get("inicio") or 0)
        fin = float(escena.get("fin") or inicio)
        if inicio <= segundo <= fin:
            return escena
    return None


def esta_cerca_de_corte(segundo: float, escenas: List[Dict[str, Any]], margen: float = 0.65) -> bool:
    if not escenas:
        return False
    for escena in escenas[1:]:
        inicio = float(escena.get("inicio") or 0)
        if abs(segundo - inicio) <= margen:
            return True
    return False


def cargar_cv2():
    try:
        import cv2  # type: ignore
        return cv2, None
    except Exception as error:
        return None, str(error)


def detectar_rostros(cv2, gris) -> int:
    try:
        ruta_cascade = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        if not os.path.exists(ruta_cascade):
            return 0
        clasificador = cv2.CascadeClassifier(ruta_cascade)
        rostros = clasificador.detectMultiScale(gris, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        return int(len(rostros))
    except Exception:
        return 0


def analizar_frame(cv2, frame: Dict[str, Any], indice: int, total: int, escenas: List[Dict[str, Any]], gris_anterior=None) -> Tuple[Dict[str, Any], Any]:
    ruta = frame.get("rutaArchivo") or frame.get("ruta")
    segundo = redondear(frame.get("segundo"), 3, 0) or 0
    narrativa = posicion_narrativa(indice, total)

    if not ruta or not os.path.exists(ruta):
        return {
            "id": frame.get("id") or f"frame-{indice + 1:02d}",
            "ok": False,
            "fuente": "opencv-local",
            "descripcion": f"Fotograma no disponible en {segundo}s.",
            "escena": narrativa,
            "accion": "sin imagen disponible para analizar",
            "objetos": [],
            "personas": "no evaluado",
            "textoVisible": "no evaluado localmente",
            "valorEditorial": "No se puede usar como referencia visual.",
            "recomendacion": "Revisar extracción de fotogramas.",
            "metricas": {},
        }, gris_anterior

    imagen = cv2.imread(ruta)
    if imagen is None:
        return {
            "id": frame.get("id") or f"frame-{indice + 1:02d}",
            "ok": False,
            "fuente": "opencv-local",
            "descripcion": f"No se pudo leer el fotograma de {segundo}s.",
            "escena": narrativa,
            "accion": "imagen ilegible",
            "objetos": [],
            "personas": "no evaluado",
            "textoVisible": "no evaluado localmente",
            "valorEditorial": "No se puede usar como referencia visual.",
            "recomendacion": "Revisar archivo de imagen generado.",
            "metricas": {},
        }, gris_anterior

    alto, ancho = imagen.shape[:2]
    gris = cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY)
    brillo = float(gris.mean())
    contraste = float(gris.std())
    nitidez = float(cv2.Laplacian(gris, cv2.CV_64F).var())

    cambio_visual = 0.0
    if gris_anterior is not None:
        previo = gris_anterior
        if previo.shape != gris.shape:
            previo = cv2.resize(previo, (gris.shape[1], gris.shape[0]))
        cambio_visual = float(cv2.absdiff(gris, previo).mean())

    brillo_nivel = nivel_texto(brillo, 75, 175, ("bajo", "medio", "alto"))
    contraste_nivel = nivel_texto(contraste, 28, 65, ("bajo", "medio", "alto"))
    nitidez_nivel = nivel_texto(nitidez, 60, 220, ("baja", "media", "alta"))
    cambio_nivel = nivel_texto(cambio_visual, 7, 22, ("bajo", "medio", "alto"))
    rostros = detectar_rostros(cv2, gris)
    escena_detectada = escena_para_segundo(segundo, escenas)
    posible_corte = esta_cerca_de_corte(segundo, escenas) or cambio_visual >= 22

    if rostros > 0:
        personas = f"se detecta rostro probable ({rostros})"
        base = "persona frente a cámara"
    else:
        personas = "sin rostro frontal detectado por OpenCV"
        base = "encuadre sin rostro frontal claro"

    if cambio_nivel == "alto":
        accion = "cambio visual fuerte respecto al fotograma anterior"
    elif cambio_nivel == "medio":
        accion = "variación visual moderada respecto al fotograma anterior"
    elif rostros > 0:
        accion = "toma estable de persona hablando o gesticulando"
    else:
        accion = "toma visual estable"

    descripcion = (
        f"{base}; brillo {brillo_nivel}, contraste {contraste_nivel}, nitidez {nitidez_nivel}. "
        f"Cambio visual {cambio_nivel} respecto al frame anterior."
    )

    valor = "Sirve para revisar continuidad visual, ritmo y cambios de encuadre."
    if narrativa.startswith("inicio"):
        valor = "Sirve para evaluar el gancho inicial y la claridad del primer encuadre."
    elif narrativa == "cierre":
        valor = "Sirve para evaluar cierre, remate visual o último gesto relevante."
    if posible_corte:
        valor += " Hay indicios de cambio visual/corte cercano."

    recomendacion = "Mantener como referencia de continuidad."
    if brillo_nivel == "bajo":
        recomendacion = "Revisar iluminación o aplicar corrección leve de exposición."
    elif nitidez_nivel == "baja":
        recomendacion = "Revisar enfoque/movimiento antes de usar como frame destacado."
    elif posible_corte:
        recomendacion = "Marcar como punto candidato para corte o transición."

    salida = {
        "id": frame.get("id") or f"frame-{indice + 1:02d}",
        "ok": True,
        "fuente": "opencv-local" + ("+pyscenedetect" if escenas else ""),
        "descripcion": descripcion,
        "escena": narrativa,
        "escenaDetectada": escena_detectada.get("id") if escena_detectada else None,
        "posibleCorte": bool(posible_corte),
        "objetos": [],
        "personas": personas,
        "textoVisible": "no evaluado localmente",
        "accion": accion,
        "valorEditorial": valor,
        "recomendacion": recomendacion,
        "metricas": {
            "ancho": int(ancho),
            "alto": int(alto),
            "brillo": redondear(brillo, 2, 0),
            "contraste": redondear(contraste, 2, 0),
            "nitidez": redondear(nitidez, 2, 0),
            "cambioVisual": redondear(cambio_visual, 2, 0),
            "nivelBrillo": brillo_nivel,
            "nivelContraste": contraste_nivel,
            "nivelNitidez": nitidez_nivel,
            "nivelCambioVisual": cambio_nivel,
            "rostrosProbables": rostros,
        },
    }
    return salida, gris


def analizar(video: str, frames: List[Dict[str, Any]]) -> Dict[str, Any]:
    escenas, estado_escenas = detectar_escenas(video)
    cv2, error_cv2 = cargar_cv2()
    if cv2 is None:
        return {
            "ok": False,
            "fuente": "vision-local",
            "mensaje": f"OpenCV no está instalado o no se pudo cargar: {error_cv2}",
            "dependencias": {
                "opencv": False,
                "pyscenedetect": bool(estado_escenas.get("ok")),
            },
            "escenas": escenas,
            "estadoEscenas": estado_escenas,
            "descripciones": [],
            "recomendacion": "Instalar opencv-python y scenedetect en el entorno Python activo.",
        }

    descripciones = []
    gris_anterior = None
    total = len(frames)
    for indice, frame in enumerate(frames):
        descripcion, gris_anterior = analizar_frame(cv2, frame, indice, total, escenas, gris_anterior)
        descripciones.append(descripcion)

    cambios_fuertes = [item for item in descripciones if item.get("posibleCorte")]
    rostros = sum(int(item.get("metricas", {}).get("rostrosProbables") or 0) for item in descripciones)
    return {
        "ok": True,
        "fuente": "opencv-local" + ("+pyscenedetect" if escenas else ""),
        "mensaje": f"{len(descripciones)} fotograma(s) analizados localmente.",
        "dependencias": {
            "opencv": True,
            "pyscenedetect": bool(estado_escenas.get("ok")),
        },
        "escenas": escenas,
        "estadoEscenas": estado_escenas,
        "descripciones": descripciones,
        "resumen": {
            "fotogramasAnalizados": len(descripciones),
            "escenasDetectadas": len(escenas),
            "cambiosFuertes": len(cambios_fuertes),
            "rostrosProbablesTotales": rostros,
            "hayCambiosEnGrabacion": bool(cambios_fuertes or len(escenas) > 1),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True)
    parser.add_argument("--frames-json", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    try:
        entrada = cargar_json(args.frames_json)
        frames = entrada.get("fotogramas") if isinstance(entrada, dict) else entrada
        if not isinstance(frames, list):
            frames = []
        resultado = analizar(args.video, frames)
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 0 if resultado.get("ok") else 2
    except Exception as error:
        resultado = {
            "ok": False,
            "fuente": "vision-local-error",
            "mensaje": str(error),
            "descripciones": [],
        }
        escribir_json(args.output, resultado)
        print(json.dumps(resultado, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    sys.exit(main())
