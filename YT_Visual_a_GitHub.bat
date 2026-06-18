@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion

REM =========================================================
REM NOMBRE COMPLETO:
REM YT_Visual_a_GitHub.bat
REM
REM RUTA O UBICACIÓN:
REM youtube/YT_Visual_a_GitHub.bat
REM
REM FUNCIÓN O FUNCIONES:
REM 1. Tomar la versión local del proyecto abierta en Visual Studio Code.
REM 2. Preparar un commit limpio con los archivos actuales.
REM 3. Reemplazar la rama main de GitHub con la versión local.
REM 4. Subir la carpeta local como verdad principal del proyecto.
REM 5. Evitar subir node_modules, .env, youtube-limpio y carpetas temporales.
REM
REM CON QUÉ SE CONECTA:
REM - GitHub: https://github.com/jeffer91/youtube.git
REM - Rama principal: main
REM - Git local instalado en Windows.
REM - Credenciales de GitHub configuradas en Git Credential Manager.
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
set "PROJECT_DIR=%~dp0"

if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

for %%I in ("%PROJECT_DIR%") do (
    set "PROJECT_FULL=%%~fI"
    set "PROJECT_NAME=%%~nxI"
)

echo.
echo =========================================================
echo VISUAL A GITHUB
echo =========================================================
echo Este proceso sube tu carpeta local a GitHub.
echo.
echo Repositorio : %REPO_URL%
echo Rama        : %BRANCH%
echo Carpeta PC  : %PROJECT_FULL%
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

cd /D "%PROJECT_FULL%"
if errorlevel 1 (
    echo ERROR: No se pudo entrar a la carpeta del proyecto.
    echo.
    pause
    exit /b 1
)

if /I "%PROJECT_NAME%"=="node_modules" (
    echo ERROR: Este BAT no debe ejecutarse dentro de node_modules.
    echo Muévelo a la raíz del proyecto youtube.
    echo.
    pause
    exit /b 1
)

if /I "%PROJECT_NAME%"=="youtube-limpio" (
    echo ERROR: Este BAT no debe ejecutarse dentro de youtube-limpio.
    echo Muévelo a la raíz real del proyecto youtube.
    echo.
    pause
    exit /b 1
)

