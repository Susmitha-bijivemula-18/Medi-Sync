# MediSync Safe Development Orchestrator
# Starts backend and frontend development servers with port safety and clear logs.

[CmdletBinding()]
param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$KillExisting
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       MediSync Development Server         " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

function Get-PortProcess([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $conn) {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    }
    if ($conn) {
        $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }
        return $pids
    }
    return $null
}

function Clear-Port([int]$Port, [string]$ServiceName) {
    $pids = Get-PortProcess -Port $Port
    if ($pids) {
        if ($KillExisting) {
            foreach ($p in $pids) {
                Write-Host "Killing existing $ServiceName process (PID: $p on port $Port)..." -ForegroundColor Yellow
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Milliseconds 600
        } else {
            Write-Host "[WARNING] Port $Port is already in use by process PID: $($pids -join ', ')." -ForegroundColor Red
            Write-Host "Use -KillExisting to terminate it automatically, or run .\stop-dev.ps1" -ForegroundColor Yellow
            return $false
        }
    }
    return $true
}

# 1. Environment Checks
if (-not $FrontendOnly) {
    if (-not (Test-Path "$WorkspaceRoot\backend\mvnw.cmd")) {
        Write-Error "Maven wrapper not found in backend directory ($WorkspaceRoot\backend\mvnw.cmd)"
        exit 1
    }
    $javaInstalled = Get-Command "java" -ErrorAction SilentlyContinue
    if (-not $javaInstalled) {
        Write-Error "Java runtime not found on PATH. Please ensure JDK 17+ is installed."
        exit 1
    }
}

if (-not $BackendOnly) {
    $nodeInstalled = Get-Command "node" -ErrorAction SilentlyContinue
    if (-not $nodeInstalled) {
        Write-Error "Node.js not found on PATH. Please ensure Node 18+ is installed."
        exit 1
    }
}

# 2. Port Conflict Checks
if (-not $FrontendOnly) {
    $ok = Clear-Port -Port 8080 -ServiceName "Spring Boot Backend"
    if (-not $ok) { exit 1 }
}

if (-not $BackendOnly) {
    $ok = Clear-Port -Port 5173 -ServiceName "Vite Frontend"
    if (-not $ok) { exit 1 }
}

# 3. Launch Services
if ($FrontendOnly) {
    Write-Host "Starting Vite frontend only (http://localhost:5173)..." -ForegroundColor Green
    Set-Location "$WorkspaceRoot\frontend"
    npm run dev
    exit 0
}

if ($BackendOnly) {
    Write-Host "Starting Spring Boot backend only (http://localhost:8080)..." -ForegroundColor Green
    Set-Location "$WorkspaceRoot\backend"
    .\mvnw.cmd spring-boot:run
    exit 0
}

Write-Host "Launching Spring Boot Backend in a dedicated window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting MediSync Backend on :8080...' -ForegroundColor Cyan; cd '$WorkspaceRoot\backend'; .\mvnw.cmd spring-boot:run"

Write-Host "Waiting for backend to bind port 8080..." -ForegroundColor Gray
$retryCount = 0
$maxRetries = 40
$backendReady = $false

while ($retryCount -lt $maxRetries) {
    $pids = Get-PortProcess -Port 8080
    if ($pids) {
        $backendReady = $true
        break
    }
    Start-Sleep -Seconds 1
    $retryCount++
}

if ($backendReady) {
    Write-Host "Backend is listening on http://localhost:8080!" -ForegroundColor Green
} else {
    Write-Host "[NOTE] Backend is still initializing in its window. Starting frontend..." -ForegroundColor Yellow
}

Write-Host "Starting Vite Frontend in this window (HMR enabled)..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop frontend. Run .\stop-dev.ps1 to stop all background dev services." -ForegroundColor Cyan
Set-Location "$WorkspaceRoot\frontend"
npm run dev
