const axios = require('axios');
const inquirer = require('inquirer');

async function deleteWorkflow(options) {
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
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete this workflow?',
        default: false
      }
    ]);

    if (!answers.confirm) {
      console.log('❌ Operation cancelled');
      return;
    }

    const api = axios.create({
      baseURL: answers.baseUrl,
      headers: {
        'X-N8N-API-KEY': answers.apiKey
      }
    });

    // Verify workflow exists
    let workflowName;
    try {
      const response = await api.get(`/api/v1/workflows/${answers.id}`);
      workflowName = response.data.name;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error(`❌ Workflow with ID ${answers.id} not found`);
        process.exit(1);
      }
      throw error;
    }

    // Delete workflow
    await api.delete(`/api/v1/workflows/${answers.id}`);
    console.log(`✅ Workflow "${workflowName}" deleted successfully!`);
    console.log(`🔗 n8n URL: ${answers.baseUrl}`);

  } catch (error) {
    console.error('❌ Error deleting workflow:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

module.exports = { deleteWorkflow }; 