# Define variables
$n8nBaseUrl = "http://localhost:5678"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjYxMzEzMS04MDkzLTQzNTItODU3Yy1iNmFiNWUyYjA4YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ1Nzg1MDA1LCJleHAiOjE3NDgzMTg0MDB9.HD0cBJS9iEU4XZD3iVqJn_AkFJTRbXC98vK_DD0bDmI"
$workflowFilePath = "workflow.json"
$webhookPath = "echo-test"
$testMessage = "Hello from PowerShell!"

# Read the workflow JSON
$workflowJson = Get-Content -Path $workflowFilePath -Raw | ConvertFrom-Json

# Deploy the workflow
$deployResponse = Invoke-RestMethod -Method Post -Uri "$n8nBaseUrl/api/v1/workflows" `
    -Headers @{ "X-N8N-API-KEY" = $apiKey } `
    -Body ($workflowJson | ConvertTo-Json -Depth 10) `
    -ContentType "application/json"

$workflowId = $deployResponse.id
Write-Host "Workflow deployed with ID: $workflowId"

# Activate the workflow
Invoke-RestMethod -Method Post -Uri "$n8nBaseUrl/api/v1/workflows/$workflowId/activate" `
    -Headers @{ "X-N8N-API-KEY" = $apiKey }

Write-Host "Workflow activated."

# Wait for the webhook to be ready
Start-Sleep -Seconds 2

# Send test POST request to the webhook
$webhookUrl = "$n8nBaseUrl/webhook/$webhookPath"
$response = Invoke-RestMethod -Method Post -Uri $webhookUrl `
    -Body (@{ testMessage = $testMessage } | ConvertTo-Json) `
    -ContentType "application/json"

# Print the response
Write-Host "Webhook response: $($response | ConvertTo-Json -Depth 10)" 