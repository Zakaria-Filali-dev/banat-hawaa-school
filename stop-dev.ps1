# Stop Development Server Script
# This script stops all development server processes

Write-Host "🛑 Stopping Development Servers" -ForegroundColor Red
Write-Host "===============================" -ForegroundColor Red

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
    param($Port)
    
    Write-Host "🔍 Checking for processes on port $Port..." -ForegroundColor Yellow
    
    try {
        $processes = netstat -ano | findstr ":$Port "
        if ($processes) {
            Write-Host "Found processes on port $Port" -ForegroundColor Red
            $processes | ForEach-Object {
                $fields = $_ -split '\s+' | Where-Object { $_ -ne '' }
                if ($fields.Length -gt 4) {
                    $pid = $fields[4]
                    try {
                        $processInfo = Get-Process -Id $pid -ErrorAction SilentlyContinue
                        if ($processInfo) {
                            Write-Host "Stopping: $($processInfo.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                            Stop-Process -Id $pid -Force
                            Write-Host "✅ Stopped process $pid" -ForegroundColor Green
                        }
                    }
                    catch {
                        Write-Host "❌ Could not stop process $pid" -ForegroundColor Red
                    }
                }
            }
        }
        else {
            Write-Host "✅ No processes found on port $Port" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️  Could not check port $Port" -ForegroundColor Yellow
    }
}

# Stop processes on all relevant ports
Stop-ProcessOnPort 3000   # Backend
Stop-ProcessOnPort 5174   # Frontend (fixed port)
Stop-ProcessOnPort 5175   # Frontend (if running on backup port)
Stop-ProcessOnPort 5173   # Frontend (original port)

Write-Host "`n✅ All development servers stopped!" -ForegroundColor Green
Write-Host "You can now run 'npm run dev' or './start-dev.ps1' to restart." -ForegroundColor Cyan
