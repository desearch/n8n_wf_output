# n8n Workflow Deployment Automation

This project demonstrates how to automate the deployment and testing of n8n workflows using PowerShell. The example workflow calculates the square of a number, but the automation process can be adapted for any n8n workflow.

## Prerequisites

- Docker and Docker Compose installed
- PowerShell 5.1 or later
- Valid n8n API key with appropriate permissions

## Project Structure

```
.
├── workflow.json          # n8n workflow definition
├── test_workflow.ps1      # Main deployment and testing script
├── test_webhook.ps1       # Simple webhook testing script
├── docker-compose.yml     # Docker Compose configuration
├── .env                   # Environment variables (create this file)
└── README.md             # This documentation
```

## Docker Compose Deployment

The project includes a `docker-compose.yml` file for easy n8n deployment. Here's how to use it:

### 1. Create Environment File

Create a `.env` file in the project root with the following content:
```env
N8N_API_KEY=your_api_key_here
```

### 2. Obtain API Key from n8n Console

1. **Access n8n Console**:
   - After starting n8n with Docker Compose, open your browser and navigate to `http://localhost:5678`
   - Log in to your n8n instance (if authentication is enabled)

2. **Navigate to API Settings**:
   - Click on your profile icon in the top-right corner
   - Select "Settings" from the dropdown menu
   - Click on "API" in the left sidebar

3. **Generate API Key**:
   - Click the "Generate New Key" button
   - Copy the generated API key
   - Paste this key into your `.env` file as `N8N_API_KEY`

4. **API Key Permissions**:
   - Ensure the API key has the following permissions:
     - `workflow:read`
     - `workflow:write`
     - `workflow:execute`
     - `webhook:read`
     - `webhook:write`

5. **Security Best Practices**:
   - Never commit your `.env` file to version control
   - Keep your API key secure and rotate it periodically
   - Use different API keys for different environments (dev, staging, prod)

### 3. Start n8n with Docker Compose

```bash
# Start n8n
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop n8n
docker-compose down
```

### Docker Compose Configuration Details

The `docker-compose.yml` file includes the following key configurations:

- **Container Name**: `n8n_tutorial`
- **Port**: 5678 (mapped to host)
- **Volumes**:
  - `./n8n-data`: Persistent storage for n8n data
  - `./workflows`: Directory for initial workflow data
- **Environment Variables**:
  - `N8N_HOST=localhost`
  - `N8N_PORT=5678`
  - `N8N_PROTOCOL=http`
  - `N8N_BASIC_AUTH_ACTIVE=false`
  - `WEBHOOK_URL=http://localhost:5678/`
  - `N8N_RUNNERS_ENABLED=true`

### Important Notes for Docker Deployment

1. **Data Persistence**:
   - The `n8n-data` volume ensures your workflows and settings persist between container restarts
   - The `workflows` directory is mounted for initial workflow deployment

2. **API Key**:
   - Make sure to set your API key in the `.env` file
   - The API key is required for the PowerShell automation scripts

3. **Webhook Access**:
   - Webhooks are accessible at `http://localhost:5678/webhook/`
   - Ensure your firewall allows access to port 5678

4. **Container Management**:
   - Use `docker-compose ps` to check container status
   - Use `docker-compose restart` to restart the container
   - Use `docker-compose down -v` to remove containers and volumes

## Workflow Description

The example workflow consists of two nodes:
1. **Webhook Node**: Accepts POST requests at `/webhook/calculate`
2. **Function Node**: Processes the input, calculates the square, and returns a formatted response

The workflow accepts a JSON payload in the format:
```json
{
    "number": 5
}
```

And returns a response in the format:
```json
{
    "error": false,
    "input": 5,
    "square": 25,
    "message": "The square of 5 is 25"
}
```

## Deployment Automation

The deployment process is automated using PowerShell scripts:

### 1. Main Deployment Script (`test_workflow.ps1`)

This script handles the complete workflow lifecycle:
- Creates the workflow in n8n
- Activates the workflow
- Tests the webhook with a sample number
- Displays the response

### 2. Simple Webhook Test Script (`test_webhook.ps1`)

A simplified script for quick webhook testing without deployment.

