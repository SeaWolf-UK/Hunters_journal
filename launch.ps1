# Hunters Journal Launcher for Windows
# Double-click this file to start, or run in PowerShell: .\launch.ps1

Write-Host "Starting Hunters Journal..." -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectRoot

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org"
    Read-Host "Press Enter to exit"
    exit 1
}

# Kill any existing processes on ports 3001 and 5173
$ports = @(3001, 5173)
foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Killing existing process on port $port : $($proc.ProcessName) (PID $($proc.Id))" -ForegroundColor Yellow
                Stop-Process -Id $proc.Id -Force
            }
        }
    } catch { }
}

# Start dev servers
Write-Host "Starting backend + frontend..." -ForegroundColor Green
$devJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location $root
    npm run dev 2>&1
} -ArgumentList $ProjectRoot

# Wait for servers to be ready
Write-Host "Waiting for servers..." -ForegroundColor Gray
$backendReady = $false
$frontendReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep 1
    if (-not $backendReady) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) { $backendReady = $true }
        } catch { }
    }
    if (-not $frontendReady) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) { $frontendReady = $true }
        } catch { }
    }
    if ($backendReady -and $frontendReady) { break }
}

if ($backendReady -and $frontendReady) {
    Write-Host "Servers running! Opening browser..." -ForegroundColor Green
    Start-Process "http://localhost:5173"
} else {
    Write-Host "WARNING: Servers may not be fully ready yet." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Hunters Journal is running. Press Ctrl+C to stop." -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        Start-Sleep 1
        $output = Receive-Job -Job $devJob
        if ($output) { Write-Output $output }
    }
} finally {
    Write-Host ""
    Write-Host "Shutting down Hunters Journal..." -ForegroundColor Yellow
    Stop-Job -Job $devJob -ErrorAction SilentlyContinue
    Remove-Job -Job $devJob -ErrorAction SilentlyContinue

    # Kill any remaining node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*concurrently*" -or
        $_.CommandLine -like "*tsx*" -or
        $_.CommandLine -like "*vite*"
    } | ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Done." -ForegroundColor Green
}
