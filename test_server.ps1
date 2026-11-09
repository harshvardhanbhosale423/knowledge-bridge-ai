Write-Host "Starting uvicorn server..."
$proc = Start-Process -FilePath ".\backend\python_env\python.exe" -ArgumentList "run_backend.py" -RedirectStandardOutput "uvicorn_out.log" -RedirectStandardError "uvicorn_err.log" -PassThru
Start-Sleep -Seconds 4

Write-Host "Uvicorn logs:"
if (Test-Path "uvicorn_out.log") { Get-Content "uvicorn_out.log" }
if (Test-Path "uvicorn_err.log") { Get-Content "uvicorn_err.log" }

Write-Host "`nTesting GET /api/health..."
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 5
    Write-Host "HEALTH OK: $($res.app) - $($res.tagline)"
} catch {
    Write-Host "HEALTH FAILED: $_"
}

Write-Host "`nTesting GET /api/stats..."
try {
    $stats = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/stats" -TimeoutSec 5
    Write-Host "STATS OK: Projects=$($stats.total_projects), Docs=$($stats.uploaded_documents), Pending=$($stats.pending_reviews), Approved=$($stats.approved_handovers)"
} catch {
    Write-Host "STATS FAILED: $_"
}

Write-Host "`nTesting GET /api/projects..."
try {
    $projects = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects" -TimeoutSec 5
    Write-Host "PROJECTS OK: Found $($projects.Count) project(s):"
    foreach ($p in $projects) {
        Write-Host "  - [$($p.code)] $($p.title) (Docs: $($p.document_count), Items: $($p.item_count))"
    }
} catch {
    Write-Host "PROJECTS FAILED: $_"
}

Stop-Process -Id $proc.Id -Force
Write-Host "Server stopped cleanly."

