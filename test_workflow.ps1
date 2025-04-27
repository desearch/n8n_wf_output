# Define variables
$n8nBaseUrl = "http://localhost:5678"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjYxMzEzMS04MDkzLTQzNTItODU3Yy1iNmFiNWUyYjA4YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ1Nzg1MDA1LCJleHAiOjE3NDgzMTg0MDB9.HD0cBJS9iEU4XZD3iVqJn_AkFJTRbXC98vK_DD0bDmI"
$workflowFilePath = "workflow.json"
$webhookPath = "calculate"
$testNumber = 5

Write-Host "Creating workflow..."
$headers = @{
    "X-N8N-API-KEY" = $apiKey
    "Content-Type" = "application/json"
}

$workflowJson = Get-Content -Path $workflowFilePath -Raw
$response = Invoke-RestMethod -Method Post -Uri "$n8nBaseUrl/api/v1/workflows" `
    -Headers $headers `
    -Body $workflowJson

$workflowId = $response.id
Write-Host "Workflow created with ID: $workflowId"

Write-Host "`nActivating workflow..."
$response = Invoke-RestMethod -Method Post -Uri "$n8nBaseUrl/api/v1/workflows/$workflowId/activate" `
    -Headers $headers

Write-Host "Workflow activated."

Write-Host "`nWaiting for webhook to be ready..."
Start-Sleep -Seconds 5

Write-Host "`nTesting webhook with number: $testNumber"
$body = @{
    number = [int]$testNumber
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "$n8nBaseUrl/webhook/$webhookPath" `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body

Write-Host "Webhook response:"
$response | ConvertTo-Json 