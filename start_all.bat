@echo off
title KNOWLEDGE BRIDGE AI - Launcher
echo ========================================================
echo  KNOWLEDGE BRIDGE AI - Launching Full-Stack Application
echo ========================================================
echo.
echo Starting Backend API server on http://127.0.0.1:8000 ...
start "KNOWLEDGE BRIDGE AI - Backend" cmd /k "call start_backend.bat"

echo Starting Frontend UI on http://localhost:5173 ...
start "KNOWLEDGE BRIDGE AI - Frontend" cmd /k "call start_frontend.bat"

echo.
echo Application launched! Open http://localhost:5173 in your browser.
echo ========================================================

