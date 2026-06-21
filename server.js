/*
  Nombre completo: server.js
  Ruta o ubicación: AutoVideoJeff/server.js
  Función o funciones:
    - Levantar el servidor local de la app.
    - Mostrar la interfaz ubicada en app/.
    - Recibir el video enviado desde la pantalla principal.
    - Crear automáticamente las carpetas de trabajo dentro de datos/.
    - Enviar el video al motor principal para iniciar el flujo de edición.
  Con qué se conecta:
    - app/index.html
    - app/app.js
    - motor/motor.conexion.js
    - datos/videos-originales/
    - datos/proyectos/
    - datos/temporales/
    - datos/videos-exportados/
*/

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { procesarVideoDesdeMotor } from './motor/motor.conexion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUERTO = process.env.PORT || 3000;
const app = express();

const rutasBase = {
  app: path.join(__dirname, 'app'),
  videosOriginales: path.join(__dirname, 'datos', 'videos-originales'),
  proyectos: path.join(__dirname, 'datos', 'proyectos'),
  temporales: path.join(__dirname, 'datos', 'temporales'),
  videosExportados: path.join(__dirname, 'datos', 'videos-exportados')
};

function asegurarCarpetasBase() {
  Object.values(rutasBase).forEach((ruta) => {
    fs.mkdirSync(ruta, { recursive: true });
  });
}

asegurarCarpetasBase();

const almacenamientoTemporal = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const carpetaSubidas = path.join(rutasBase.temporales, 'subidas');
    fs.mkdirSync(carpetaSubidas, { recursive: true });
    cb(null, carpetaSubidas);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '.mp4') || '.mp4';
    const nombreLimpio = path
      .basename(file.originalname || 'video', extension)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();

    cb(null, `${Date.now()}-${nombreLimpio}${extension}`);
  }
});

const subirVideo = multer({
  storage: almacenamientoTemporal,
  limits: {
    fileSize: 1024 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      cb(new Error('Solo se permiten archivos de video.'));
      return;
    }

    cb(null, true);
  }
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(rutasBase.app));
app.use('/exports', express.static(rutasBase.videosExportados));

app.get('/api/estado', (_req, res) => {
  res.json({
    ok: true,
    app: 'AutoVideoJeff',
    version: '0.1.0',
    mensaje: 'Servidor activo. Listo para recibir videos.'
  });
});

app.post('/api/procesar-video', subirVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        ok: false,
        mensaje: 'No se recibió ningún video.'
      });
      return;
    }

    const resultado = await procesarVideoDesdeMotor({
      archivoTemporal: req.file.path,
      nombreOriginal: req.file.originalname,
      nombreTemporal: req.file.filename,
      opciones: {
        plataforma: 'tiktok',
        modo: 'simple'
      }
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'No se pudo procesar el video.',
      detalle: error.message
    });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(rutasBase.app, 'index.html'));
});

app.listen(PUERTO, () => {
  console.log(`AutoVideoJeff activo en http://localhost:${PUERTO}`);
});
