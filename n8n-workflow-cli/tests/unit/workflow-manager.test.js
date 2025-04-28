import { jest } from '@jest/globals';
import { deployCommand } from '../../commands/deploy.js';
import { testWorkflow } from '../../commands/test.js';
import { listWorkflows } from '../../commands/list.js';
import { deleteWorkflow } from '../../commands/delete.js';
import { updateWorkflow } from '../../commands/update.js';
import HttpClient from '../../http-client.js';
import { join } from 'path';

// Define __dirname for ES modules if not already globally defined
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Mock the HttpClient module
jest.mock('../../http-client.js');

// Store original env vars
const originalEnv = { ...process.env };

describe('Workflow Manager Commands Unit Tests', () => {
    // Define paths relative to this test file's directory
    // Assuming fixtures are in ../fixtures relative to this file
    // Escape backslashes in paths
    const testWorkflowPath = join(__dirname, '..\\fixtures\\test-workflow.json');
    const updatedWorkflowPath = join(__dirname, '..\\fixtures\\updated-workflow.json');

    // Define mocks for HttpClient methods
    const mockGet = jest.fn();
    const mockPost = jest.fn();
    const mockPut = jest.fn();
    const mockDelete = jest.fn();

    beforeAll(() => {
        // Set required env vars for HttpClient constructor before any test runs
        process.env.N8N_BASE_URL = 'http://mock-unit-url:5678';
        process.env.N8N_API_KEY = 'mock-unit-api-key';
    });

    afterAll(() => {
        // Restore original environment variables
        process.env = { ...originalEnv }; 
    });

    beforeEach(() => {
        // Clear previous mock calls and implementations
        mockGet.mockClear().mockReset();
        mockPost.mockClear().mockReset();
        mockPut.mockClear().mockReset();
        mockDelete.mockClear().mockReset();

        HttpClient.mockClear();
        // Mock the constructor to return our object with explicitly async mocked methods
        HttpClient.mockImplementation(() => {
            return {
                get: async (...args) => mockGet(...args),
                post: async (...args) => mockPost(...args),
                put: async (...args) => mockPut(...args),
                delete: async (...args) => mockDelete(...args),
            };
        });
    });

    describe('deployCommand', () => {
        it('should deploy a workflow successfully', async () => {
            const mockWorkflow = { id: 'test-workflow-id', name: 'Test Workflow' };
            // Mock the post method directly
            mockPost.mockResolvedValueOnce({ 
                statusCode: 201, 
                data: mockWorkflow 
            });

            // Call deployCommand without env
            const result = await deployCommand({
                file: testWorkflowPath,
                version: '1.0.0'
            });

            expect(result).toBe('test-workflow-id');
            expect(mockPost).toHaveBeenCalledTimes(1);
            // Add check for payload if necessary
        });

        it('should handle deployment errors (no ID in response)', async () => {
             // Mock post response with no ID
             mockPost.mockResolvedValueOnce({
                statusCode: 201,
                data: {} // No ID
            });

            // Call deployCommand without env
            await expect(deployCommand({
                file: testWorkflowPath
            })).rejects.toThrow('Workflow creation succeeded but response did not contain an ID.');
            expect(mockPost).toHaveBeenCalledTimes(1);
        });
        
        it('should handle API errors during deployment', async () => {
             // Mock post rejection
             mockPost.mockRejectedValueOnce(new Error('API Connection Refused'));

            await expect(deployCommand({
                file: testWorkflowPath
            })).rejects.toThrow('Deployment failed: API Connection Refused');
            expect(mockPost).toHaveBeenCalledTimes(1);
        });
    });

    describe('testWorkflow', () => {
        it('should run test successfully', async () => {
             mockPost.mockResolvedValueOnce({
                statusCode: 200,
                data: { success: true }
            });

            // Call testWorkflow with { id }
            const result = await testWorkflow({ id: 'wf123' });
            expect(result).toEqual({ success: true, result: { success: true } });
            expect(mockPost).toHaveBeenCalledTimes(1);
            expect(mockPost).toHaveBeenCalledWith('/workflows/wf123/test', {});
        });

        it('should handle test failures from API', async () => {
            // Mock API returning non-200 status
             mockPost.mockResolvedValueOnce({
                statusCode: 500,
                data: { message: 'Internal Server Error' }
            });

            await expect(testWorkflow({ id: 'wf123' }))
                .rejects.toThrow('Test execution failed: Internal Server Error');
             expect(mockPost).toHaveBeenCalledTimes(1);
        });
        
         it('should handle test command errors (e.g., connection error)', async () => {
            // Mock API call rejection
             mockPost.mockRejectedValueOnce(new Error('Network Error'));

            await expect(testWorkflow({ id: 'wf123' }))
                .rejects.toThrow('Test execution failed: Network Error');
             expect(mockPost).toHaveBeenCalledTimes(1);
        });
    });

    describe('listWorkflows', () => {
        it('should list workflows successfully', async () => {
            const mockWorkflows = [{ id: 'wf1', name: 'W1' }, { id: 'wf2', name: 'W2' }];
             mockGet.mockResolvedValueOnce({
                statusCode: 200,
                data: mockWorkflows
            });

            // Call listWorkflows without env
            const result = await listWorkflows({});
            expect(result).toEqual(mockWorkflows);
            expect(mockGet).toHaveBeenCalledTimes(1);
            expect(mockGet).toHaveBeenCalledWith('/workflows');
        });
        
         it('should handle errors during list', async () => {
             mockGet.mockRejectedValueOnce(new Error('List Network Error'));

            await expect(listWorkflows({})).rejects.toThrow('List Network Error');
             expect(mockGet).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteWorkflow', () => {
        it('should delete workflow successfully', async () => {
             mockDelete.mockResolvedValueOnce({ statusCode: 204, data: '' }); // 204 No Content

            // Call deleteWorkflow with { id }
            await deleteWorkflow({ id: 'test-workflow-id' });
            expect(mockDelete).toHaveBeenCalledTimes(1);
            expect(mockDelete).toHaveBeenCalledWith('/workflows/test-workflow-id');
        });

        it('should handle deletion errors (e.g., not found)', async () => {
            // Mock API returning 404
             mockDelete.mockResolvedValueOnce({
                statusCode: 404,
                data: { message: 'Workflow not found' }
            });

            await expect(deleteWorkflow({ id: 'test-workflow-id' }))
                .rejects.toThrow('Failed to delete workflow test-workflow-id: Workflow not found');
            expect(mockDelete).toHaveBeenCalledTimes(1);
        });
         
         it('should handle network errors during deletion', async () => {
            // Mock API call rejection
             mockDelete.mockRejectedValueOnce(new Error('Delete Network Error'));

            await expect(deleteWorkflow({ id: 'test-workflow-id' }))
                .rejects.toThrow('Failed to delete workflow test-workflow-id: Delete Network Error');
            expect(mockDelete).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateWorkflow', () => {
        it('should update workflow successfully', async () => {
            const mockUpdatedWorkflow = { id: 'test-workflow', name: 'Updated Name' };
            mockPut.mockResolvedValueOnce({
                statusCode: 200,
                data: mockUpdatedWorkflow
            });

            // Call updateWorkflow with id, file (no env)
            const result = await updateWorkflow('test-workflow', updatedWorkflowPath);
            expect(result).toEqual(mockUpdatedWorkflow);
            expect(mockPut).toHaveBeenCalledTimes(1);
            // Check payload if needed
            // expect(mockHttpClientInstance.put).toHaveBeenCalledWith('/workflows/test-workflow', expect.any(Object)); 
        });

         it('should handle update errors from API', async () => {
             mockPut.mockResolvedValueOnce({
                statusCode: 400,
                data: { message: 'Invalid data' }
            });

            await expect(updateWorkflow('test-workflow', updatedWorkflowPath))
                .rejects.toThrow('Failed to update workflow test-workflow: Invalid data');
            expect(mockPut).toHaveBeenCalledTimes(1);
        });

         it('should handle network errors during update', async () => {
             mockPut.mockRejectedValueOnce(new Error('Update Network Error'));

            await expect(updateWorkflow('test-workflow', updatedWorkflowPath))
                .rejects.toThrow('Failed to update workflow test-workflow: Update Network Error');
            expect(mockPut).toHaveBeenCalledTimes(1);
        });
    });
}); 