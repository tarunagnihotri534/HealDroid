@echo off
title HealDroid Backend + Cloudflare Tunnel
echo ========================================================
echo   Starting HealDroid FastAPI Backend on Port 8000
echo ========================================================
start FastAPI Backend cmd /k K:\ana\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir backend

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo ========================================================
echo   Starting Cloudflare Public HTTPS Tunnel for Vercel
echo ========================================================
tools\cloudflared.exe tunnel --protocol http2 --url http://127.0.0.1:8000
pause
