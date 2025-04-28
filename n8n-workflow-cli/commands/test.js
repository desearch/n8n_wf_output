// import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import HttpClient from '../http-client.js';

// Remove instance creation at module level
// const httpClient = new HttpClient();

// Refactored testWorkflow function using workflow ID and HttpClient
export async function testWorkflow(options) {
    const httpClient = new HttpClient(); // Instantiate inside function
    const { id: workflowId, env } = options;
    // env is no longer needed for API config

    if (!workflowId) {
        throw new Error('Workflow ID is required for testing.');
    }

    // We might need to GET the workflow first to read its test cases
    // OR assume test cases are passed in somehow. For now, let's assume
    // the `/test` endpoint handles execution without needing cases explicitly.
    // If the `/test` endpoint DOES require specific inputs, this needs adjustment.

    console.log(`Attempting to trigger test execution for workflow ID: ${workflowId}`);

    try {
        // Execute the test via the n8n API test endpoint
        // This endpoint might not require test cases if it runs a default test execution.
        // Adjust payload if the endpoint expects specific test data.
        const response = await httpClient.post(`/workflows/${workflowId}/test`, {}); // Sending empty payload for now

        // Validate response
        // The response structure from /test endpoint needs to be known.
        // Assuming it returns a success indicator or relevant test results.
        if (response.statusCode !== 200) {
             const errorMessage = response.data?.message || response.data || `Status Code ${response.statusCode}`;
            console.error(`❌ Test execution failed for workflow ${workflowId}: ${errorMessage}`);
            throw new Error(`Test execution failed: ${errorMessage}`);
        }

        console.log(`✅ Test execution successful for workflow ${workflowId}.`);
        console.log('Test result:', response.data);
        return { success: true, result: response.data };

    } catch (error) {
        console.error(`❌ Error during test execution for workflow ${workflowId}:`, error.message);
        throw new Error(`Test execution failed: ${error.message}`);
    }
}

// Remove the old testWorkflow function and its export
// async function testWorkflowOld(options) { ... }
// export { testWorkflowOld }; 