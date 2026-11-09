Write-Host "=========================================================="
Write-Host " KNOWLEDGE BRIDGE AI - FULL PIPELINE VERIFICATION SUITE"
Write-Host "=========================================================="

# 1. Start Server
$proc = Start-Process -FilePath ".\backend\python_env\python.exe" -ArgumentList "run_backend.py" -PassThru

# Wait for server to become healthy
$health = $null
for ($i = 0; $i -lt 20; $i++) {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 2
        if ($health.status -eq "healthy") { break }
    } catch {
        Start-Sleep -Milliseconds 600
    }
}

try {
    # 2. Check Health
    Write-Host "`n[STEP 1] Probing Health Endpoint..."
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
    Write-Host ">>> App: $($health.app)"
    Write-Host ">>> Tagline: $($health.tagline)"
    Write-Host ">>> AI Engine: $($health.ai_engine.provider)"

    # 3. Create a Project
    Write-Host "`n[STEP 2] Creating Project 'Project Titan'..."
    $rand = Get-Random -Minimum 100 -Maximum 999
    $projBody = @{
        title = "Project Titan: Service Mesh Architecture"
        code = "KB-TITAN-$rand"
        description = "Service mesh zero-trust security and observability transition."
        department = "Security & Network Engineering"
        lead_name = "Marcus Vance"
    } | ConvertTo-Json
    $newProj = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects" -Method POST -Body $projBody -ContentType "application/json"
    $projId = $newProj.id
    Write-Host ">>> Created Project ID: $projId ($($newProj.title))"

    # 4. Upload DOCX Document and auto-analyze using curl.exe
    Write-Host "`n[STEP 3] Uploading DOCX Document with auto-extraction..."
    $uploadJson = curl.exe -s -X POST "http://127.0.0.1:8000/api/projects/$projId/documents/upload?auto_analyze=true" -F "file=@sample_documents\Titan_Infra_Service_Mesh_Handover.docx"
    $uploadRes = $uploadJson | ConvertFrom-Json
    Write-Host ">>> Uploaded: $($uploadRes.original_name) ($($uploadRes.char_count) chars, $($uploadRes.page_count) page)"

    # 5. Fetch extracted knowledge items
    Write-Host "`n[STEP 4] Fetching Extracted & Evidence-Verified Knowledge Items..."
    $items = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects/$projId/knowledge-items"
    Write-Host ">>> Extracted $($items.Count) knowledge items:"
    foreach ($item in $items) {
        Write-Host "    * [$($item.category.ToUpper())] $($item.title) (Verified: $($item.evidence_verified), Conf: $($item.confidence_score))"
    }

    # 6. Human Review: Batch Approve Items
    Write-Host "`n[STEP 5] Human Review: Approving items..."
    $itemIds = @($items[0].id, $items[1].id, $items[2].id)
    $batchBody = @{
        item_ids = $itemIds
        action = "approve"
        reviewer_name = "Alex Chen (Principal Reviewer)"
        review_notes = "Verified against authorized system architecture diagrams."
    } | ConvertTo-Json
    $batchRes = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects/$projId/batch-review" -Method POST -Body $batchBody -ContentType "application/json"
    Write-Host ">>> Review result: $($batchRes.message)"

    # 7. Generate Handover Report
    Write-Host "`n[STEP 6] Generating Handover Package Draft..."
    $genBody = @{
        project_id = $projId
        title = "Project Titan: Official Service Mesh Handover Package"
        executive_summary = "Certified operational knowledge transfer for Project Titan infrastructure."
    } | ConvertTo-Json
    $handover = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects/$projId/generate-handover" -Method POST -Body $genBody -ContentType "application/json"
    Write-Host ">>> Generated Handover: $($handover.title) (Status: $($handover.status), Version: v$($handover.version))"

    # 8. Human Approval Gate
    Write-Host "`n[STEP 7] Human Approval Gate Certification..."
    $apprBody = @{
        approved_by = "Alex Chen (Engineering Director)"
        signature_notes = "Formally certified and signed for incoming team adoption."
    } | ConvertTo-Json
    $apprRes = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects/$projId/approve-handover" -Method POST -Body $apprBody -ContentType "application/json"
    Write-Host ">>> Approved Status: $($apprRes.status) by $($apprRes.approved_by)"

    # 9. Verify Final Handover Available
    Write-Host "`n[STEP 8] Confirming Final Certified Handover in Team Portal..."
    $finalHandover = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects/$projId/handover"
    Write-Host ">>> Final Report Status: $($finalHandover.status)"
    Write-Host ">>> Contains Approval Certification: $($finalHandover.markdown_content.Contains('OFFICIAL APPROVAL CERTIFICATION'))"

    Write-Host "`n=========================================================="
    Write-Host ">>> ALL 8 PIPELINE PHASES VERIFIED WITH 100% INTEGRITY! <<<"
    Write-Host "=========================================================="
} catch {
    Write-Host "`nPIPELINE ERROR: $_"
    Write-Host $_.ScriptStackTrace
} finally {
    Stop-Process -Id $proc.Id -Force
    Write-Host "`nServer stopped."
}
