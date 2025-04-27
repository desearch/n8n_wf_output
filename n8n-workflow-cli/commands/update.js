const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const inquirer = require('inquirer');

async function updateWorkflow(options) {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Enter workflow ID:',
        default: options.id,
        validate: input => input ? true : 'Workflow ID is required'
      },
      {
        type: 'input',
        name: 'file',
        message: 'Enter updated workflow file path:',
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

    // Verify workflow exists
    try {
      await api.get(`/api/v1/workflows/${answers.id}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error(`❌ Workflow with ID ${answers.id} not found`);
        process.exit(1);
      }
      throw error;
    }

    // Update workflow
    await api.put(`/api/v1/workflows/${answers.id}`, workflowData);
    console.log(`✅ Workflow "${workflowData.name}" updated successfully!`);
    console.log(`🔗 n8n URL: ${answers.baseUrl}`);

  } catch (error) {
    console.error('❌ Error updating workflow:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

module.exports = { updateWorkflow }; 