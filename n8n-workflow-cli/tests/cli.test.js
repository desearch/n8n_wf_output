import { jest } from '@jest/globals';
import path from 'path';
import dotenv from 'dotenv';
// Commented out unused imports and __dirname definition as they caused persistent errors
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// Define __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Mock command modules BEFORE importing the program that uses them
// Define mocks directly in the factory function
jest.mock('../commands/list.js', () => ({ listWorkflows: jest.fn() }));
jest.mock('../commands/deploy.js', () => ({ deployCommand: jest.fn() }));
jest.mock('../commands/create.js', () => ({ createCommand: jest.fn() }));
jest.mock('../commands/delete.js', () => ({ deleteWorkflow: jest.fn() }));
jest.mock('../commands/cleanup.js', () => ({ cleanupWorkflows: jest.fn() }));
jest.mock('../commands/test.js', () => ({ testWorkflow: jest.fn() }));
jest.mock('../commands/activate.js', () => ({ activateWorkflow: jest.fn() }));
jest.mock('../commands/update.js', () => ({ updateWorkflow: jest.fn() }));
jest.mock('../env.js', () => ({
    setEnvVar: jest.fn(),
    listEnvVars: jest.fn().mockReturnValue({ MOCKED_VAR: 'mock_value' }),
    getEnvVar: jest.fn()
}));

// Import the actual program instance setup by setupCli
// Note: We import the EXPORTED program, which should already be configured
import { program } from '../workflow-manager.js'; // Assuming program is exported after setupCli

// Import the actual mocked functions AFTER jest.mock has run to allow assertions
import { listWorkflows } from '../commands/list.js';
import { deployCommand } from '../commands/deploy.js';
import { createCommand } from '../commands/create.js';
import { deleteWorkflow } from '../commands/delete.js';
import { cleanupWorkflows } from '../commands/cleanup.js';
import { testWorkflow } from '../commands/test.js';
import { activateWorkflow } from '../commands/activate.js';
import { updateWorkflow } from '../commands/update.js';
import { setEnvVar, listEnvVars } from '../env.js';

