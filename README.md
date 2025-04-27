# n8n Workflow Manager

A PowerShell script for managing n8n workflows with both interactive and automated modes. This script provides a unified interface for deploying, testing, and managing n8n workflows.

## Features

- **Interactive Mode**: User-friendly menu interface for manual operations
- **Automated Mode**: Command-line interface for automation and CI/CD
- **Environment Support**: Manage workflows across different environments (dev, staging, prod)
- **Workflow Management**:
  - Deploy and test workflows with version control
  - Clean up only deployed workflows (identified by version suffix)
  - List all workflows or only deployed ones
- **Testing**: Built-in test cases for workflow validation
- **Safety Features**:
  - Dry-run mode for cleanup operations
  - Confirmation prompts for destructive operations
  - Only cleans up workflows deployed through this script
  - Error handling and logging

## Prerequisites

- PowerShell 5.1 or later
- n8n instance running and accessible
- API key for n8n instance
- Workflow JSON file

## Configuration

The script uses a configuration object that can be modified to suit your needs:

```powershell
$config = @{
    # Environment configurations
    environments = @{
        "dev" = @{
            baseUrl = "http://localhost:5678"
            apiKey = "your_api_key"
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
```

## Usage

### Interactive Mode

Run the script without arguments to enter interactive mode:

```powershell
.\n8n_workflow_manager.ps1
```

The interactive menu provides the following options:

1. **Deploy and Test Workflow**
   - Deploy a workflow to the specified environment
   - Automatically appends version number to workflow name
   - Run test cases against the deployed workflow
   - Automatically activate the workflow

2. **Cleanup Deployed Workflows**
   - List workflows matching a pattern
   - Only removes workflows deployed through this script (with version suffix)
   - Dry-run option to preview what will be removed
   - Force mode for automated cleanup

3. **List Workflows**
   - View existing workflows
   - Filter by pattern
   - Option to show only deployed workflows (with version suffix)

4. **Exit**
   - Close the script

### Automated Mode

The script can be run with command-line arguments for automation:

```powershell
# Deploy workflow
.\n8n_workflow_manager.ps1 deploy [environment] [workflowFile] [version] [update]

# Cleanup deployed workflows (only those with version suffix)
.\n8n_workflow_manager.ps1 cleanup [environment] [pattern] [dryRun] [force]

# List workflows
.\n8n_workflow_manager.ps1 list [environment] [pattern] [deployedOnly]
```

#### Examples

```powershell
# Deploy new workflow to dev environment
.\n8n_workflow_manager.ps1 deploy dev workflow.json 1.0.0 false

# Update existing workflow in dev environment
.\n8n_workflow_manager.ps1 deploy dev workflow.json 1.0.1 true

# List all workflows
.\n8n_workflow_manager.ps1 list dev "Calculate Square" false

# List only deployed workflows (with version suffix)
.\n8n_workflow_manager.ps1 list dev "Calculate Square" true

# Preview cleanup of deployed workflows (dry run)
.\n8n_workflow_manager.ps1 cleanup dev "Calculate Square" true false

# Force cleanup of deployed workflows
.\n8n_workflow_manager.ps1 cleanup dev "Calculate Square" false true
```

## Workflow Versioning

The script implements a simple versioning system:
- Each deployed workflow gets a version suffix (e.g., "Calculate Square v1.0.0")
- Version format: `v{major}.{minor}.{patch}`
- Only workflows with version suffixes can be cleaned up
- Version suffix is used to identify workflows deployed through this script
- Workflows can be updated while maintaining version history
- When updating, the script checks for existing workflows with the same name (ignoring version)

## Workflow Updates

The script supports updating existing workflows:
- Can update workflows while maintaining version history
- Automatically detects existing workflows by name (ignoring version)
- Preserves workflow ID when updating
- Updates workflow name with new version number
- Runs test cases after update to ensure functionality
- Can be used in both interactive and automated modes

### Update Example

Here's a real example of updating a workflow:

1. Initial Deployment (v1.0.0):
   ```powershell
   .\n8n_workflow_manager.ps1 deploy dev workflow.json 1.0.0 false
   ```
   - Deploys workflow with square calculation
   - Response format: `{"error": false, "input": 5, "square": 25, "message": "The square of 5 is 25"}`

2. Update Deployment (v1.0.1):
   ```powershell
   .\n8n_workflow_manager.ps1 deploy dev workflow_v2.json 1.0.1 true
   ```
   - Updates workflow to include cube calculation
   - New response format: `{"error": false, "input": 5, "square": 25, "cube": 125, "message": "The square of 5 is 25 and the cube is 125"}`

3. Verification:
   ```powershell
   $headers = @{ "Content-Type" = "application/json" }
   Invoke-RestMethod -Method Post -Uri "http://localhost:5678/webhook/calculate" -Headers $headers -Body '{"number": 5}'
   ```
   - Tests both square and cube calculations
   - Verifies updated response format
   - Confirms backward compatibility

## Test Cases

The script includes built-in test cases that verify workflow functionality:

1. **Test Case Structure**:
   ```powershell
   @{
       name = "Test Name"           # Descriptive name of the test
       number = 5                   # Input value
       expected = 25               # Expected square result
       expectedCube = 125          # Expected cube result (for updated workflow)
   }
   ```

2. **Default Test Cases**:
   - Positive Integer (5 → square: 25, cube: 125)
   - Zero (0 → square: 0, cube: 0)
   - Negative Number (-3 → square: 9, cube: -27)
   - Large Number (1000 → square: 1000000, cube: 1000000000)

3. **Test Execution**:
   - Tests run automatically after deployment/update
   - Each test case verifies both square and cube calculations
   - Results show expected vs actual values
   - Clear pass/fail indicators for each test

## Error Handling

The script includes comprehensive error handling:
- API call failures
- Invalid input validation
- Workflow deployment errors
- Test case failures
- Cleanup safety checks

All errors are logged with descriptive messages to help with troubleshooting.

## Best Practices

1. **Environment Configuration**
   - Keep API keys secure
   - Use appropriate base URLs for each environment
   - Configure test cases according to your workflow requirements

2. **Workflow Management**
   - Use semantic versioning for workflow deployments
   - Always test workflows before cleanup
   - Use dry-run mode for cleanup operations when unsure
   - Keep track of deployed workflow versions

3. **Automation**
   - Use automated mode for CI/CD pipelines
   - Implement proper error handling in automation scripts
   - Monitor deployment and test results
   - Use force mode carefully in automated cleanup

4. **Safety**
   - Regular workflows (without version suffix) cannot be deleted
   - Always use dry-run first when cleaning up workflows
   - Keep backups of important workflow configurations
   - Review cleanup patterns carefully

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 