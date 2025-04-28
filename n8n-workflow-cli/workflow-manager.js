#!/usr/bin/env node

import { program as baseProgram } from 'commander';
import inquirer from 'inquirer';
import config from './config.js';
import { createCommand } from './commands/create.js';
import { listWorkflows } from './commands/list.js';
import { deleteWorkflow } from './commands/delete.js';
import { cleanupWorkflows } from './commands/cleanup.js';
import { testWorkflow as testWorkflowCommand } from './commands/test.js';
import { activateWorkflow } from './commands/activate.js';
import { setEnvVar, getEnvVar, listEnvVars } from './env.js';
import { deployCommand } from './commands/deploy.js';
import { updateWorkflow } from './commands/update.js';
import { fileURLToPath } from 'url';
import { basename } from 'path';
import dotenv from 'dotenv';

// Helper functions for interactive mode
async function handleCreate() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'file',
            message: 'Enter workflow file path:',
            default: config.defaultWorkflowFile
        },
        {
            type: 'input',
            name: 'version',
            message: 'Enter version number:',
            default: config.defaultVersion
        },
        {
            type: 'confirm',
            name: 'activate',
            message: 'Activate workflow after creation?',
            default: true
        }
    ]);

    await createCommand(answers);
}

async function handleList() {
    await listWorkflows({});
}

async function handleTest() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter workflow ID:',
            validate: input => input ? true : 'ID is required'
        }
    ]);

    await testWorkflowCommand(answers);
}

async function handleDelete() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter workflow ID:',
            validate: input => input ? true : 'ID is required'
        }
    ]);

    await deleteWorkflow(answers);
}

async function handleCleanup() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'pattern',
            message: 'Enter pattern to match workflow names:',
            default: config.defaultWorkflowPattern
        },
        {
            type: 'confirm',
            name: 'dryRun',
            message: 'Preview changes without applying them?',
            default: true
        },
        {
            type: 'confirm',
            name: 'force',
            message: 'Skip confirmation?',
            default: false
        }
    ]);

    await cleanupWorkflows(answers);
}

async function handleActivate() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter workflow ID:',
            validate: input => input ? true : 'ID is required'
        }
    ]);

    await activateWorkflow(answers);
}

async function handleSetEnv() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'key',
            message: 'Enter environment variable key:',
            validate: input => input ? true : 'Key is required'
        },
        {
            type: 'input',
            name: 'value',
            message: 'Enter environment variable value:',
            validate: input => input !== undefined ? true : 'Value is required'
        }
    ]);

    await setEnvVar(answers.key, answers.value);
}

async function handleDeploy() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'file',
            message: 'Enter workflow file path:',
            default: config.defaultWorkflowFile
        },
        {
            type: 'input',
            name: 'version',
            message: 'Enter version number:',
            default: config.defaultVersion
        }
    ]);

    try {
        console.log('Starting deployment and activation process...');
        
        // Deploy the workflow
        console.log('Deploying workflow...');
        const deployOptions = {
            file: answers.file,
            version: answers.version,
            update: false
        };
        const workflowId = await deployCommand(deployOptions);

        // Activate the workflow
        console.log('Activating workflow...');
        const activateOptions = { id: workflowId };
        await activateWorkflow(activateOptions);

        console.log('✅ Workflow deployed and activated successfully!');
        console.log(`Workflow ID: ${workflowId}`);
    } catch (error) {
        console.error('❌ Error during deployment and activation:');
        console.error(error.message);
        process.exit(1);
    }
}

async function handleUpdate() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter workflow ID:',
            validate: input => input ? true : 'ID is required'
        },
        {
            type: 'input',
            name: 'file',
            message: 'Enter new workflow JSON file path:',
            validate: input => input ? true : 'File path is required'
        }
    ]);

    try {
        if (!answers.id || !answers.file) {
            console.error('Error: Both --id and --file options are required');
            process.exit(1);
            return;
        }
        await updateWorkflow(answers.id, answers.file);
        console.log(`Workflow ${answers.id} updated successfully`);
    } catch (error) {
        console.error('❌ Error updating workflow:');
        console.error(error.message);
        process.exit(1);
    }
}

function setupCli(programInstance) {
    programInstance
        .name('n8n-workflow-manager')
        .description('CLI tool for managing n8n workflows (using .env for config)')
        .version('1.0.0');

    // Interactive mode command
    programInstance
        .command('interactive')
        .description('Start interactive workflow management')
        .action(async () => {
            while (true) {
                const { action } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        message: 'What would you like to do?',
                        choices: [
                            { name: 'Create new workflow', value: 'create' },
                            { name: 'List workflows', value: 'list' },
                            { name: 'Test workflow', value: 'test' },
                            { name: 'Delete workflow', value: 'delete' },
                            { name: 'Cleanup workflows', value: 'cleanup' },
                            { name: 'Activate workflow', value: 'activate' },
                            { name: 'Set environment variable', value: 'setenv' },
                            { name: 'List environment variables', value: 'listenv' },
                            { name: 'Deploy and activate workflow', value: 'deploy' },
                            { name: 'Update workflow', value: 'update' },
                            { name: 'Exit', value: 'exit' }
                        ]
                    }
                ]);

                if (action === 'exit') {
                    console.log('Goodbye!');
                    process.exit(0);
                }

                try {
                    switch (action) {
                        case 'create':
                            await handleCreate();
                            break;
                        case 'list':
                            await handleList();
                            break;
                        case 'test':
                            await handleTest();
                            break;
                        case 'delete':
                            await handleDelete();
                            break;
                        case 'cleanup':
                            await handleCleanup();
                            break;
                        case 'activate':
                            await handleActivate();
                            break;
                        case 'setenv':
                            await handleSetEnv();
                            break;
                        case 'listenv':
                            listEnvVars();
                            break;
                        case 'deploy':
                            await handleDeploy();
                            break;
                        case 'update':
                            await handleUpdate();
                            break;
                    }
                } catch (error) {
                    console.error('Error:', error.message);
                }
            }
        });

    // Command-line mode
    programInstance
        .command('create')
        .description('Create a new workflow via API')
        .requiredOption('--file <file>', 'Workflow JSON file')
        .option('--version <version>', 'Version number', config.defaultVersion)
        .option('--activate', 'Activate workflow after creation')
        .action(async (options) => {
            try {
                await createCommand(options);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('list')
        .description('List workflows')
        .action(async (options) => {
            try {
                await listWorkflows(options);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('deploy')
        .description('Deploy a workflow from a file (creates workflow via API)')
        .requiredOption('-f, --file <file>', 'Workflow JSON file to deploy')
        .option('--version <version>', 'Version (optional for deploy)', config.defaultVersion)
        .action(async (options) => {
            try {
                await deployCommand(options);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('test')
        .description('Test a workflow via API endpoint')
        .requiredOption('--id <id>', 'Workflow ID')
        .action(async (options) => {
            try {
                await testWorkflowCommand(options);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('delete')
        .description('Delete a workflow')
        .requiredOption('--id <id>', 'Workflow ID')
        .action(async (options) => {
            try {
                await deleteWorkflow(options);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('cleanup')
        .description('Cleanup workflows by name pattern')
        .requiredOption('--pattern <pattern>', 'Pattern to match workflow names')
        .option('--dry-run', 'Preview changes without applying them')
        .option('--force', 'Skip confirmation')
        .action(async (options) => {
            try {
                await cleanupWorkflows(options);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('activate')
        .description('Activate a workflow')
        .requiredOption('--id <id>', 'Workflow ID')
        .action(async (options) => {
            try {
                await activateWorkflow(options);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('setenv')
        .description('Set an environment variable')
        .requiredOption('--key <key>', 'Environment variable key')
        .requiredOption('--value <value>', 'Environment variable value')
        .hook('preAction', (thisCommand) => {
            const options = thisCommand.opts();
            // Validate key format (uppercase letters, numbers, underscores)
            if (!/^[A-Z0-9_]+$/.test(options.key)) {
                console.error('Error: Key must contain only uppercase letters, numbers, and underscores');
                process.exit(1);
            }
            // Validate value is not empty
            if (!options.value || options.value.trim() === '') {
                console.error('Error: Value cannot be empty');
                process.exit(1);
            }
        })
        .action(async (options) => {
            try {
                await setEnvVar(options.key, options.value);
                console.log(`Environment variable ${options.key} set successfully`);
                console.warn('Note: This change is temporary and will be lost when the process exits');
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('listenv')
        .description('List relevant environment variables')
        .action(() => {
            try {
                listEnvVars();
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    programInstance
        .command('update')
        .description('Update an existing workflow')
        .requiredOption('--id <id>', 'Workflow ID')
        .requiredOption('--file <file>', 'Path to workflow file')
        .hook('preAction', (thisCommand) => {
            const options = thisCommand.opts();
            if (!options.id || !options.file) {
                console.error('Error: Both --id and --file options are required');
                process.exit(1);
            }
        })
        .action(async (options) => {
            try {
                await updateWorkflow(options.id, options.file);
                console.log(`Workflow ${options.id} updated successfully`);
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

    return programInstance;
}

// Configure the program instance by calling the setup function
const program = setupCli(baseProgram);

// Run parseAsync only if not in a Jest test environment
if (process.env.JEST_WORKER_ID === undefined) {
    dotenv.config();
    program.parseAsync(process.argv);
}

// Export the configured program for testing and potentially other uses
export { program, setupCli };

// Keep original export if needed (though testWorkflowCommand is likely better)
export { testWorkflowCommand as testWorkflow }; 