@echo off
setlocal
title AutoVideoJeff - Crear instalador Windows
cd /d "%~dp0"
echo ========================================
echo AutoVideoJeff - Crear instalador Windows
echo ========================================

echo Instalando dependencias...
npm install
if errorlevel 1 goto error

echo Verificando entrega final...
npm run check:bloque4
if errorlevel 1 goto error

echo Creando instalador de Windows...
npm run dist:win
if errorlevel 1 goto error

echo.
echo Instalador creado. Revisa la carpeta release.
pause
goto fin

:error
echo.
echo No se pudo crear el instalador.
pause
exit /b 1

:fin
endlocal
