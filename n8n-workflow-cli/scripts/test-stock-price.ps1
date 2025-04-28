# Test Stock Price Workflow Script
$ErrorActionPreference = "Stop"

# Configuration
$workflowFile = "stock-price-workflow.json"
$env = "dev"

Write-Host "Starting Stock Price Workflow Tests..."

try {
    # 1. Deploy the workflow
    Write-Host "`n1. Deploying workflow..."
    $deployOutput = n8n-workflow-manager deploy --file $workflowFile --env $env
    $workflowId = $deployOutput | Select-String -Pattern "Workflow ID: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "Workflow deployed with ID: $workflowId"

    # 2. Test the workflow
    Write-Host "`n2. Testing workflow..."
    n8n-workflow-manager test --file $workflowFile --env $env

    # 3. List workflows to verify
    Write-Host "`n3. Listing workflows..."
    n8n-workflow-manager list --env $env

    # 4. Update the workflow
    Write-Host "`n4. Updating workflow..."
    n8n-workflow-manager update --id $workflowId --file $workflowFile --env $env

    # 5. Test again after update
    Write-Host "`n5. Testing updated workflow..."
    n8n-workflow-manager test --file $workflowFile --env $env

    # 6. Clean up
    Write-Host "`n6. Cleaning up..."
    n8n-workflow-manager delete --id $workflowId --env $env

    Write-Host "`n✅ All tests completed successfully!"
} catch {
    Write-Host "`n❌ Error occurred:"
    Write-Host $_.Exception.Message
    exit 1
} 