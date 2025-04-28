import HttpClient from '../http-client.js';

export async function deleteWorkflow({ id: workflowId }) {
    const httpClient = new HttpClient();
    if (!workflowId) {
        throw new Error('Workflow ID is required for deletion.');
    }
    try {
        const response = await httpClient.delete(`/workflows/${workflowId}`);

        if (response.statusCode !== 200 && response.statusCode !== 204) {
            const errorMessage = response.data?.message || response.data || `Status Code ${response.statusCode}`;
            throw new Error(`Failed to delete workflow ${workflowId}: ${errorMessage}`);
        }
        
        console.log(`Workflow ${workflowId} deleted successfully.`);
        return { success: true, message: `Workflow ${workflowId} deleted successfully.` };

    } catch (error) {
        console.error(`Error deleting workflow ${workflowId}:`, error.message);
        throw new Error(`Failed to delete workflow ${workflowId}: ${error.message}`);
    }
} 