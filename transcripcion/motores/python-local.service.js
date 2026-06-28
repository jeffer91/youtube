import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { obtenerRutaRaiz } from '../../comun/archivos.js';

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}

function normalizar(valor = '') {
  return String(valor || '').trim();
}

function unico(lista = []) {
  const vistos = new Set();
  return lista
    .map((item) => normalizar(item))
    .filter(Boolean)
    .filter((item) => {
      const clave = item.toLowerCase();
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
}

function rutasPythonVenv(nombreCarpeta) {
  const raiz = obtenerRutaRaiz();
  return process.platform === 'win32'
    ? [path.join(raiz, nombreCarpeta, 'Scripts', 'python.exe')]
    : [path.join(raiz, nombreCarpeta, 'bin', 'python')];
}

export function obtenerCandidatosPythonLocal(opciones = {}, clavesOpciones = []) {
  const desdeOpciones = clavesOpciones.map((clave) => opciones[clave]);
  const candidatos = [
    ...desdeOpciones,
    opciones.pythonPath,
    process.env.AUTOVIDEOJEFF_PYTHON,
    process.env.PYTHON,
    ...rutasPythonVenv('.venv-transcripcion'),
    ...rutasPythonVenv('venv-transcripcion'),
    ...rutasPythonVenv('.venv'),
    ...rutasPythonVenv('venv'),
    process.platform === 'win32' ? 'python' : 'python3',
    'python'
  ];
  return unico(candidatos);
}

export function obtenerPythonPreferido(opciones = {}, clavesOpciones = []) {
  const candidatos = obtenerCandidatosPythonLocal(opciones, clavesOpciones);
  return candidatos.find((candidato) => candidato.includes(path.sep) ? existeArchivo(candidato) : true) || (process.platform === 'win32' ? 'python' : 'python3');
}

function ejecutarPython({ python, args, timeoutMs = 15000 }) {
  return new Promise((resolve) => {
    const child = spawn(python, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let terminado = false;
    const timeout = setTimeout(() => {
      if (terminado) return;
      terminado = true;
      child.kill('SIGKILL');
      resolve({ ok: false, python, stdout, stderr, error: `Timeout ejecutando ${python}.` });
    }, timeoutMs);

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    child.on('error', (error) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timeout);
      resolve({ ok: false, python, stdout, stderr, error: error.message });
    });
    child.on('close', (code) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timeout);
      resolve({ ok: code === 0, code, python, stdout, stderr, error: code === 0 ? null : stderr || stdout || `Python finalizó con código ${code}` });
    });
  });
}

export async function resolverPythonParaModulo({ modulo, opciones = {}, clavesOpciones = [], timeoutMs = 15000 } = {}) {
  const candidatos = obtenerCandidatosPythonLocal(opciones, clavesOpciones);
  const intentos = [];

  for (const python of candidatos) {
    if (python.includes(path.sep) && !existeArchivo(python)) {
      intentos.push({ ok: false, python, error: 'No existe el ejecutable.' });
      continue;
    }

    const resultado = await ejecutarPython({
      python,
      args: ['-c', `import ${modulo}; print("ok")`],
      timeoutMs
    });
    intentos.push(resultado);
    if (resultado.ok && String(resultado.stdout || '').includes('ok')) {
      return {
        ok: true,
        python,
        modulo,
        mensaje: `${modulo} disponible en ${python}.`,
        intentos
      };
    }
  }

  return {
    ok: false,
    python: candidatos[0] || null,
    modulo,
    mensaje: `No se encontró un Python con el módulo ${modulo}.`,
    intentos
  };
}

export default resolverPythonParaModulo;
