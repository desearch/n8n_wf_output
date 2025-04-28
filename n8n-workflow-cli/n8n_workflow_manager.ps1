# n8n Workflow Manager
# A consolidated script for managing n8n workflows with both interactive and automated modes

# Configuration
$config = @{
    # Environment configurations
    environments = @{
        "dev" = @{
            baseUrl = "http://localhost:5678"
            apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjYxMzEzMS04MDkzLTQzNTItODU3Yy1iNmFiNWUyYjA4YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ1Nzg1MDA1LCJleHAiOjE3NDgzMTg0MDB9.HD0cBJS9iEU4XZD3iVqJn_AkFJTRbXC98vK_DD0bDmI"
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
    
    # Default settings
    defaultEnvironment = "dev"
    defaultWorkflowPattern = "Calculate Square"
    defaultWorkflowFile = "workflow.json"
    defaultWebhookPath = "calculate"
    defaultVersion = "1.0.0"
    
    # Test cases
    testCases = @(
        @{
            name = "Positive Integer"
            number = 5
            expected = 25
            expectedCube = 125
        },
        @{
            name = "Zero"
            number = 0
            expected = 0
            expectedCube = 0
        },
        @{
            name = "Negative Number"
            number = -3
            expected = 9
            expectedCube = -27
        },
        @{
            name = "Large Number"
            number = 1000
            expected = 1000000
            expectedCube = 1000000000
        }
    )
}

# Function to get workflows
function Get-Workflows {
    param (
        [string]$environment,
        [string]$pattern,
        [bool]$deployedOnly = $false
    )
    
    $envConfig = $config.environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Method Get -Uri "$($envConfig.baseUrl)/api/v1/workflows" -Headers $headers
        $workflows = $response.data
        
        if ($deployedOnly) {
            # Filter for workflows that match the pattern AND have a version suffix
            return $workflows | Where-Object { 
                $_.name -like "*$pattern*" -and 
                $_.name -match " v\d+\.\d+\.\d+$"
            }
        } else {
            return $workflows | Where-Object { $_.name -like "*$pattern*" }
        }
    }
    catch {
        Write-Error "Error getting workflows: $_"
        return @()
    }
}

# Function to remove workflow
function Remove-Workflow {
    param (
        [string]$environment,
        [object]$workflow,
        [bool]$dryRun,
        [bool]$force
    )
    
    $envConfig = $config.environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }

    if ($dryRun) {
        Write-Host "[DRY RUN] Would remove workflow: $($workflow.name) (ID: $($workflow.id))"
        return
    }

    if (-not $force) {
        $confirmation = Read-Host "Are you sure you want to remove workflow '$($workflow.name)'? (y/n)"
        if ($confirmation -ne 'y') {
            Write-Host "Skipping workflow: $($workflow.name)"
            return
        }
    }

    try {
        Write-Host "Removing workflow: $($workflow.name) (ID: $($workflow.id))"
        Invoke-RestMethod -Method Delete -Uri "$($envConfig.baseUrl)/api/v1/workflows/$($workflow.id)" -Headers $headers
        Write-Host "Successfully removed workflow: $($workflow.name)"
    }
    catch {
        Write-Error "Error removing workflow $($workflow.name): $_"
    }
}

# Function to get workflow by name (without version)
function Get-WorkflowByName {
    param (
        [string]$environment,
        [string]$workflowName
    )
    
    $envConfig = $config.environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Method Get -Uri "$($envConfig.baseUrl)/api/v1/workflows" -Headers $headers
        $workflows = $response.data
        
        # Find workflow with matching name (ignoring version suffix)
        return $workflows | Where-Object { 
            $_.name -replace " v\d+\.\d+\.\d+$" -eq $workflowName
        } | Select-Object -First 1
    }
    catch {
        Write-Error "Error getting workflow by name: $_"
        return $null
    }
}

