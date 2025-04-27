# n8n Workflow Manager

A PowerShell script for managing n8n workflows with both interactive and automated modes. This script provides a unified interface for deploying, testing, and managing n8n workflows.

## Features

- **Interactive Mode**: User-friendly menu interface for manual operations
- **Automated Mode**: Command-line interface for automation and CI/CD
- **Environment Support**: Manage workflows across different environments (dev, staging, prod)
- **Workflow Management**:
  - Deploy and test workflows
  - Clean up workflows
  - List existing workflows
- **Testing**: Built-in test cases for workflow validation
- **Safety Features**:
  - Dry-run mode for cleanup operations
  - Confirmation prompts for destructive operations
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
   - Run test cases against the deployed workflow
   - Automatically activate the workflow

2. **Cleanup Workflows**
   - List workflows matching a pattern
   - Remove workflows (with dry-run option)
   - Force mode for automated cleanup

3. **List Workflows**
   - View existing workflows
   - Filter by pattern

4. **Exit**
   - Close the script

### Automated Mode

The script can be run with command-line arguments for automation:

```powershell
# Deploy workflow
.\n8n_workflow_manager.ps1 deploy [environment] [workflowFile] [version]

# Cleanup workflows
.\n8n_workflow_manager.ps1 cleanup [environment] [pattern] [dryRun] [force]

# List workflows
.\n8n_workflow_manager.ps1 list [environment] [pattern]
```

#### Examples

```powershell
# Deploy workflow to dev environment
.\n8n_workflow_manager.ps1 deploy dev workflow.json 1.0.0

# Cleanup workflows in dev environment
.\n8n_workflow_manager.ps1 cleanup dev "Calculate Square" false true

# List workflows in dev environment
.\n8n_workflow_manager.ps1 list dev "Calculate Square"
```

## Error Handling

The script includes comprehensive error handling:
- API call failures
- Invalid input validation
- Workflow deployment errors
- Test case failures

All errors are logged with descriptive messages to help with troubleshooting.

## Best Practices

1. **Environment Configuration**
   - Keep API keys secure
   - Use appropriate base URLs for each environment
   - Configure test cases according to your workflow requirements

2. **Workflow Management**
   - Use versioning for workflow deployments
   - Always test workflows before cleanup
   - Use dry-run mode for cleanup operations when unsure

3. **Automation**
   - Use automated mode for CI/CD pipelines
   - Implement proper error handling in automation scripts
   - Monitor deployment and test results

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 