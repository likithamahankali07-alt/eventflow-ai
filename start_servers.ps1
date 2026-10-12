# EventFlow AI - Unified Local Server Launcher
# This script launches both the FastAPI Python Backend and Vite React Frontend

$host.UI.RawUI.WindowTitle = "EventFlow AI Server Launcher"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             EVENTFLOW AI - DEVELOPMENT SERVERS           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Ensure Node.js is on PATH
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $env:PATH = "C:\Program Files\nodejs;" + $env:PATH
}

$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath (Join-Path $backendDir "venv\Scripts\python.exe") `
    -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000 --reload" `
    -WorkingDirectory $backendDir `
    -PassThru

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "C:\Program Files\nodejs\node.exe" `
    -ArgumentList "./node_modules/vite/bin/vite.js --host" `
    -WorkingDirectory $frontendDir `
    -PassThru

Write-Host "`nEventFlow AI services are now running!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nPress Ctrl+C or close this terminal to stop both servers." -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 2
        if ($backendProcess.HasExited -or $frontendProcess.HasExited) {
            break
        }
    }
} finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    if (-not $backendProcess.HasExited) { Stop-Process -Id $backendProcess.Id -Force }
    if (-not $frontendProcess.HasExited) { Stop-Process -Id $frontendProcess.Id -Force }
    Write-Host "Done." -ForegroundColor Green
}
