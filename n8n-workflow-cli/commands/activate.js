// import config from '../config.js';
import HttpClient from '../http-client.js';

// Instantiate HttpClient once
// Remove instance creation at module level
// const httpClient = new HttpClient();

async function activateWorkflow(options) {
    const httpClient = new HttpClient(); // Instantiate inside function
    try {
        const { id: workflowId, env } = options;
        // env is no longer needed for API config
        if (!workflowId) {
            throw new Error('Workflow ID is required for activation.');
        }

        // Activate workflow using the new httpClient instance
        const response = await httpClient.post(`/workflows/${workflowId}/activate`);

        if (response.statusCode !== 200) {
             const errorMessage = response.data?.message || response.data || `Status Code ${response.statusCode}`;
            console.error(`Error activating workflow ${workflowId}: ${errorMessage}`);
            throw new Error(`Failed to activate workflow: ${errorMessage}`);
        }

        console.log(`Workflow ${workflowId} activated successfully.`);
        return response.data; // Return response data, likely includes activation status

    } catch (error) {
        // Log the specific error before re-throwing
        console.error(`Error activating workflow ${options.id || 'unknown ID'}:`, error.message);
        // Re-throw a potentially more informative error
        throw new Error(`Failed to activate workflow: ${error.message}`);
    }
}

export { activateWorkflow }; 