# Function to update workflow
function Update-Workflow {
    param (
        [string]$environment,
        [string]$workflowId,
        [object]$workflowJson,
        [string]$version
    )
    
    $envConfig = $config.environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }

    try {
        # Update workflow name with version
        $workflowJson.name = "$($workflowJson.name) v$version"
        
        # Update workflow
        $response = Invoke-RestMethod -Method Put -Uri "$($envConfig.baseUrl)/api/v1/workflows/$workflowId" `
            -Headers $headers `
            -Body ($workflowJson | ConvertTo-Json -Depth 10)
        
        return $response.id
    }
    catch {
        Write-Error "Error updating workflow: $_"
        return $null
    }
}

# Function to deploy workflow
function Deploy-Workflow {
    param (
        [string]$environment,
        [string]$workflowFile,
        [string]$version,
        [bool]$update = $false
    )
    
    $envConfig = $config.environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }

    try {
        # Read workflow JSON
        $workflowJson = Get-Content -Path $workflowFile -Raw | ConvertFrom-Json
        
        if ($update) {
            # Check if workflow exists
            $existingWorkflow = Get-WorkflowByName -environment $environment -workflowName $workflowJson.name
            
            if ($existingWorkflow) {
                Write-Host "Updating existing workflow: $($workflowJson.name)"
                return Update-Workflow -environment $environment -workflowId $existingWorkflow.id -workflowJson $workflowJson -version $version
            }
        }
        
        # If not updating or workflow doesn't exist, create new
        $workflowJson.name = "$($workflowJson.name) v$version"
        
        # Deploy workflow
        $response = Invoke-RestMethod -Method Post -Uri "$($envConfig.baseUrl)/api/v1/workflows" `
            -Headers $headers `
            -Body ($workflowJson | ConvertTo-Json -Depth 10)
        
        return $response.id
    }
    catch {
        Write-Error "Error deploying workflow: $_"
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
    
    $envConfig = $config.environments[$environment]
    $headers = @{
        "Content-Type" = "application/json"
    }

    try {
        Write-Host "Testing case: $($testCase.name)"
        $response = Invoke-RestMethod -Method Post -Uri "$($envConfig.baseUrl)/webhook/$($config.defaultWebhookPath)" `
            -Headers $headers `
            -Body (@{ number = $testCase.number } | ConvertTo-Json)

        $squareResult = $response.square -eq $testCase.expected
        $cubeResult = $response.cube -eq $testCase.expectedCube
        $result = $squareResult -and $cubeResult
        
        Write-Host "Result: $(if ($result) { 'PASS' } else { 'FAIL' })"
        Write-Host "Square - Expected: $($testCase.expected), Got: $($response.square)"
        Write-Host "Cube - Expected: $($testCase.expectedCube), Got: $($response.cube)"
        
        return $result
    }
    catch {
        Write-Error "Error testing workflow: $_"
        return $false
    }
}

# Function to activate workflow
function Activate-Workflow {
    param (
        [string]$environment,
        [string]$workflowId
    )
    
    $envConfig = $config.environments[$environment]
    $headers = @{
        "X-N8N-API-KEY" = $envConfig.apiKey
        "Content-Type" = "application/json"
    }
    
    try {
        Invoke-RestMethod -Method Post -Uri "$($envConfig.baseUrl)/api/v1/workflows/$workflowId/activate" -Headers $headers
        Write-Host "Workflow activated successfully"
        return $true
    }
    catch {
        Write-Error "Error activating workflow: $_"
        return $false
    }
}

# Main menu function
function Show-Menu {
    Write-Host @"

n8n Workflow Manager
===================

1. Deploy and Test Workflow
2. Cleanup Deployed Workflows
3. List Workflows
4. Exit

"@
    
    $choice = Read-Host "Enter your choice (1-4)"
    return $choice
}

