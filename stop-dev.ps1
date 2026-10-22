# MediSync Dev Cleanup Script
# Stops any running development processes on ports 8080 (backend) and 5173 (frontend).

[CmdletBinding()]
param()

$Ports = @(8080, 5173)
$stoppedAny = $false

foreach ($port in $Ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }
        foreach ($p in $pids) {
            try {
                $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
                $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }
                Write-Host "Terminating process on port $port (PID: $p, Name: $procName)..." -ForegroundColor Yellow
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                $stoppedAny = $true
            } catch {
                Write-Host "Could not terminate PID $p: $_" -ForegroundColor Red
            }
        }
    }
}

if ($stoppedAny) {
    Write-Host "Development services stopped successfully." -ForegroundColor Green
} else {
    Write-Host "No active development services found on ports 8080 or 5173." -ForegroundColor Cyan
}
