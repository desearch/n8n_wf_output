# Define variables
$n8nBaseUrl = "http://localhost:5678"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjYxMzEzMS04MDkzLTQzNTItODU3Yy1iNmFiNWUyYjA4YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ1Nzg1MDA1LCJleHAiOjE3NDgzMTg0MDB9.HD0cBJS9iEU4XZD3iVqJn_AkFJTRbXC98vK_DD0bDmI"
$workflowFilePath = "workflow.json"
$webhookPath = "calculate"

# Test cases
$testCases = @(
    @{
        name = "Positive Integer"
        number = 5
        expected = 25
    },
    @{
        name = "Zero"
        number = 0
        expected = 0
    },
    @{
        name = "Negative Number"
        number = -3
        expected = 9
    },
    @{
        name = "Large Number"
        number = 1000
        expected = 1000000
    }
)

# Environment configuration
$environments = @{
    "dev" = @{
        baseUrl = "http://localhost:5678"
        apiKey = $apiKey
    }
    "staging" = @{
        baseUrl = "http://staging.n8n.example.com"
        apiKey = "your_staging_api_key"
    }
    "prod" = @{
        baseUrl = "http://prod.n8n.example.com"
        apiKey = "your_prod_api_key"
    }
}

# Function to clean up workflows
function Remove-Workflows {
    param (
        [string]$environment,
        [string]$workflowName
    )
    
    $envConfig = $environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }

    try {
        # Get all workflows
        $workflows = Invoke-RestMethod -Method Get -Uri "$($envConfig.baseUrl)/api/v1/workflows" -Headers $headers
        
        # Find and remove matching workflows
        foreach ($workflow in $workflows) {
            if ($workflow.name -like "*$workflowName*") {
                Write-Host "Removing workflow: $($workflow.name) (ID: $($workflow.id))"
                Invoke-RestMethod -Method Delete -Uri "$($envConfig.baseUrl)/api/v1/workflows/$($workflow.id)" -Headers $headers
            }
        }
    }
    catch {
        Write-Host "Error cleaning up workflows: $_"
    }
}

# Function to deploy workflow
function Deploy-Workflow {
    param (
        [string]$environment,
        [string]$workflowFile,
        [string]$version
    )
    
    $envConfig = $environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }

    try {
        # Read and update workflow JSON
        $workflowJson = Get-Content -Path $workflowFile -Raw | ConvertFrom-Json
        $workflowJson.name = "$($workflowJson.name) v$version"
        
        # Deploy workflow
        $response = Invoke-RestMethod -Method Post -Uri "$($envConfig.baseUrl)/api/v1/workflows" `
            -Headers $headers `
            -Body ($workflowJson | ConvertTo-Json -Depth 10)
        
        return $response.id
    }
    catch {
        Write-Host "Error deploying workflow: $_"
        return $null
    }
}

# Function to test workflow
function Test-Workflow {
    param (
        [string]$environment,
        [string]$workflowId,
        [object]$testCase
    )
    
    $envConfig = $environments[$environment]
    $headers = @{
        "Content-Type" = "application/json"
    }

    try {
        Write-Host "Testing case: $($testCase.name)"
        $response = Invoke-RestMethod -Method Post -Uri "$($envConfig.baseUrl)/webhook/$webhookPath" `
            -Headers $headers `
            -Body (@{ number = $testCase.number } | ConvertTo-Json)

        $result = $response.square -eq $testCase.expected
        Write-Host "Result: $(if ($result) { 'PASS' } else { 'FAIL' })"
        Write-Host "Expected: $($testCase.expected), Got: $($response.square)"
        
        return $result
    }
    catch {
        Write-Host "Error testing workflow: $_"
        return $false
    }
}

# Main execution
$environment = "dev"  # Change this to test different environments
$version = "1.0.0"

Write-Host "Deploying workflow to $environment environment..."
$workflowId = Deploy-Workflow -environment $environment -workflowFile $workflowFilePath -version $version

if ($workflowId) {
    Write-Host "Workflow deployed with ID: $workflowId"
    
    # Activate workflow
    $envConfig = $environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }
    
    Invoke-RestMethod -Method Post -Uri "$($envConfig.baseUrl)/api/v1/workflows/$workflowId/activate" -Headers $headers
    Write-Host "Workflow activated."
    
    # Wait for webhook to be ready
    Start-Sleep -Seconds 5
    
    # Run test cases
    $allTestsPassed = $true
    foreach ($testCase in $testCases) {
        $testResult = Test-Workflow -environment $environment -workflowId $workflowId -testCase $testCase
        $allTestsPassed = $allTestsPassed -and $testResult
    }
    
    if ($allTestsPassed) {
        Write-Host "All tests passed successfully!"
    }
    else {
        Write-Host "Some tests failed. Check the output above for details."
    }
    
    # Cleanup (comment out if you want to keep the workflow)
    Write-Host "Cleaning up workflows..."
    Remove-Workflows -environment $environment -workflowName "Calculate Square"
}
else {
    Write-Host "Failed to deploy workflow."
} 