## Challenges and Solutions

### Challenge 1: API Authentication
**Problem**: Initial API key authentication issues with incorrect header format.
**Solution**: Used the correct header format `X-N8N-API-KEY` instead of `Authorization: Bearer`.

### Challenge 2: Webhook Registration
**Problem**: Webhook not immediately available after workflow activation.
**Solution**: Added a 5-second delay after activation to ensure webhook registration.

### Challenge 3: Input Validation
**Problem**: Initial issues with number validation and type conversion.
**Solution**: 
- Added explicit type conversion using `Number(input.number)`
- Implemented proper error handling for invalid inputs
- Ensured consistent JSON structure in responses

### Challenge 4: Request Body Format
**Problem**: Inconsistent request body formatting causing validation errors.
**Solution**: 
- Used `ConvertTo-Json` for proper JSON serialization
- Explicitly cast the number to integer using `[int]`
- Ensured consistent Content-Type headers

## Usage

### 1. Start n8n with Docker Compose
```bash
docker-compose up -d
```

### 2. Deploy and Test Workflow

The script now supports multiple environments and test cases:

```powershell
# Run with default settings (dev environment)
powershell -ExecutionPolicy Bypass -File test_workflow.ps1

# Run with specific environment
$env:N8N_ENVIRONMENT = "staging"
powershell -ExecutionPolicy Bypass -File test_workflow.ps1
```

### 3. Test Cases

The script includes multiple test cases:
- Positive integers
- Zero
- Negative numbers
- Large numbers

Each test case verifies:
- Input validation
- Correct calculation
- Response format

### 4. Environment Support

The script supports multiple environments:
- **dev**: Local development (http://localhost:5678)
- **staging**: Staging environment
- **prod**: Production environment

To configure environments:
1. Edit the `$environments` hash in `test_workflow.ps1`
2. Set appropriate base URLs and API keys
3. Use environment-specific credentials in `.env` files

### 5. Workflow Versioning

Workflows are automatically versioned:
- Version format: `v1.0.0`
- Version is appended to workflow name
- Version can be specified in the script

### 6. Automated Cleanup

The script includes cleanup functionality:
- Removes test workflows after testing
- Can be disabled by commenting out cleanup section
- Supports cleanup by workflow name pattern

### 7. Test Webhook Only
```powershell
powershell -ExecutionPolicy Bypass -File test_webhook.ps1
```

### 8. Test with Different Numbers
```powershell
# Modify test cases in test_workflow.ps1
$testCases = @(
    @{
        name = "Custom Test"
        number = 7
        expected = 49
    }
)
```

## Response Format

Successful response:
```json
{
    "error": false,
    "input": 5,
    "square": 25,
    "message": "The square of 5 is 25"
}
```

Error response:
```json
{
    "error": true,
    "message": "Please provide a valid number in the 'number' field"
}
```

## Best Practices

1. **Error Handling**: Always implement proper error handling in both the workflow and test scripts.
2. **Type Safety**: Ensure proper type conversion and validation of inputs.
3. **Response Format**: Maintain consistent response formats for both success and error cases.
4. **Documentation**: Keep workflow and script documentation up to date.
5. **Testing**: Test with various input scenarios, including edge cases.

## Future Improvements

1. Add support for multiple test cases
2. Implement automated cleanup of test workflows
3. Add support for different n8n environments (dev, staging, prod)
4. Implement workflow versioning
5. Add support for workflow variables and credentials

## Troubleshooting

1. **Docker Issues**:
   - Ensure Docker daemon is running
   - Check container logs: `docker-compose logs -f`
   - Verify port availability: `netstat -ano | findstr :5678`
   - Check volume permissions: `docker volume inspect n8n_tutorial_n8n-data`

2. **Test Failures**:
   - Check test case definitions
   - Verify expected results
   - Review workflow logic
   - Check environment configuration

3. **Environment Issues**:
   - Verify environment URLs
   - Check API keys
   - Ensure proper permissions
   - Review network connectivity

4. **Cleanup Issues**:
   - Check workflow naming patterns
   - Verify API permissions
   - Review error messages
   - Check environment configuration

## License

This project is open source and available under the MIT License. 