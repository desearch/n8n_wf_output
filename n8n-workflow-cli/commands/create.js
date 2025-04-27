const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

async function createWorkflow(options) {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter workflow name:',
        default: options.name,
        validate: input => input ? true : 'Name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Enter workflow description:',
        default: options.description
      }
    ]);

    const workflowDir = path.join(process.cwd(), answers.name);
    await fs.ensureDir(workflowDir);

    // Create workflow.json
    const workflowTemplate = {
      name: answers.name,
      description: answers.description,
      nodes: [],
      connections: {},
      settings: {
        executionOrder: "v1",
        saveManualExecutions: false,
        callerPolicy: "workflowFromSameOwner",
        errorWorkflow: ""
      }
    };

    await fs.writeJson(path.join(workflowDir, 'workflow.json'), workflowTemplate, { spaces: 2 });

    // Create docker-compose.yml
    const dockerComposeTemplate = {
      version: '3.8',
      services: {
        n8n: {
          image: 'n8nio/n8n',
          ports: ['5678:5678'],
          environment: {
            N8N_HOST: 'localhost',
            N8N_PORT: '5678',
            N8N_PROTOCOL: 'http',
            N8N_USER_MANAGEMENT_DISABLED: 'true',
            N8N_BASIC_AUTH_ACTIVE: 'true',
            N8N_BASIC_AUTH_USER: 'admin',
            N8N_BASIC_AUTH_PASSWORD: 'password'
          },
          volumes: ['./n8n-data:/home/node/.n8n']
        }
      }
    };

    await fs.writeJson(path.join(workflowDir, 'docker-compose.yml'), dockerComposeTemplate, { spaces: 2 });

    // Create .gitignore
    await fs.writeFile(
      path.join(workflowDir, '.gitignore'),
      'node_modules/\nn8n-data/\n.env\n'
    );

    console.log(`✅ Workflow project "${answers.name}" created successfully!`);
    console.log(`📁 Project directory: ${workflowDir}`);
    console.log('\nNext steps:');
    console.log('1. cd into the project directory');
    console.log('2. Run "docker-compose up -d" to start n8n');
    console.log('3. Access n8n at http://localhost:5678');

  } catch (error) {
    console.error('❌ Error creating workflow:', error.message);
    process.exit(1);
  }
}

module.exports = { createWorkflow }; 