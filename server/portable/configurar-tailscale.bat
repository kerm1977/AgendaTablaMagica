@echo off
title AgendaTribu - Configurar Tailscale
cd /d "%~dp0"
echo ============================================================
echo   Configurar Tailscale + Funnel para AgendaTribu Sync
echo   (Correr DESPUES de instalar Tailscale y hacer login
echo    con la cuenta del grupo: kenth1977@gmail.com)
echo   Tailnet: tailb81e5f.ts.net
echo ============================================================
echo.
echo [1/4] Verificando Tailscale...
where tailscale >nul 2>nul
if errorlevel 1 ( echo [X] Tailscale no esta instalado - corre primero tailscale-setup.exe & pause & exit /b 1 )
echo      OK
echo [2/4] Verificando sesion...
tailscale status | findstr /C:"Logged out" >nul && ( echo No hay sesion - abriendo login... & tailscale login )
tailscale status | findstr "Connected"
echo [3/4] Activando Funnel en puerto 8780...
tailscale funnel --bg 8780
echo [4/4] Tu URL FIJA y permanente:
tailscale serve status | findstr "ts.net"
echo.
echo   Esa URL es la que va en la app: Ajustes - Sincronizacion
echo   Global - "Maquina Tailscale" (solo el nombre antes del punto)
echo.
echo   El servidor ya arranco solo? Verificando...
curl -s localhost:8780/ping >nul 2>nul && echo [OK] ya responde || correr-servidor.bat
pause