# Function to handle deployment and testing
function Start-Deployment {
    param (
        [string]$environment = $config.defaultEnvironment,
        [string]$workflowFile = $config.defaultWorkflowFile,
        [string]$version = $config.defaultVersion,
        [bool]$autoMode = $false,
        [bool]$update = $false
    )
    
    Write-Host "Deploying workflow to $environment environment..."
    $workflowId = Deploy-Workflow -environment $environment -workflowFile $workflowFile -version $version -update $update

    if ($workflowId) {
        Write-Host "Workflow deployed with ID: $workflowId"
        
        if (Activate-Workflow -environment $environment -workflowId $workflowId) {
            # Wait for webhook to be ready
            Start-Sleep -Seconds 5
            
            # Run test cases
            $allTestsPassed = $true
            foreach ($testCase in $config.testCases) {
                $testResult = Test-Workflow -environment $environment -workflowId $workflowId -testCase $testCase
                $allTestsPassed = $allTestsPassed -and $testResult
            }
            
            if ($allTestsPassed) {
                Write-Host "All tests passed successfully!"
            }
            else {
                Write-Host "Some tests failed. Check the output above for details."
            }
        }
    }
    else {
        Write-Host "Failed to deploy workflow."
    }
}

# Function to handle cleanup
function Start-Cleanup {
    param (
        [string]$environment = $config.defaultEnvironment,
        [string]$pattern = $config.defaultWorkflowPattern,
        [bool]$dryRun = $true,
        [bool]$force = $false,
        [bool]$autoMode = $false
    )

    Write-Host "Starting cleanup process..."
    Write-Host "Environment: $environment"
    Write-Host "Pattern: $pattern"
    Write-Host "Dry Run: $dryRun"
    Write-Host "Force: $force"
    Write-Host ""

    # Only get workflows that were deployed through this script (have version suffix)
    $workflows = Get-Workflows -environment $environment -pattern $pattern -deployedOnly $true

    if ($workflows.Count -eq 0) {
        Write-Host "No deployed workflows found matching pattern '$pattern'"
        return
    }

    Write-Host "Found $($workflows.Count) deployed workflow(s) matching pattern '$pattern':"
    $workflows | ForEach-Object {
        Write-Host "- $($_.name) (ID: $($_.id))"
    }

    if (-not $autoMode) {
        if ($dryRun) {
            Write-Host "DRY RUN: No workflows will be actually removed"
        }
        else {
            Write-Host "WARNING: This will permanently remove the workflows listed above"
            if (-not $force) {
                $confirmation = Read-Host "Do you want to proceed? (y/n)"
                if ($confirmation -ne 'y') {
                    Write-Host "Cleanup cancelled"
                    return
                }
            }
        }
    }

    $workflows | ForEach-Object {
        Remove-Workflow -environment $environment -workflow $_ -dryRun $dryRun -force $force
    }

    Write-Host ""
    Write-Host "Cleanup completed"
}

# Function to list workflows
function Show-Workflows {
    param (
        [string]$environment = $config.defaultEnvironment,
        [string]$pattern = $config.defaultWorkflowPattern,
        [bool]$deployedOnly = $false
    )
    
    $workflows = Get-Workflows -environment $environment -pattern $pattern -deployedOnly $deployedOnly
    
    if ($workflows.Count -eq 0) {
        Write-Host "No workflows found matching pattern '$pattern'"
        return
    }
    
    Write-Host "Found $($workflows.Count) workflow(s) matching pattern '$pattern':"
    $workflows | ForEach-Object {
        Write-Host "- $($_.name) (ID: $($_.id))"
    }
}

