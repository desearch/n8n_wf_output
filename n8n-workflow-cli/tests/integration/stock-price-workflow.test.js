import { jest } from '@jest/globals';
import { deployCommand } from '../../commands/deploy.js';
import { testWorkflow } from '../../commands/test.js';
import { deleteWorkflow } from '../../commands/delete.js';
import { updateWorkflow } from '../../commands/update.js';
import { listWorkflows } from '../../commands/list.js';
import HttpClient from '../../http-client.js';
import path from 'path';
import dotenv from 'dotenv';

// Ensure .env is loaded for this integration test file
dotenv.config(); 

// Mock the HttpClient module
jest.mock('../../http-client.js');

// Define __dirname (assuming test runs from project root or similar)
// Alternatively, construct paths relative to process.cwd()
const __dirname = process.cwd(); // Or use a more robust method if needed

// Store original env vars
const originalEnv = { ...process.env };

describe('Stock Price Workflow Integration Tests', () => {
    let workflowId; // Will store the ID created in beforeAll
    const mockApiBaseUrl = 'http://mock-integration-url:5678';
    const mockApiKey = 'mock-integration-key';

    // Define shared mocks for HttpClient methods
    const mockGet = jest.fn();
    const mockPost = jest.fn();
    const mockPut = jest.fn();
    const mockDelete = jest.fn();

    beforeAll(async () => {
        process.env.N8N_BASE_URL = mockApiBaseUrl;
        process.env.N8N_API_KEY = mockApiKey;

        // Mock the HttpClient constructor specifically for the deployCommand call
        HttpClient.mockImplementationOnce(() => ({
            post: jest.fn().mockResolvedValueOnce({ 
                statusCode: 201, 
                data: { id: 'test-workflow-id-from-beforeAll' } 
            }),
            // Add other methods if deployCommand uses them
            get: jest.fn(), 
            put: jest.fn(),
            delete: jest.fn()
        }));

        workflowId = await deployCommand({
            file: path.join(__dirname, 'examples/stock-price-workflow.json'),
            version: '1.0.0'
        });
        console.log(`Deployed test workflow with ID: ${workflowId}`);
        
        // Clear the constructor mock used only for deployCommand
        HttpClient.mockClear(); 
    });

    afterAll(async () => {
        if (workflowId) {
            console.log(`Cleaning up test workflow with ID: ${workflowId}`);
            // Mock the HttpClient constructor specifically for the deleteWorkflow call
            HttpClient.mockImplementationOnce(() => ({
                 delete: jest.fn().mockResolvedValueOnce({ statusCode: 204 }),
                 // Add other methods if needed
                 get: jest.fn(), post: jest.fn(), put: jest.fn()
            }));
            try {
                await deleteWorkflow({ id: workflowId });
                console.log(`Successfully cleaned up workflow ${workflowId}`);
            } catch (error) {
                console.error(`Error during cleanup of workflow ${workflowId}:`, error.message);
            }
             // Clear the constructor mock used only for deleteWorkflow
            HttpClient.mockClear(); 
        }
        process.env = { ...originalEnv }; 
    });

    beforeEach(() => {
        // Reset shared mock function calls and implementations
        mockGet.mockClear().mockReset();
        mockPost.mockClear().mockReset();
        mockPut.mockClear().mockReset();
        mockDelete.mockClear().mockReset();

        HttpClient.mockClear();
        // Mock the constructor to return our object with explicitly async shared mocked methods
        HttpClient.mockImplementation(() => {
            return {
                get: async (...args) => mockGet(...args),
                post: async (...args) => mockPost(...args),
                put: async (...args) => mockPut(...args),
                delete: async (...args) => mockDelete(...args),
            };
        });

        // --- Default Mock Implementations for this test suite ---
        // Mock POST /workflows/{id}/test
        mockPost.mockImplementation(async (url, data) => {
             if (url.includes('/test')) {
                const symbol = data?.symbol;
                if (symbol === 'INVALID') {
                    return Promise.resolve({ statusCode: 400, data: { code: 400, message: 'Invalid symbol' } });
                } else if (symbol) {
                     return Promise.resolve({ statusCode: 200, data: { price: '150.50', symbol: symbol } });
                }
             } 
             if (url === '/workflows') { // Workflow creation
                 return Promise.resolve({ statusCode: 201, data: { id: `new-mock-id-${Date.now()}` } });
             }
             // Rate limit simulation (example)
             if (url.includes('/rate-limit-test')) {
                 return Promise.resolve({ statusCode: 429, data: { message: 'Rate limit exceeded' } });
             }
             return Promise.reject(new Error(`HttpClient POST mock default implementation unhandled for ${url}`));
        });
         // Mock GET /workflows
         mockGet.mockImplementation(async (url) => {
            if (url === '/workflows') {
                return Promise.resolve({ 
                    statusCode: 200, 
                    data: workflowId ? [{ id: workflowId, name: 'Stock Price Tracker' }] : [] // Return list including the one from beforeAll
                 });
             }
             return Promise.reject(new Error(`HttpClient GET mock default implementation unhandled for ${url}`));
         });
         // Mock PUT /workflows/{id}
         mockPut.mockImplementation(async (url, data) => {
            const idMatch = url.match(/\/workflows\/(.+)/);
             if (idMatch && idMatch[1]) {
                 return Promise.resolve({ statusCode: 200, data: { id: idMatch[1], ...data } });
             }
             return Promise.reject(new Error(`HttpClient PUT mock default implementation unhandled for ${url}`));
         });
         // Mock DELETE /workflows/{id}
         mockDelete.mockImplementation(async (url) => {
             const idMatch = url.match(/\/workflows\/(.+)/);
             if (idMatch && idMatch[1]) {
                return Promise.resolve({ statusCode: 204 }); 
             }
             return Promise.reject(new Error(`HttpClient DELETE mock default implementation unhandled for ${url}`));
         });
    });

    describe('Workflow Execution Tests (using test command)', () => {
        it('should return valid stock price for AAPL via test command', async () => {
             // Override default mockPost for this specific test case if needed, or rely on default
             mockPost.mockResolvedValueOnce({ 
                 statusCode: 200, 
                 data: { symbol: 'AAPL', price: '150.00' } 
             });
            const result = await testWorkflow({ id: workflowId });
            expect(result.success).toBe(true);
            expect(result.result).toEqual({ symbol: 'AAPL', price: '150.00' });
            expect(mockPost).toHaveBeenCalledWith(`/workflows/${workflowId}/test`, {});
        });

        it('should handle invalid stock symbol via test command', async () => {
            mockPost.mockResolvedValueOnce({ 
                 statusCode: 400, 
                 data: { message: 'Invalid Symbol Error' } 
             });
            await expect(testWorkflow({ id: workflowId }))
                .rejects.toThrow('Test execution failed: Invalid Symbol Error');
            expect(mockPost).toHaveBeenCalledWith(`/workflows/${workflowId}/test`, {});
        });

        it('should handle API rate limiting via test command', async () => {
             mockPost.mockResolvedValueOnce({
                statusCode: 429,
                data: { message: 'Rate limit exceeded' }
            });
            await expect(testWorkflow({ id: workflowId }))
                .rejects.toThrow('Test execution failed: Rate limit exceeded');
             expect(mockPost).toHaveBeenCalledWith(`/workflows/${workflowId}/test`, {});
        });
    });

    describe('Workflow Management Tests', () => {
        it('should update workflow successfully using update command', async () => {
            const updateFilePath = path.join(__dirname, 'examples/updated-workflow.json'); 
            const expectedUpdatedData = { id: workflowId, name: 'Updated Stock Price Tracker' }; 
            mockPut.mockResolvedValueOnce({
                statusCode: 200,
                data: expectedUpdatedData
            });
            const result = await updateWorkflow(workflowId, updateFilePath);
            expect(result.name).toBe('Updated Stock Price Tracker');
            expect(mockPut).toHaveBeenCalledTimes(1);
        });

        it('should list workflows including the created one using list command', async () => {
             const mockWorkflowList = [{ id: workflowId, name: 'Stock Price Tracker' }];
             mockGet.mockResolvedValueOnce({
                statusCode: 200,
                data: mockWorkflowList
            });
            const result = await listWorkflows({});
            expect(result).toEqual(mockWorkflowList);
            expect(mockGet).toHaveBeenCalledTimes(1);
        });
    });
});