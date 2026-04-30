@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo ========================================
echo    Hunters Journal - Setup + Launch
echo ========================================
echo.

:: 1. Check Node.js
node --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [MISSING] Node.js is not installed.
    echo.
    echo Hunters Journal needs Node.js to run.
    echo Opening the download page for you...
    start https://nodejs.org/en/download
    echo.
    echo Please install Node.js, then run this file again.
    pause
    exit /b 1
)
echo [OK] Node.js found.

:: 2. Install dependencies if needed
if not exist "node_modules\" (
    echo [INSTALL] Downloading app dependencies... This may take a minute.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed.
) else (
    echo [OK] Dependencies already installed.
)

:: 3. Check .env file
if not exist ".env" (
    echo [SETUP] Creating settings file from template...
    copy .env.example .env >nul
    echo [OK] Settings file created.
    echo.
    echo NOTE: Voice output (TTS) requires an ElevenLabs API key.
    echo        You can add one later in the .env file if you want the skull to speak aloud.
    echo.
) else (
    echo [OK] Settings file found.
)

:: 4. Check Ollama
ollama --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [MISSING] Ollama is not installed.
    echo.
    echo The skull uses Ollama for AI-powered creature identification.
    echo Opening the download page for you...
    start https://ollama.com/download
    echo.
    echo Please install Ollama, then run this file again.
    pause
    exit /b 1
)
echo [OK] Ollama found.

:: Try to start Ollama if it's not running
curl -s http://localhost:11434 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [START] Starting Ollama in the background...
    start /min "" ollama serve
    echo [WAIT] Waiting for Ollama to be ready...
    :wait_ollama
    timeout /t 1 /nobreak >nul
    curl -s http://localhost:11434 >nul 2>nul
    if %ERRORLEVEL% NEQ 0 goto wait_ollama
    echo [OK] Ollama is running.
) else (
    echo [OK] Ollama already running.
)

:: 5. Check for required model
curl -s http://localhost:11434/api/tags 2>nul | findstr /i "deepseek-v4-pro" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [SETUP] Downloading AI model (deepseek-v4-pro:cloud)... This may take several minutes.
    ollama pull deepseek-v4-pro:cloud
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to download the AI model. Check your internet connection.
        pause
        exit /b 1
    )
    echo [OK] AI model ready.
) else (
    echo [OK] AI model already downloaded.
)

:: 6. Kill any stale servers on ports 3001 / 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo [CLEANUP] Killing old server on port 3001 (PID %%a)
    taskkill /f /pid %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo [CLEANUP] Killing old server on port 5173 (PID %%a)
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo ========================================
echo    Starting Hunters Journal...
echo    Backend: http://localhost:3001
echo    Frontend: http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C to stop.
echo.

npm run dev
