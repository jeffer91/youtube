@echo off
setlocal
title AutoVideoJeff - Actualizar y abrir
cd /d "%~dp0"
echo ========================================
echo AutoVideoJeff - Actualizar y abrir
echo ========================================

where git >nul 2>nul
if errorlevel 1 (
  echo Git no esta instalado o no esta en PATH. Se omitira git pull.
) else (
  echo Actualizando desde GitHub...
  git pull
)

echo Instalando o actualizando dependencias...
npm install
if errorlevel 1 goto error

echo Verificando app completa...
npm run check:funcional
if errorlevel 1 goto error

echo Abriendo AutoVideoJeff...
npm start
goto fin

:error
echo.
echo La actualizacion no pudo completarse correctamente.
pause
exit /b 1

:fin
endlocal
