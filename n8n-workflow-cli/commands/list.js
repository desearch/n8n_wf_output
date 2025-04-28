import HttpClient from '../http-client.js';
// Remove config import as HttpClient handles config internally
// import config from '../config.js'; 

export async function listWorkflows(options) {
    const httpClient = new HttpClient(); // Instantiate inside function
    // The 'env' option is no longer needed for URL/key selection
    // as HttpClient reads directly from process.env
    try {
        const response = await httpClient.get('/workflows');

        if (response.statusCode !== 200) {
            // Attempt to get a more detailed error message
            const errorMessage = response.data?.message || response.data || `Status Code ${response.statusCode}`;
            throw new Error(`Failed to list workflows: ${errorMessage}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error in listWorkflows:", error.message);
        // Re-throw the error or handle it as appropriate
        throw error;
    }
} 