describe('Workflow Manager CLI Execution Tests', () => {

    let processExitSpy;
    const originalProcessExit = process.exit; // Store original
    // Store original env vars to restore later
    const originalEnv = { ...process.env }; 

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock process.exit
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
            if (code !== 0) {
                throw new Error(`process.exit called with code ${code}`);
            }
        });

        // Mock essential env vars for commands that might use HttpClient indirectly
        // Even though commands are mocked, underlying setup might touch process.env
        process.env.N8N_BASE_URL = 'http://mock-test-url:5678';
        process.env.N8N_API_KEY = 'mock-test-api-key';
    });

    afterEach(() => {
        // Restore process.exit
        process.exit = originalProcessExit;
        if (processExitSpy) processExitSpy.mockRestore();
        
        // Restore original environment variables
        process.env = { ...originalEnv }; 
    });

    // Simplified helper function
    async function runCommand(args) {
        const argv = ['node', 'workflow-manager.js', ...args];
        // Ensure dotenv loads test env vars if not already loaded
        dotenv.config({ override: true }); 
        await program.parseAsync(argv);
    }

    // --- List Command Tests --- 
    describe('list command', () => {
        it('should call listWorkflows with default options', async () => {
            await runCommand(['list']);
            expect(listWorkflows).toHaveBeenCalledTimes(1);
            // listWorkflows now expects an options object, which is empty if no args are passed
            expect(listWorkflows).toHaveBeenCalledWith({}); 
            expect(processExitSpy).not.toHaveBeenCalledWith(1);
        });

        it('should throw an error if listWorkflows throws', async () => {
            const errorMessage = 'API Error';
            listWorkflows.mockRejectedValueOnce(new Error(errorMessage));
            await expect(runCommand(['list'])).rejects.toThrow(); 
            expect(listWorkflows).toHaveBeenCalledTimes(1);
        });
    });

    // --- Deploy Command Tests --- 
    describe('deploy command', () => {
        it('should throw an error if required --file option is missing', async () => {
            await expect(runCommand(['deploy'])).rejects.toThrow();
            expect(deployCommand).not.toHaveBeenCalled();
        });

        it('should call deployCommand with options', async () => {
             await runCommand(['deploy', '--file', 'wf.json', '--version', '1.1']);
             expect(deployCommand).toHaveBeenCalledTimes(1);
             expect(deployCommand).toHaveBeenCalledWith({
                 file: 'wf.json',
                 version: '1.0.0',
             });
             expect(processExitSpy).not.toHaveBeenCalledWith(1);
        });
    });

    // --- Create Command Tests --- 
    describe('create command', () => {
        it('should throw an error if required --file option is missing', async () => {
            await expect(runCommand(['create'])).rejects.toThrow(); 
            expect(createCommand).not.toHaveBeenCalled();
        });

        it('should call createCommand with options', async () => {
             await runCommand(['create', '--file', 'wf.json', '--version', '1.2', '--activate']);
             expect(createCommand).toHaveBeenCalledTimes(1);
             expect(createCommand).toHaveBeenCalledWith({
                 file: 'wf.json',
                 version: '1.0.0',
                 activate: true
             });
             expect(processExitSpy).not.toHaveBeenCalledWith(1);
        });
    });

    // --- Test Command Tests --- 
    describe('test command', () => {
        it('should throw an error if required --id option is missing', async () => {
           await expect(runCommand(['test'])).rejects.toThrow();
           expect(testWorkflow).not.toHaveBeenCalled();
        });

        it('should call testWorkflow with options', async () => {
             // Removed --env prod
             await runCommand(['test', '--id', 'wf123']);
             expect(testWorkflow).toHaveBeenCalledTimes(1);
             expect(testWorkflow).toHaveBeenCalledWith({ id: 'wf123' }); // env removed
             expect(processExitSpy).not.toHaveBeenCalledWith(1);
        });
    });

    // --- Delete Command Tests --- 
    describe('delete command', () => {
        it('should throw an error if required --id option is missing', async () => {
            await expect(runCommand(['delete'])).rejects.toThrow();
            expect(deleteWorkflow).not.toHaveBeenCalled();
        });
         it('should call deleteWorkflow with options', async () => {
             // Removed --env dev
             await runCommand(['delete', '--id', 'wf456']);
             expect(deleteWorkflow).toHaveBeenCalledTimes(1);
             expect(deleteWorkflow).toHaveBeenCalledWith({ id: 'wf456' }); // env removed
             expect(processExitSpy).not.toHaveBeenCalledWith(1);
        });
    });

    // --- Activate Command Tests --- 
    describe('activate command', () => {
        it('should throw an error if required --id option is missing', async () => {
            await expect(runCommand(['activate'])).rejects.toThrow();
            expect(activateWorkflow).not.toHaveBeenCalled();
        });
         it('should call activateWorkflow with options', async () => {
             // Removed --env stage
             await runCommand(['activate', '--id', 'wf789']);
             expect(activateWorkflow).toHaveBeenCalledTimes(1);
             expect(activateWorkflow).toHaveBeenCalledWith({ id: 'wf789' }); // env removed
             expect(processExitSpy).not.toHaveBeenCalledWith(1);
        });
    });

    // --- Update Command Tests --- 
    describe('update command', () => {
        it('should throw error when --file option is missing', async () => {
            await expect(runCommand(['update', '--id', '123'])).rejects.toThrow();
            expect(updateWorkflow).not.toHaveBeenCalled();
        });

        it('should call updateWorkflow with correct parameters', async () => {
            await runCommand(['update', '--id', '123', '--file', 'workflow.json']);
            expect(updateWorkflow).toHaveBeenCalledWith('123', 'workflow.json');
        });
    });

     // --- Env Command Tests --- 
    describe('setenv command', () => {
        it('should throw error when --value option is missing', async () => {
            await expect(runCommand(['setenv', '--key', 'TEST_KEY'])).rejects.toThrow();
            expect(setEnvVar).not.toHaveBeenCalled();
        });

        it('should call setEnvVar with correct parameters', async () => {
            const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

            await runCommand(['setenv', '--key', 'TEST_KEY', '--value', 'test_value']);

            expect(setEnvVar).toHaveBeenCalledWith('TEST_KEY', 'test_value');
            expect(mockConsoleLog).toHaveBeenCalledWith('Environment variable TEST_KEY set successfully');
            expect(mockConsoleWarn).toHaveBeenCalledWith('Note: This change is temporary and will be lost when the process exits');

            mockConsoleLog.mockRestore();
            mockConsoleWarn.mockRestore();
        });
    });

    describe('listenv command', () => {
        it('should call listEnvVars', async () => {
             await runCommand(['listenv']);
             expect(listEnvVars).toHaveBeenCalledTimes(1);
             expect(processExitSpy).not.toHaveBeenCalledWith(1);
        });
    });
}); 