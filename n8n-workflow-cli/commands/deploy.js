import { readFileSync } from 'fs';
import HttpClient from '../http-client.js';
// Remove axios and config
// import axios from 'axios';
// import config from '../config.js';

// Remove instance creation at module level
// const httpClient = new HttpClient();

// Helper function to convert name-based connections to ID-based
// Keep this as it seems necessary for the API payload format
function transformConnections(nodes, connections) {
    const nodeIdMap = nodes.reduce((acc, node) => {
        // Use node.name as the key and node.id as the value
        acc[node.name] = node.id;
        return acc;
    }, {});

    const newConnections = {};
    for (const sourceNodeName in connections) {
        const sourceNodeId = nodeIdMap[sourceNodeName];
        if (!sourceNodeId) {
            console.warn(`Could not find node ID for source node name: ${sourceNodeName}`);
            continue;
        }

        newConnections[sourceNodeId] = { main: [] };

        const outputConnections = connections[sourceNodeName].main;
        if (outputConnections && Array.isArray(outputConnections)) {
            outputConnections.forEach(outputGroup => {
                const newOutputGroup = [];
                if (Array.isArray(outputGroup)) {
                    outputGroup.forEach(connection => {
                        const targetNodeId = nodeIdMap[connection.node];
                        if (!targetNodeId) {
                            console.warn(`Could not find node ID for target node name: ${connection.node}`);
                            return;
                        }
                        newOutputGroup.push({ ...connection, node: targetNodeId });
                    });
                }
                if (newOutputGroup.length > 0) {
                    newConnections[sourceNodeId].main.push(newOutputGroup);
                }
            });
        }
    }
    return newConnections;
}

export async function deployCommand(options) {
    const httpClient = new HttpClient(); // Instantiate inside function
    // env is no longer needed for API config
    const { file, version = '1.0.0', update = false } = options;

    if (!file) {
        throw new Error('Workflow file path is required for deployment.');
    }

    try {
        // Read and parse workflow file
        const workflowJsonString = readFileSync(file, 'utf8');
        const workflow = JSON.parse(workflowJsonString);

        // Remove the id field for creation, n8n will assign one
        delete workflow.id;

        // Update workflow name with version (Optional, consider if needed)
        // workflow.name = `${workflow.name} v${version}`;

        // Transform connections from names to IDs for the API payload
        const transformedConnections = transformConnections(workflow.nodes, workflow.connections);
        workflow.connections = transformedConnections;

        console.log(`Attempting to deploy workflow from ${file}...`);

        // Deploy workflow using HttpClient
        // The API endpoint for creation is typically just /workflows
        const response = await httpClient.post('/workflows', workflow);

        if (response.statusCode !== 201 && response.statusCode !== 200) { // 201 Created is standard, 200 might also occur
            const errorMessage = response.data?.message || response.data || `Status Code ${response.statusCode}`;
            console.error(`Error deploying workflow from ${file}: ${errorMessage}`);
            throw new Error(`Deployment failed: ${errorMessage}`);
        }

        // Check if response.data exists and has an id
        if (!response.data || !response.data.id) {
             console.error('Workflow creation response did not contain an ID.', response.data);
            throw new Error('Workflow creation succeeded but response did not contain an ID.');
        }

        const workflowId = response.data.id;
        console.log(`Workflow created successfully with ID: ${workflowId}.`);

        // Note: Activation is handled separately by the 'activate' command

        return workflowId; // Return the ID of the created workflow

    } catch (error) {
         // Handle file read/parse errors
        if (error instanceof SyntaxError) {
            console.error(`Error parsing JSON from file ${file}:`, error.message);
            throw new Error(`Invalid JSON format in file ${file}.`);
        } else if (error.code === 'ENOENT') {
             console.error(`Error reading file ${file}:`, error.message);
            throw new Error(`Workflow file not found at path: ${file}`);
        }
        // Handle API errors or other issues
        console.error(`Error deploying workflow from ${file}:`, error.message);
        // Re-throw a potentially more informative error
        throw new Error(`Deployment failed: ${error.message}`);
    }
}

// Keep the named export for consistency, remove default export if not used elsewhere
// export default {
//     deployCommand
// }; 