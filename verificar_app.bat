@echo off
setlocal
title AutoVideoJeff - Verificar app
cd /d "%~dp0"
echo ========================================
echo AutoVideoJeff - Verificar app
echo ========================================

npm install
if errorlevel 1 goto error

npm run check:bloque1
if errorlevel 1 goto error

npm run check:bloque2
if errorlevel 1 goto error

npm run check:bloque3
if errorlevel 1 goto error

npm run check:bloque4
if errorlevel 1 goto error

echo.
echo Todo esta correcto.
pause
goto fin

:error
echo.
echo La verificacion encontro un problema.
pause
exit /b 1

:fin
endlocal
