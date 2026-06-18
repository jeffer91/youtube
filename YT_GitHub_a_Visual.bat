@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion

REM =========================================================
REM NOMBRE COMPLETO:
REM YT_GitHub_a_Visual.bat
REM
REM RUTA O UBICACIÓN:
REM youtube/YT_GitHub_a_Visual.bat
REM
REM FUNCIÓN O FUNCIONES:
REM 1. Descargar la versión actual de GitHub hacia la carpeta local.
REM 2. Reemplazar la carpeta local del proyecto con la versión de GitHub.
REM 3. Borrar archivos locales que ya no existan en GitHub.
REM 4. Mantener este BAT y el BAT de subida aunque todavía no estén en GitHub.
REM 5. Instalar dependencias con npm install si existe package.json.
REM 6. Abrir la carpeta en Visual Studio Code si el comando code está disponible.
REM
REM CON QUÉ SE CONECTA:
REM - GitHub: https://github.com/jeffer91/youtube.git
REM - Rama principal: main
REM - Visual Studio Code: comando code.
REM - Node/npm: npm install.
REM
REM IMPORTANTE:
REM - Este archivo debe estar en la raíz del proyecto youtube.
REM - No debe estar dentro de 00_base_electron.
REM - No debe estar dentro de 01_interfaz_minima.
REM - No debe estar dentro de node_modules.
REM - No debe estar dentro de youtube-limpio.
REM =========================================================

set "REPO_URL=https://github.com/jeffer91/youtube.git"
set "BRANCH=main"
set "PROJECT_FOLDER_NAME=youtube"

if /I "%~1"=="__YT_RUN_FROM_TEMP__" goto RUN_FROM_TEMP

set "TARGET_DIR=%~dp0"
if "%TARGET_DIR:~-1%"=="\" set "TARGET_DIR=%TARGET_DIR:~0,-1%"

set "TEMP_RUNNER=%TEMP%\YT_GitHub_a_Visual_%RANDOM%%RANDOM%.bat"

copy /Y "%~f0" "%TEMP_RUNNER%" >nul
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo crear el ejecutor temporal.
    echo Ejecuta este archivo con permisos normales de usuario o revisa permisos de Windows.
    echo.
    pause
    exit /b 1
)

call "%TEMP_RUNNER%" __YT_RUN_FROM_TEMP__ "%TARGET_DIR%"
set "FINAL_CODE=%ERRORLEVEL%"

del "%TEMP_RUNNER%" >nul 2>&1

exit /b %FINAL_CODE%

:RUN_FROM_TEMP
set "TARGET_DIR=%~2"

if "%TARGET_DIR%"=="" (
    echo.
    echo ERROR: No se recibió la ruta local del proyecto.
    echo.
    pause
    exit /b 1
)

for %%I in ("%TARGET_DIR%") do (
    set "TARGET_FULL=%%~fI"
    set "TARGET_NAME=%%~nxI"
)

echo.
echo =========================================================
echo GITHUB A VISUAL
echo =========================================================
echo Este proceso baja GitHub a tu carpeta local.
echo.
echo Repositorio : %REPO_URL%
echo Rama        : %BRANCH%
echo Carpeta PC  : %TARGET_FULL%
echo =========================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git no está instalado o no está agregado al PATH.
    echo Instala Git y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

if /I "%TARGET_FULL%"=="%USERPROFILE%\Desktop" (
    echo ERROR: Protección activada.
    echo No se permite reemplazar directamente todo el Escritorio.
    echo Este BAT debe estar dentro de la carpeta youtube.
    echo.
    pause
    exit /b 1
)

if /I "%TARGET_NAME%"=="node_modules" (
    echo ERROR: Este BAT no debe ejecutarse dentro de node_modules.
    echo Muévelo a la raíz del proyecto youtube.
    echo.
    pause
    exit /b 1
)

if /I "%TARGET_NAME%"=="youtube-limpio" (
    echo ERROR: Este BAT no debe ejecutarse dentro de youtube-limpio.
    echo Muévelo a la raíz real del proyecto youtube.
    echo.
    pause
    exit /b 1
)

if /I not "%TARGET_NAME%"=="%PROJECT_FOLDER_NAME%" (
    echo ADVERTENCIA: La carpeta actual no se llama "%PROJECT_FOLDER_NAME%".
    echo Carpeta detectada: "%TARGET_NAME%"
    echo.
    set /p SAFE_NAME_CONFIRM=Para continuar escribe YOUTUBE: 
    if /I not "!SAFE_NAME_CONFIRM!"=="YOUTUBE" (
        echo.
        echo Operación cancelada.
        echo.
        pause
        exit /b 1
    )
)

echo ESTE PROCESO REEMPLAZARÁ TU CARPETA LOCAL CON LA VERSIÓN DE GITHUB.
echo.
echo Se eliminarán archivos locales que no estén en GitHub.
echo Se eliminarán carpetas temporales como node_modules y youtube-limpio si existen.
echo.
set /p CONFIRM=Para continuar escribe GITHUB: 

