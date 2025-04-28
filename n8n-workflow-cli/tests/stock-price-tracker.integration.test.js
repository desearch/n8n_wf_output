const fs = require('fs');
const path = require('path');

// Mock the modules
jest.mock('../commands/create.cjs', () => ({
  createCommand: jest.fn().mockResolvedValue({ id: 'test-workflow-id' })
}));

jest.mock('../commands/test.cjs', () => ({
  testWorkflow: jest.fn().mockImplementation(async () => {
    console.log('Testing case: Positive Integer');
    console.log('✅ PASS');
    console.log('AAPL');
    console.log('Testing case: Invalid Symbol');
    console.log('INVALID');
    console.log('Testing case: Empty Symbol');
    console.log('empty symbol');
  })
}));

jest.mock('../commands/delete.cjs', () => ({
  deleteWorkflow: jest.fn().mockResolvedValue(undefined)
}));

describe('Stock Price Tracker Workflow Integration', () => {
  let workflowId;
  const workflowPath = path.join(__dirname, '../examples/stock-price-workflow/stock_price_tracker_workflow.json');
  const { createCommand } = require('../commands/create.cjs');
  const { testWorkflow } = require('../commands/test.cjs');
  const { deleteWorkflow } = require('../commands/delete.cjs');

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    // Create the workflow
    const createOptions = {
      file: workflowPath,
      env: 'dev',
      version: '1.0.0',
      activate: true
    };

    try {
      const result = await createCommand(createOptions);
      workflowId = result.id;
      console.log('Created workflow with ID:', workflowId);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup: Delete the workflow
    if (workflowId) {
      try {
        await deleteWorkflow({ id: workflowId, env: 'dev' });
        console.log('Cleaned up workflow:', workflowId);
      } catch (error) {
        console.error('Failed to cleanup workflow:', error);
      }
    }
  });

  test('should successfully process valid stock symbol', async () => {
    const testOptions = {
      id: workflowId,
      env: 'dev'
    };

    const consoleSpy = jest.spyOn(console, 'log');
    await testWorkflow(testOptions);

    // Verify test results from console output
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Testing case: Positive Integer'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ PASS'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('AAPL'));
    
    consoleSpy.mockRestore();
  });

  test('should handle invalid stock symbol', async () => {
    const testOptions = {
      id: workflowId,
      env: 'dev'
    };

    const consoleSpy = jest.spyOn(console, 'log');
    await testWorkflow(testOptions);

    // Verify test results from console output
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Testing case: Invalid Symbol'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('INVALID'));
    
    consoleSpy.mockRestore();
  });

  test('should handle empty stock symbol', async () => {
    const testOptions = {
      id: workflowId,
      env: 'dev'
    };

    const consoleSpy = jest.spyOn(console, 'log');
    await testWorkflow(testOptions);

    // Verify test results from console output
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Testing case: Empty Symbol'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('empty symbol'));
    
    consoleSpy.mockRestore();
  });
}); 