# Main execution
if ($args.Count -gt 0) {
    # Automated mode
    switch ($args[0]) {
        "deploy" {
            $environment = if ($args[1]) { $args[1] } else { $config.defaultEnvironment }
            $workflowFile = if ($args[2]) { $args[2] } else { $config.defaultWorkflowFile }
            $version = if ($args[3]) { $args[3] } else { $config.defaultVersion }
            $update = if ($args[4] -eq "true") { $true } else { $false }
            Start-Deployment -environment $environment -workflowFile $workflowFile -version $version -autoMode $true -update $update
        }
        "cleanup" {
            $environment = if ($args[1]) { $args[1] } else { $config.defaultEnvironment }
            $pattern = if ($args[2]) { $args[2] } else { $config.defaultWorkflowPattern }
            $dryRun = if ($args[3] -eq "false") { $false } else { $true }
            $force = if ($args[4] -eq "true") { $true } else { $false }
            Start-Cleanup -environment $environment -pattern $pattern -dryRun $dryRun -force $force -autoMode $true
        }
        "list" {
            $environment = if ($args[1]) { $args[1] } else { $config.defaultEnvironment }
            $pattern = if ($args[2]) { $args[2] } else { $config.defaultWorkflowPattern }
            $deployedOnly = if ($args[3] -eq "true") { $true } else { $false }
            Show-Workflows -environment $environment -pattern $pattern -deployedOnly $deployedOnly
        }
        default {
            Write-Host @"
Usage:
    .\n8n_workflow_manager.ps1 [command] [options]

Commands:
    deploy [environment] [workflowFile] [version]
        Deploy and test a workflow

    cleanup [environment] [pattern] [dryRun] [force]
        Clean up deployed workflows matching pattern

    list [environment] [pattern] [deployedOnly]
        List workflows matching pattern

Examples:
    # Deploy workflow
    .\n8n_workflow_manager.ps1 deploy dev workflow.json 1.0.0

    # Cleanup deployed workflows
    .\n8n_workflow_manager.ps1 cleanup dev "Calculate Square" false true

    # List all workflows
    .\n8n_workflow_manager.ps1 list dev "Calculate Square"

    # List only deployed workflows
    .\n8n_workflow_manager.ps1 list dev "Calculate Square" true
"@
        }
    }
}
else {
    # Interactive mode
    while ($true) {
        $choice = Show-Menu
        
        switch ($choice) {
            "1" {
                $environment = Read-Host "Enter environment (dev/staging/prod) [$($config.defaultEnvironment)]"
                if (-not $environment) { $environment = $config.defaultEnvironment }
                
                $workflowFile = Read-Host "Enter workflow file path [$($config.defaultWorkflowFile)]"
                if (-not $workflowFile) { $workflowFile = $config.defaultWorkflowFile }
                
                $version = Read-Host "Enter version [$($config.defaultVersion)]"
                if (-not $version) { $version = $config.defaultVersion }
                
                $update = Read-Host "Update existing workflow if found? (y/n) [n]"
                if (-not $update) { $update = "n" }
                
                Start-Deployment -environment $environment -workflowFile $workflowFile -version $version -update ($update -eq "y")
            }
            "2" {
                $environment = Read-Host "Enter environment (dev/staging/prod) [$($config.defaultEnvironment)]"
                if (-not $environment) { $environment = $config.defaultEnvironment }
                
                $pattern = Read-Host "Enter workflow pattern [$($config.defaultWorkflowPattern)]"
                if (-not $pattern) { $pattern = $config.defaultWorkflowPattern }
                
                $dryRun = Read-Host "Dry run? (y/n) [y]"
                if (-not $dryRun) { $dryRun = "y" }
                
                $force = Read-Host "Force cleanup? (y/n) [n]"
                if (-not $force) { $force = "n" }
                
                Start-Cleanup -environment $environment -pattern $pattern -dryRun ($dryRun -eq "y") -force ($force -eq "y")
            }
            "3" {
                $environment = Read-Host "Enter environment (dev/staging/prod) [$($config.defaultEnvironment)]"
                if (-not $environment) { $environment = $config.defaultEnvironment }
                
                $pattern = Read-Host "Enter workflow pattern [$($config.defaultWorkflowPattern)]"
                if (-not $pattern) { $pattern = $config.defaultWorkflowPattern }
                
                $deployedOnly = Read-Host "Show only deployed workflows? (y/n) [n]"
                if (-not $deployedOnly) { $deployedOnly = "n" }
                
                Show-Workflows -environment $environment -pattern $pattern -deployedOnly ($deployedOnly -eq "y")
            }
            "4" {
                Write-Host "Exiting..."
                exit
            }
            default {
                Write-Host "Invalid choice. Please try again."
            }
        }
        
        Write-Host "`nPress Enter to continue..."
        Read-Host
    }
} 