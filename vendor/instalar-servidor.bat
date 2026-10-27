@echo off
title AgendaTribu Sync - Instalador automatico
cd /d %TEMP%
set DIR=C:\AgendaTribu
set BASE=https://latribu.tailb81e5f.ts.net
echo ============================================================
echo   AgendaTribu Sync - Instalacion AUTOMATICA (un clic)
echo ============================================================
echo.
echo [1/6] Creando carpeta %DIR%...
mkdir "%DIR%" 2>nul & cd /d "%DIR%"
echo [2/6] Descargando paquete del servidor...
curl -fsSL -o pkg.zip "%BASE%/instalador-offline.zip" || ( echo [X] no se pudo descargar - revisa internet/funnel & pause & exit /b 1 )
powershell -NoProfile -Command "Expand-Archive -Force pkg.zip '%DIR%'"
echo [3/6] Node.js...
set NODE=node
where node >nul 2>nul
if errorlevel 1 (
  set NODE=%DIR%\node.exe
  if not exist node.exe curl -fsSL -o node.exe "https://nodejs.org/dist/v24.18.1/win-x64/node.exe" || ( echo [X] sin Node & pause & exit /b 1 )
)
%NODE% --version
echo [4/6] Tailscale...
where tailscale >nul 2>nul
if errorlevel 1 (
  curl -fsSL -o ts.msi "https://pkgs.tailscale.com/stable/tailscale-setup-latest-amd64.msi" && msiexec /i ts.msi /quiet /norestart && timeout /t 10 >nul
)
tailscale status | findstr /C:"Logged out" >nul && tailscale login
tailscale funnel --bg 8780
echo [5/6] Autoarranque...
(echo @echo off& echo cd /d "%DIR%"& echo %NODE% server.js& echo pause) > "%DIR%\correr-servidor.bat"
echo start /min "" "%DIR%\correr-servidor.bat" > "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\agendatribu.bat"
echo [6/6] Levantando servidor...
start "AgendaTribuSync" /min cmd /c "%NODE% server.js > server.log 2>&1"
timeout /t 4 >nul
curl -s http://localhost:8780/ping >nul 2>nul && echo [OK] SERVIDOR ACTIVO || echo [X] no arranco - ver server.log
tailscale serve status 2>nul | findstr "ts.net"
echo.
echo LISTO - el servidor queda corriendo y autoarranca con Windows.
pause
