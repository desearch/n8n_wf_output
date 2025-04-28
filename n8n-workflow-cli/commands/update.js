import { readFileSync } from 'fs';
import HttpClient from '../http-client.js';

export async function updateWorkflow(workflowId, filePath, env) {
    const httpClient = new HttpClient();
    // env is no longer needed for API details
    if (!workflowId || !filePath) {
        throw new Error('Workflow ID and file path are required for update.');
    }
    try {
        // Read the new workflow file
        const workflowData = JSON.parse(readFileSync(filePath, 'utf8'));

        // Update the workflow using HttpClient
        const response = await httpClient.put(`/workflows/${workflowId}`, workflowData);

        if (response.statusCode !== 200) {
            const errorMessage = response.data?.message || response.data || `Status Code ${response.statusCode}`;
            throw new Error(`Failed to update workflow ${workflowId}: ${errorMessage}`);
        }

        console.log(`Workflow ${workflowId} updated successfully from ${filePath}.`);
        return response.data; // Return the response data (often the updated workflow object)

    } catch (error) {
        // Handle file read errors separately if needed
        if (error instanceof SyntaxError) {
            console.error(`Error parsing JSON from file ${filePath}:`, error.message);
            throw new Error(`Invalid JSON format in file ${filePath}.`);
        } else if (error.code === 'ENOENT') {
             console.error(`Error reading file ${filePath}:`, error.message);
            throw new Error(`Workflow file not found at path: ${filePath}`);
        }
        // Handle API errors
        console.error(`Error updating workflow ${workflowId}:`, error.message);
        throw new Error(`Failed to update workflow ${workflowId}: ${error.message}`);
    }
}