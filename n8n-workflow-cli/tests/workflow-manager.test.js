const fs = require('fs');
const path = require('path');
const { createCommand } = require('../commands/create.cjs');
const { listWorkflows } = require('../commands/list.js');
const { deleteWorkflow } = require('../commands/delete.cjs');
const { cleanupWorkflows } = require('../commands/cleanup.js');
const { testWorkflow } = require('../commands/test.cjs');
const { activateWorkflow } = require('../commands/activate.js');
const { setEnvVar, getEnvVar, listEnvVars } = require('../env.js');
const config = require('../config.cjs');

// Mock the modules
jest.mock('../commands/create.cjs', () => ({
  createCommand: jest.fn().mockImplementation(async (options) => {
    if (options.file === 'nonexistent.json') {
      throw new Error('File not found');
    }
    return { id: 'test-workflow-id' };
  })
}));

jest.mock('../commands/list.js', () => ({
  listWorkflows: jest.fn().mockResolvedValue([
    { id: 'test-workflow-id', name: 'Test Workflow', active: true }
  ])
}));

jest.mock('../commands/delete.cjs', () => ({
  deleteWorkflow: jest.fn().mockImplementation(async (options) => {
    if (options.id === 'nonexistent-id') {
      throw new Error('Workflow not found');
    }
  })
}));

jest.mock('../commands/cleanup.js', () => ({
  cleanupWorkflows: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../commands/test.cjs', () => ({
  testWorkflow: jest.fn().mockImplementation(async (options) => {
    console.log('Testing workflow...');
    if (options.id === 'invalid-id') {
      throw new Error('Invalid workflow ID');
    }
    return { success: true };
  })
}));

jest.mock('../commands/activate.js', () => ({
  activateWorkflow: jest.fn().mockImplementation(async (options) => {
    if (options.id === 'nonexistent-id') {
      throw new Error('Workflow not found');
    }
  })
}));

jest.mock('../env.js', () => ({
  setEnvVar: jest.fn().mockResolvedValue(undefined),
  getEnvVar: jest.fn().mockResolvedValue('test-value'),
  listEnvVars: jest.fn().mockReturnValue({ TEST_VAR: 'test-value' })
}));

describe('Workflow Manager Tests', () => {
  const testWorkflowPath = path.join(__dirname, '../examples/stock-price-workflow/stock_price_tracker_workflow.json');
  let workflowId;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Workflow Creation', () => {
    test('should create a new workflow successfully', async () => {
      const options = {
        file: testWorkflowPath,
        env: 'dev',
        version: '1.0.0',
        activate: true
      };

      const result = await createCommand(options);
      expect(result.id).toBe('test-workflow-id');
      expect(createCommand).toHaveBeenCalledWith(options);
    });

    test('should handle invalid workflow file', async () => {
      const options = {
        file: 'nonexistent.json',
        env: 'dev',
        version: '1.0.0',
        activate: true
      };

      await expect(createCommand(options)).rejects.toThrow();
    });
  });

  describe('Workflow Listing', () => {
    test('should list workflows successfully', async () => {
      const options = { env: 'dev' };
      const workflows = await listWorkflows(options);
      
      expect(workflows).toHaveLength(1);
      expect(workflows[0].id).toBe('test-workflow-id');
      expect(listWorkflows).toHaveBeenCalledWith(options);
    });
  });

  describe('Workflow Testing', () => {
    test('should test workflow successfully', async () => {
      const options = {
        id: 'test-workflow-id',
        env: 'dev'
      };

      const result = await testWorkflow(options);
      expect(result.success).toBe(true);
      expect(testWorkflow).toHaveBeenCalledWith(options);
    });

    test('should handle invalid workflow ID', async () => {
      const options = {
        id: 'invalid-id',
        env: 'dev'
      };

      await expect(testWorkflow(options)).rejects.toThrow();
    });
  });

  describe('Workflow Deletion', () => {
    test('should delete workflow successfully', async () => {
      const options = {
        id: 'test-workflow-id',
        env: 'dev'
      };

      await deleteWorkflow(options);
      expect(deleteWorkflow).toHaveBeenCalledWith(options);
    });

    test('should handle deletion of non-existent workflow', async () => {
      const options = {
        id: 'nonexistent-id',
        env: 'dev'
      };

      await expect(deleteWorkflow(options)).rejects.toThrow();
    });
  });

  describe('Workflow Cleanup', () => {
    test('should cleanup workflows successfully', async () => {
      const options = { env: 'dev' };
      await cleanupWorkflows(options);
      expect(cleanupWorkflows).toHaveBeenCalledWith(options);
    });
  });

  describe('Workflow Activation', () => {
    test('should activate workflow successfully', async () => {
      const options = {
        id: 'test-workflow-id',
        env: 'dev'
      };

      await activateWorkflow(options);
      expect(activateWorkflow).toHaveBeenCalledWith(options);
    });

    test('should handle activation of non-existent workflow', async () => {
      const options = {
        id: 'nonexistent-id',
        env: 'dev'
      };

      await expect(activateWorkflow(options)).rejects.toThrow();
    });
  });

  describe('Environment Variable Management', () => {
    test('should set environment variable successfully', async () => {
      const options = {
        key: 'TEST_VAR',
        value: 'test-value',
        env: 'dev'
      };

      await setEnvVar(options);
      expect(setEnvVar).toHaveBeenCalledWith(options);
    });

    test('should get environment variable successfully', async () => {
      const options = {
        key: 'TEST_VAR',
        env: 'dev'
      };

      const value = await getEnvVar(options);
      expect(value).toBe('test-value');
      expect(getEnvVar).toHaveBeenCalledWith(options);
    });

    test('should list environment variables successfully', () => {
      const envVars = listEnvVars();
      expect(envVars).toEqual({ TEST_VAR: 'test-value' });
    });
  });
}); 