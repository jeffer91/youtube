@echo off
setlocal
title AutoVideoJeff - Abrir app
cd /d "%~dp0"
echo ========================================
echo AutoVideoJeff - Abrir app
echo ========================================

if not exist node_modules (
  echo Instalando dependencias por primera vez...
  npm install
  if errorlevel 1 goto error
)

echo Abriendo AutoVideoJeff...
npm start
goto fin

:error
echo.
echo No se pudo abrir la app. Revisa que Node.js este instalado.
pause
exit /b 1

:fin
endlocal
