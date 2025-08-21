# Development Server Management Script
# This script helps you properly stop and start the development server

Write-Host "🚀 Development Server Manager" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

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
                        Stop-Process -Id $pid -Force
                        Write-Host "✅ Stopped process $pid" -ForegroundColor Green
                    } catch {
                        Write-Host "❌ Could not stop process $pid" -ForegroundColor Red
                    }
                }
            }
        } else {
            Write-Host "✅ No processes found on port $Port" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Could not check port $Port" -ForegroundColor Yellow
    }
}

# Stop any existing development servers
Write-Host "`n🛑 Stopping existing development servers..." -ForegroundColor Yellow
Stop-ProcessOnPort 5174  # Frontend port
Stop-ProcessOnPort 5175  # Backup frontend port
Stop-ProcessOnPort 3000  # Backend port

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Start the development server
Write-Host "`n🚀 Starting development server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:5174/" -ForegroundColor Cyan
Write-Host "Backend API will be available at: http://localhost:3000/" -ForegroundColor Cyan
Write-Host "`nIf you see EADDRINUSE error, wait a few seconds and try again." -ForegroundColor Yellow
Write-Host "`n🔄 Starting servers..." -ForegroundColor Green

npm run dev
