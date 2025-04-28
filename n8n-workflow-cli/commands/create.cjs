const fs = require('fs');
const config = require('../config.cjs');
const HttpClient = require('../http-client.cjs');

async function createWorkflow(options) {
    try {
        const { file, env } = options;
        const envConfig = config.environments[env];

        if (!envConfig) {
            throw new Error(`Invalid environment: ${env}`);
        }

        const httpClient = new HttpClient(envConfig);
        const workflowData = JSON.parse(fs.readFileSync(file, 'utf8'));

        const response = await httpClient.post('/api/v1/workflows', workflowData);
        return response.data;
    } catch (error) {
        console.error('Error in creating workflow:', error.message);
        throw error;
    }
}

async function createCommand(options) {
    try {
        const workflow = await createWorkflow(options);
        console.log('Workflow created successfully:', workflow.id);
        
        if (options.activate) {
            // Activate the workflow if requested
            const envConfig = config.environments[options.env];
            const httpClient = new HttpClient(envConfig);
            await httpClient.post(`/api/v1/workflows/${workflow.id}/activate`);
            console.log('Workflow activated successfully');
        }
        
        return workflow;
    } catch (error) {
        console.error('Error in create command:', error.message);
        throw error;
    }
}

module.exports = {
    createWorkflow,
    createCommand
}; 