if /I not "%CONFIRM%"=="GITHUB" (
    echo.
    echo Operación cancelada.
    echo.
    pause
    exit /b 0
)

set "CLONE_DIR=%TEMP%\YT_GitHubClone_%RANDOM%%RANDOM%"
set "BAT_BACKUP_DIR=%TEMP%\YT_BatBackup_%RANDOM%%RANDOM%"

if exist "%CLONE_DIR%" rmdir /S /Q "%CLONE_DIR%" >nul 2>&1
if exist "%BAT_BACKUP_DIR%" rmdir /S /Q "%BAT_BACKUP_DIR%" >nul 2>&1

mkdir "%BAT_BACKUP_DIR%" >nul 2>&1

if exist "%TARGET_FULL%\YT_GitHub_a_Visual.bat" (
    copy /Y "%TARGET_FULL%\YT_GitHub_a_Visual.bat" "%BAT_BACKUP_DIR%\YT_GitHub_a_Visual.bat" >nul
)

if exist "%TARGET_FULL%\YT_Visual_a_GitHub.bat" (
    copy /Y "%TARGET_FULL%\YT_Visual_a_GitHub.bat" "%BAT_BACKUP_DIR%\YT_Visual_a_GitHub.bat" >nul
)

echo.
echo Clonando GitHub en carpeta temporal...
git clone --branch "%BRANCH%" --single-branch "%REPO_URL%" "%CLONE_DIR%"
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo clonar el repositorio.
    echo Revisa internet, permisos de GitHub o la URL del repositorio.
    echo.
    rmdir /S /Q "%CLONE_DIR%" >nul 2>&1
    rmdir /S /Q "%BAT_BACKUP_DIR%" >nul 2>&1
    pause
    exit /b 1
)

if not exist "%CLONE_DIR%\package.json" (
    echo.
    echo ERROR: El repositorio descargado no parece ser el proyecto correcto.
    echo No se encontró package.json.
    echo.
    rmdir /S /Q "%CLONE_DIR%" >nul 2>&1
    rmdir /S /Q "%BAT_BACKUP_DIR%" >nul 2>&1
    pause
    exit /b 1
)

echo.
echo Reemplazando carpeta local con la versión de GitHub...
robocopy "%CLONE_DIR%" "%TARGET_FULL%" /MIR /R:2 /W:2

set "ROBO_CODE=%ERRORLEVEL%"

if %ROBO_CODE% GEQ 8 (
    echo.
    echo ERROR: Robocopy encontró un problema grave.
    echo Código: %ROBO_CODE%
    echo.
    echo Cierra Visual Studio Code, terminales, Electron o cualquier archivo abierto.
    echo Luego vuelve a ejecutar este BAT.
    echo.
    rmdir /S /Q "%CLONE_DIR%" >nul 2>&1
    rmdir /S /Q "%BAT_BACKUP_DIR%" >nul 2>&1
    pause
    exit /b 1
)

if exist "%BAT_BACKUP_DIR%\YT_GitHub_a_Visual.bat" (
    copy /Y "%BAT_BACKUP_DIR%\YT_GitHub_a_Visual.bat" "%TARGET_FULL%\YT_GitHub_a_Visual.bat" >nul
)

if exist "%BAT_BACKUP_DIR%\YT_Visual_a_GitHub.bat" (
    copy /Y "%BAT_BACKUP_DIR%\YT_Visual_a_GitHub.bat" "%TARGET_FULL%\YT_Visual_a_GitHub.bat" >nul
)

rmdir /S /Q "%CLONE_DIR%" >nul 2>&1
rmdir /S /Q "%BAT_BACKUP_DIR%" >nul 2>&1

cd /D "%TARGET_FULL%"
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo entrar a la carpeta final del proyecto.
    echo.
    pause
    exit /b 1
)

echo.
echo GitHub fue bajado correctamente a Visual.
echo.

if exist "package.json" (
    where npm >nul 2>&1
    if errorlevel 1 (
        echo ADVERTENCIA: npm no está disponible.
        echo No se instalaron dependencias.
    ) else (
        echo Instalando dependencias...
        npm install
        if errorlevel 1 (
            echo.
            echo ADVERTENCIA: npm install terminó con errores.
            echo Revisa la consola antes de ejecutar la app.
            echo.
        ) else (
            echo Dependencias instaladas correctamente.
        )
    )
)

where code >nul 2>&1
if not errorlevel 1 (
    echo.
    echo Abriendo proyecto en Visual Studio Code...
    code "%TARGET_FULL%"
) else (
    echo.
    echo Visual Studio Code no se abrió porque el comando code no está disponible.
    echo Abre manualmente esta carpeta:
    echo %TARGET_FULL%
)

echo.
echo =========================================================
echo PROCESO FINALIZADO
echo =========================================================
echo GitHub quedó copiado en tu carpeta local de Visual Studio Code.
echo.
pause
exit /b 0