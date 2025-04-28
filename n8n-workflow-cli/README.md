# n8n Workflow Manager CLI

A command-line interface (CLI) tool for managing n8n workflows, allowing deployment, testing, listing, updating, and deletion directly from your terminal.

## Installation

1.  Clone the repository (if you haven't already).
2.  Navigate to the project directory: `cd n8n-workflow-cli`
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  (Optional) Link the CLI globally for easier access (requires administrator/sudo privileges):
    ```bash
    npm link
    ```
    If you don't link globally, you'll need to run commands using `node ./workflow-manager.js <command> [options]` or configure `npm run` scripts. If linked, you can use `n8n-workflow <command> [options]`. The examples below assume you have linked the command or are using an equivalent execution method.

## Configuration

The CLI requires connection details for your n8n instance(s). Configuration is managed through environment variables and potentially configuration files (`config.js`, `config.cjs`, `config.yml`).

1.  **Environment Variables (.env)**: Create a `.env` file in the project root. This file is loaded automatically. Define your n8n instance details here, for example:
    ```dotenv
    # Development Environment
    N8N_DEV_API_URL=http://localhost:5678/api/v1
    N8N_DEV_API_KEY=your_dev_api_key_here

    # Production Environment
    N8N_PROD_API_URL=https://your-n8n-instance.com/api/v1
    N8N_PROD_API_KEY=your_prod_api_key_here
    ```
    The specific variable names (`N8N_DEV_API_URL`, `N8N_DEV_API_KEY`, etc.) depend on the setup in `config.js`/`config.cjs`. Check those files for the exact expected variables based on your environment names (e.g., 'dev', 'prod').

2.  **Configuration Files**: Files like `config.js` or `config.cjs` define the available environments ('dev', 'prod', etc.) and map them to the environment variables. Ensure these files correctly reference the variables set in your `.env` file.

## Available Commands

Commands generally accept an `--env <environment_name>` option (defaulting to 'dev') to specify which n8n instance to target.

### `deploy`

Deploys and activates a workflow from a JSON file.

**Usage:**
```bash
n8n-workflow deploy -f <path_to_workflow.json> [--env <environment>] [--version <version>]
```

**Options:**
*   `-f`, `--file`: (Required) Path to the workflow JSON file.
*   `--env`: Environment name (e.g., 'dev', 'prod'). Defaults to 'dev'.
*   `--version`: Version string to append to the workflow name upon deployment (e.g., 'v1.0.1'). Defaults to '1.0.0'.

**Example:**
```bash
n8n-workflow deploy -f ./examples/stock-price-workflow.json --env prod --version 1.0.1
```

### `list`

Lists active workflows on the specified n8n instance.

**Usage:**
```bash
n8n-workflow list [--env <environment>]
```

**Options:**
*   `--env`: Environment name. Defaults to 'dev'.

**Example:**
```bash
n8n-workflow list --env prod
```

### `test`

Runs test cases defined within a workflow's metadata.

**Usage:**
```bash
n8n-workflow test <path_to_workflow.json> [--env <environment>]
```

**Arguments:**
*   `<path_to_workflow.json>`: (Required) Path to the workflow JSON file containing test cases in its `metadata.testCases` array.

**Options:**
*   `--env`: Environment name. Defaults to 'dev'.

**Workflow Metadata Example:**
Your workflow JSON should include a `metadata` object like this:
```json
{
  "name": "My Workflow",
  "nodes": [ ... ],
  "connections": { ... },
  "metadata": {
    "testCases": [
      {
        "name": "Test Case 1: Valid Input",
        "input": { "symbol": "AAPL" },
        "expectedOutput": { "price": "*", "symbol": "AAPL" }
      },
      {
        "name": "Test Case 2: Invalid Input",
        "input": { "symbol": "INVALID" },
        "expectedOutput": { "error": "Invalid symbol" }
      }
    ]
  }
}
```
*(Note: `"*"` in `expectedOutput.price` acts as a wildcard check for a valid price string).*

**Example:**
```bash
n8n-workflow test ./examples/stock_price_tracker_workflow.json --env dev
```

### `update`

Updates an existing workflow using a new workflow JSON file.

**Usage:**
```bash
n8n-workflow update <workflow_id> -f <path_to_new_workflow.json> [--env <environment>]
```

**Arguments:**
*   `<workflow_id>`: (Required) The ID of the workflow to update.

**Options:**
*   `-f`, `--file`: (Required) Path to the new workflow JSON file.
*   `--env`: Environment name. Defaults to 'dev'.

**Example:**
```bash
n8n-workflow update 123 -f ./examples/updated-workflow.json --env prod
```

### `delete`

Deletes a workflow by its ID.

**Usage:**
```bash
n8n-workflow delete <workflow_id> [--env <environment>]
```

**Arguments:**
*   `<workflow_id>`: (Required) The ID of the workflow to delete.

**Options:**
*   `--env`: Environment name. Defaults to 'dev'.

**Example:**
```bash
n8n-workflow delete 123 --env prod
```

## Running Tests

To run the integrated Jest tests for the CLI tool itself:

```bash
npm test
```

## License

MIT 