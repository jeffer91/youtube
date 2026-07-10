@echo off
setlocal
cd /d "%~dp0\.."
node tools\verificar-formato-cuadrado.mjs
if errorlevel 1 (
  echo.
  echo La verificacion encontro errores.
  pause
  exit /b 1
)
echo.
echo Formato cuadrado conectado correctamente.
pause
