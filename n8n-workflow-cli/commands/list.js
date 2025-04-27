const axios = require('axios');
const inquirer = require('inquirer');

async function listWorkflows() {
  try {
    const answers = await inquirer.prompt([
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

    const api = axios.create({
      baseURL: answers.baseUrl,
      headers: {
        'X-N8N-API-KEY': answers.apiKey
      }
    });

    const response = await api.get('/api/v1/workflows');
    const workflows = response.data;

    if (workflows.length === 0) {
      console.log('No workflows found.');
      return;
    }

    console.log('\n📋 Available Workflows:');
    console.log('-------------------');
    workflows.forEach(workflow => {
      console.log(`\n🔹 Name: ${workflow.name}`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   Active: ${workflow.active ? '✅' : '❌'}`);
      console.log(`   Created: ${new Date(workflow.createdAt).toLocaleString()}`);
      console.log(`   Updated: ${new Date(workflow.updatedAt).toLocaleString()}`);
      if (workflow.description) {
        console.log(`   Description: ${workflow.description}`);
      }
    });

  } catch (error) {
    console.error('❌ Error listing workflows:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

module.exports = { listWorkflows }; 