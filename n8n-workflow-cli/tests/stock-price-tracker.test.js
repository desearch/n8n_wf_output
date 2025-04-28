const fs = require('fs');
const path = require('path');

describe('Stock Price Tracker Workflow', () => {
  let workflow;
  const workflowPath = path.join(__dirname, '../examples/stock_price_tracker_workflow.json'); // Correct path

  beforeAll(() => {
    workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  });

  test('workflow should have correct structure', () => {
    expect(workflow).toHaveProperty('name', 'Stock Price Tracker');
    expect(workflow).toHaveProperty('nodes');
    expect(workflow.nodes).toHaveLength(3);
  });

  test('webhook node should be configured correctly', () => {
    const webhookNode = workflow.nodes.find(node => node.id === 'webhook');
    expect(webhookNode).toBeDefined();
    expect(webhookNode.parameters).toHaveProperty('path', 'stock-price');
  });

  test('httpRequest node should be configured correctly', () => {
    const httpNode = workflow.nodes.find(node => node.id === 'httpRequest');
    expect(httpNode).toBeDefined();
    expect(httpNode.parameters).toHaveProperty('url', 'https://api.twelvedata.com/price');
    expect(httpNode.parameters).toHaveProperty('method', 'GET');
    expect(httpNode.parameters.queryParameters.parameters).toHaveLength(2);
  });

  test('function node should contain valid JavaScript code', () => {
    const functionNode = workflow.nodes.find(node => node.id === 'function');
    expect(functionNode).toBeDefined();
    expect(functionNode.parameters.functionCode).toContain('const response = $input.item.json');
    expect(functionNode.parameters.functionCode).toContain('return {');
  });

  test('connections should be properly set up', () => {
    expect(workflow.connections).toHaveProperty('webhook');
    expect(workflow.connections).toHaveProperty('httpRequest');
    expect(workflow.connections.webhook.main[0][0].node).toBe('httpRequest');
    expect(workflow.connections.httpRequest.main[0][0].node).toBe('function');
  });
}); 