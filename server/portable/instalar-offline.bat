@echo off
title AgendaTribu Sync Server - Instalador portable
cd /d "%~dp0"
echo ============================================================
echo   AgendaTribu Sync - Instalador liviano
echo   (Node y Tailscale se descargan solo si no estan instalados)
echo ============================================================
echo.
echo [1/4] Node.js...
set NODE=node
where node >nul 2>nul
if errorlevel 1 (
  set NODE=%~dp0node.exe
  if not exist node.exe (
    echo      descargando node.exe de nodejs.org...
    curl -fsSL -o node.exe "https://nodejs.org/dist/v24.18.1/win-x64/node.exe" || ( echo [X] sin Node y sin internet para bajarlo & pause & exit /b 1 )
  )
)
%NODE% --version
echo [2/4] Dependencias ya incluidas en node_modules - OK
echo [3/4] Tailscale...
where tailscale >nul 2>nul
if errorlevel 1 (
  echo      descargando Tailscale...
  curl -fsSL -o tailscale-setup.exe "https://pkgs.tailscale.com/stable/tailscale-setup-latest-amd64.msi" && msiexec /i tailscale-setup.exe /quiet /norestart && timeout /t 10 >nul
)
tailscale status | findstr /C:"Logged out" >nul && tailscale login
tailscale funnel --bg 8780
echo [4/4] Autoarranque + arranque...
(echo @echo off& echo cd /d "%cd%"& echo %NODE% server.js& echo pause) > servidor.bat
schtasks /create /tn "AgendaTribuSync" /sc onlogon /f /tr "\"%cd%\servidor.bat\"" >nul 2>nul
start "AgendaTribuSync" /min cmd /c "%NODE% server.js > server.log 2>&1"
timeout /t 3 >nul
curl -s localhost:8780/ping >nul 2>nul && echo [OK] SERVIDOR ACTIVO || echo [X] No arranco - ver server.log
tailscale serve status 2>nul | findstr "ts.net"
pause
