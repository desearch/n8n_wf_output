const config = require('../config.cjs');
const HttpClient = require('../http-client.cjs');

async function deleteWorkflow(options) {
    try {
        const { id, env } = options;
        const envConfig = config.environments[env];

        if (!envConfig) {
            throw new Error(`Invalid environment: ${env}`);
        }

        const httpClient = new HttpClient(envConfig);
        await httpClient.delete(`/api/v1/workflows/${id}`);
        console.log('Workflow deleted successfully');
    } catch (error) {
        console.error('Error in deleting workflow:', error.message);
        throw error;
    }
}

module.exports = { deleteWorkflow }; 