if /I not "%PROJECT_NAME%"=="%PROJECT_FOLDER_NAME%" (
    echo ADVERTENCIA: La carpeta actual no se llama "%PROJECT_FOLDER_NAME%".
    echo Carpeta detectada: "%PROJECT_NAME%"
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

if not exist "package.json" (
    echo ERROR: No se encontró package.json.
    echo Este BAT debe ejecutarse desde la raíz del proyecto youtube.
    echo.
    pause
    exit /b 1
)

if not exist ".gitignore" (
    echo ERROR: No se encontró .gitignore.
    echo Por seguridad no se subirá el proyecto sin .gitignore.
    echo.
    pause
    exit /b 1
)

echo ESTE PROCESO REEMPLAZARÁ GITHUB CON TU CARPETA LOCAL.
echo.
echo Se subirán los archivos válidos del proyecto.
echo No se subirán node_modules, .env, youtube-limpio ni carpetas temporales.
echo.
echo IMPORTANTE:
echo - Puede borrar de GitHub archivos que ya no existan en tu PC.
echo - Usa reemplazo protegido primero.
echo - Si GitHub cambió mientras trabajabas, te pedirá confirmación extra.
echo.
set /p CONFIRM=Para continuar escribe VISUAL: 

if /I not "%CONFIRM%"=="VISUAL" (
    echo.
    echo Operación cancelada.
    echo.
    pause
    exit /b 0
)

echo.
echo Preparando repositorio local...

if not exist ".git" (
    git init
    if errorlevel 1 (
        echo ERROR: No se pudo inicializar Git en esta carpeta.
        echo.
        pause
        exit /b 1
    )
)

if not exist ".git\info" mkdir ".git\info" >nul 2>&1
if not exist ".git\info\exclude" type nul > ".git\info\exclude"

findstr /I /C:"node_modules/" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo node_modules/>>".git\info\exclude"

findstr /I /C:"youtube-limpio/" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo youtube-limpio/>>".git\info\exclude"

findstr /I /C:".env" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo .env>>".git\info\exclude"

findstr /I /C:"user_data/temp/" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo user_data/temp/>>".git\info\exclude"

findstr /I /C:"user_data/cache/" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo user_data/cache/>>".git\info\exclude"

findstr /I /C:"user_data/exports/" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo user_data/exports/>>".git\info\exclude"

findstr /I /C:"user_data/logs/" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo user_data/logs/>>".git\info\exclude"

findstr /I /C:"YT_GitHubClone_/" ".git\info\exclude" >nul 2>&1
if errorlevel 1 echo YT_GitHubClone_/>>".git\info\exclude"

git remote remove origin >nul 2>&1
git remote add origin "%REPO_URL%"
if errorlevel 1 (
    echo ERROR: No se pudo configurar el remote origin.
    echo.
    pause
    exit /b 1
)

git config user.name >nul 2>&1
if errorlevel 1 git config user.name "Jefferson Villarreal"

git config user.email >nul 2>&1
if errorlevel 1 git config user.email "jeffersonvillarreal91@gmail.com"

echo.
echo Consultando GitHub antes de subir...
git fetch origin "%BRANCH%" --prune >nul 2>&1

set "TEMP_BRANCH=yt_visual_upload_%RANDOM%%RANDOM%"

echo.
echo Creando una versión limpia para subir...
git checkout --orphan "%TEMP_BRANCH%" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo crear una rama temporal limpia.
    echo Cierra Visual Studio Code, terminales o procesos que estén usando Git.
    echo Luego vuelve a ejecutar este BAT.
    echo.
    pause
    exit /b 1
)

git rm -r --cached . >nul 2>&1

git add -A
if errorlevel 1 (
    echo.
    echo ERROR: No se pudieron preparar los archivos para commit.
    echo Revisa permisos o archivos bloqueados.
    echo.
    pause
    exit /b 1
)

git diff --cached --quiet
if not errorlevel 1 (
    echo.
    echo ERROR: No hay archivos preparados para subir.
    echo Revisa .gitignore o verifica que la carpeta tenga archivos válidos.
    echo.
    pause
    exit /b 1
)

set "COMMIT_MSG=Subir version local desde Visual a GitHub - %DATE% %TIME%"

echo.
echo Creando commit...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo crear el commit.
    echo Revisa la salida de Git.
    echo.
    pause
    exit /b 1
)

git branch -M "%BRANCH%"
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo renombrar la rama local a %BRANCH%.
    echo.
    pause
    exit /b 1
)

echo.
echo Subiendo a GitHub con reemplazo protegido...
git push --force-with-lease origin "%BRANCH%"

if errorlevel 1 (
    echo.
    echo ADVERTENCIA: La subida protegida falló.
    echo Esto puede pasar si GitHub cambió después de la última consulta o si faltan permisos.
    echo.
    set /p FORCE_CONFIRM=Para intentar subida forzada total escribe FORZAR: 

    if /I not "!FORCE_CONFIRM!"=="FORZAR" (
        echo.
        echo Operación detenida. GitHub no fue reemplazado.
        echo.
        pause
        exit /b 1
    )

    echo.
    echo Ejecutando subida forzada total...
    git push --force origin "%BRANCH%"

    if errorlevel 1 (
        echo.
        echo ERROR: No se pudo subir a GitHub.
        echo Revisa credenciales, permisos o conexión.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo =========================================================
echo PROCESO FINALIZADO
echo =========================================================
echo Tu versión local de Visual Studio Code fue subida a GitHub.
echo.
echo Repositorio:
echo %REPO_URL%
echo.
pause
exit /b 0