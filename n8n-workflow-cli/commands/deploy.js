const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const inquirer = require('inquirer');

async function deployWorkflow(options) {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'file',
        message: 'Enter workflow file path:',
        default: options.file || 'workflow.json',
        validate: async (input) => {
          const filePath = path.resolve(input);
          if (!await fs.pathExists(filePath)) {
            return 'File does not exist';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'env',
        message: 'Enter environment (dev/prod):',
        default: options.env || 'dev',
        validate: input => ['dev', 'prod'].includes(input) ? true : 'Environment must be either dev or prod'
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter n8n API key:',
        validate: input => input ? true : 'API key is required'
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Enter n8n base URL:',
        default: 'http://localhost:5678',
        validate: input => input ? true : 'Base URL is required'
      }
    ]);

    const workflowData = await fs.readJson(path.resolve(answers.file));
    
    const api = axios.create({
      baseURL: answers.baseUrl,
      headers: {
        'X-N8N-API-KEY': answers.apiKey
      }
    });

    // Check if workflow exists
    const workflows = await api.get('/api/v1/workflows');
    const existingWorkflow = workflows.data.find(w => w.name === workflowData.name);

    if (existingWorkflow) {
      // Update existing workflow
      await api.put(`/api/v1/workflows/${existingWorkflow.id}`, workflowData);
      console.log(`✅ Workflow "${workflowData.name}" updated successfully!`);
    } else {
      // Create new workflow
      await api.post('/api/v1/workflows', workflowData);
      console.log(`✅ Workflow "${workflowData.name}" deployed successfully!`);
    }

    console.log(`🌐 Environment: ${answers.env}`);
    console.log(`🔗 n8n URL: ${answers.baseUrl}`);

  } catch (error) {
    console.error('❌ Error deploying workflow:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

module.exports = { deployWorkflow }; 