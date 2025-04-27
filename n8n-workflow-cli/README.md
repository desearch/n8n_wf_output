# n8n Workflow CLI

A powerful command-line tool for managing n8n workflow deployments. This tool helps you create, deploy, update, and manage n8n workflows with ease.

## Local Development and Deployment

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- n8n instance (local or remote)

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd n8n-workflow-cli
```

2. Install dependencies:
```bash
npm install
```

3. Link the package globally:
```bash
npm link
```

This will create a symbolic link to your package in the global npm directory, making the `n8n-workflow` command available anywhere in your system.

### Verifying Installation

To verify the installation, run:
```bash
n8n-workflow --help
```

You should see the available commands and options.

## Usage

### Create a new workflow project

```bash
n8n-workflow create
```

This will create a new workflow project with the following structure:
- `workflow.json` - The workflow definition file
- `docker-compose.yml` - Docker configuration for running n8n
- `.gitignore` - Git ignore file

Example:
```bash
n8n-workflow create --name "my-workflow" --description "My first n8n workflow"
```

### Deploy a workflow

```bash
n8n-workflow deploy
```

Deploys a workflow to your n8n instance. You'll need to provide:
- Workflow file path
- Environment (dev/prod)
- n8n API key
- n8n base URL

Example:
```bash
n8n-workflow deploy --file ./workflow.json --env dev
```

### List workflows

```bash
n8n-workflow list
```

Lists all workflows in your n8n instance.

### Update a workflow

```bash
n8n-workflow update
```

Updates an existing workflow. You'll need to provide:
- Workflow ID
- Updated workflow file path
- n8n API key
- n8n base URL

Example:
```bash
n8n-workflow update --id 123 --file ./updated-workflow.json
```

### Delete a workflow

```bash
n8n-workflow delete
```

Deletes a workflow from your n8n instance. You'll need to provide:
- Workflow ID
- n8n API key
- n8n base URL

Example:
```bash
n8n-workflow delete --id 123
```

## Configuration

### Environment Variables

The CLI tool uses the following environment variables (optional):
- `N8N_API_KEY` - Your n8n API key
- `N8N_BASE_URL` - Your n8n instance URL (default: http://localhost:5678)

Example:
```bash
export N8N_API_KEY="your-api-key"
export N8N_BASE_URL="http://your-n8n-instance:5678"
```

### Local Development

1. Make changes to the code in the `n8n-workflow-cli` directory
2. Changes will be immediately available since you used `npm link`
3. Test your changes by running the commands

### Uninstalling

To remove the global link:
```bash
npm unlink -g n8n-workflow-cli
```

## Project Structure

```
n8n-workflow-cli/
├── index.js              # Main CLI entry point
├── package.json          # Project configuration
├── README.md            # This documentation
└── commands/            # Command implementations
    ├── create.js        # Create workflow command
    ├── deploy.js        # Deploy workflow command
    ├── list.js          # List workflows command
    ├── update.js        # Update workflow command
    └── delete.js        # Delete workflow command
```

## Troubleshooting

### Common Issues

1. **Command not found**
   - Make sure you've run `npm link` in the project directory
   - Verify that the `n8n-workflow` command is in your PATH

2. **API Connection Issues**
   - Verify your n8n instance is running
   - Check your API key and base URL
   - Ensure your n8n instance is accessible from your machine

3. **Permission Issues**
   - Run `npm link` with appropriate permissions
   - On Linux/Mac, you might need to use `sudo`

### Getting Help

- Use `n8n-workflow --help` to see available commands
- Use `n8n-workflow <command> --help` to see options for a specific command
- Check the n8n documentation for API-related issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC 