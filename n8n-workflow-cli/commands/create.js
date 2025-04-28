import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import HttpClient from '../http-client.js';

// This function seems to scaffold a local project, not interact with the API directly.
// Keep it for now, but it's not what the 'create' CLI command currently uses.
async function createWorkflow(options) {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter workflow name:',
                default: options.name,
                validate: input => input ? true : 'Name is required'
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter workflow description:',
                default: options.description
            }
        ]);

        const workflowDir = path.join(process.cwd(), answers.name);
        await fs.ensureDir(workflowDir);

        // Create workflow.json (This needs a template or more structure)
        const workflowJson = {
            name: answers.name,
            description: answers.description,
            // ... potentially add default nodes/connections from a template
            nodes: [],
            connections: {}
        };
        await fs.writeJson(path.join(workflowDir, 'workflow.json'), workflowJson, { spaces: 2 });

        // These templates were likely in the old config, need replacement or removal
        // // Create docker-compose.yml
        // await fs.writeJson(path.join(workflowDir, 'docker-compose.yml'), /* config.dockerComposeTemplate */ {}, { spaces: 2 });
        // // Create .gitignore
        // await fs.writeFile(
        //   path.join(workflowDir, '.gitignore'),
        //   /* config.gitignoreTemplate */ 'node_modules\n.env'
        // );

        console.log(`✅ Workflow project "${answers.name}" created successfully!`);
        console.log(`📁 Project directory: ${workflowDir}`);
        console.log('\nNext steps:');
        console.log('1. cd into the project directory');
        // console.log('2. Run "docker-compose up -d" to start n8n'); // If docker setup is included
        // console.log(`3. Access n8n at ${process.env.N8N_BASE_URL}`); // Use env var

    } catch (error) {
        console.error('❌ Error creating workflow project structure:', error.message);
        // Don't exit here, let the caller handle it
        throw error; 
    }
}

// Refactored createCommand to use shared HttpClient
async function createCommand(options) {
    const httpClient = new HttpClient(); // Instantiate inside function
    try {
        // env is no longer needed for API config
        const { file, version, activate } = options;

        if (!file) {
            throw new Error('Workflow file path is required for creation.');
        }
        
        // Read workflow file
        console.log(`Reading workflow file: ${file}`);
        const workflowJson = await fs.readJson(file);
        console.log('Successfully read workflow file.');

        // Update workflow name with version (Optional)
        // const originalName = workflowJson.name;
        // workflowJson.name = `${originalName} v${version || '1.0.0'}`;
        // console.log(`Updated workflow name to: ${workflowJson.name}`);

        // NOTE: Transformation of connections might be needed here too, like in deployCommand
        // If the file format uses names and API expects IDs, add transformConnections call here.

        // Create workflow using API
        console.log('Creating workflow via API...');
        const response = await httpClient.post('/workflows', workflowJson);

        if (response.statusCode !== 201 && response.statusCode !== 200) {
            const errorMessage = response.data?.message || response.data || `Status Code ${response.statusCode}`;
            console.error(`Error creating workflow from ${file}: ${errorMessage}`);
            throw new Error(`Workflow creation failed: ${errorMessage}`);
        }
        
        if (!response.data || !response.data.id) {
            console.error('Workflow creation response did not contain an ID.', response.data);
            throw new Error('Workflow creation succeeded but response did not contain an ID.');
        }

        const workflowId = response.data.id;
        console.log(`Successfully created workflow with ID: ${workflowId}`);

        // Activate workflow if requested
        if (activate) {
            console.log(`Activating workflow with ID: ${workflowId}...`);
            // Use the separate activateWorkflow function for consistency?
            // Or call API directly here:
            const activateResponse = await httpClient.post(`/workflows/${workflowId}/activate`);
            if (activateResponse.statusCode !== 200) {
                 const activateErrorMessage = activateResponse.data?.message || activateResponse.data || `Status Code ${activateResponse.statusCode}`;
                 console.error(`Failed to activate workflow ${workflowId}: ${activateErrorMessage}`);
                 // Decide if activation failure should throw error or just warn
                 console.warn(`Workflow ${workflowId} created but activation failed: ${activateErrorMessage}`);
            } else {
                console.log(`Successfully activated workflow ${workflowId}`);
            }
        }

        return workflowId;

    } catch (error) {
         // Handle file read/parse errors
        if (error instanceof SyntaxError) {
            console.error(`Error parsing JSON from file ${options.file}:`, error.message);
            throw new Error(`Invalid JSON format in file ${options.file}.`);
        } else if (error.code === 'ENOENT') {
             console.error(`Error reading file ${options.file}:`, error.message);
            throw new Error(`Workflow file not found at path: ${options.file}`);
        }
        // Handle API or other errors
        console.error('Error in create command:', error.message);
        // Avoid logging full stack in production, message should be enough
        // console.error('Error stack:', error.stack); 
        throw new Error(`Workflow creation failed: ${error.message}`);
    }
}

// Export only createCommand as it's used by the CLI
export { createCommand }; 
// Keep createWorkflow export if it's intended to be used elsewhere, otherwise remove
// export { createWorkflow }; 