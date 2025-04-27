#!/usr/bin/env node

const { program } = require('commander');
const { createWorkflow } = require('./commands/create');
const { deployWorkflow } = require('./commands/deploy');
const { listWorkflows } = require('./commands/list');
const { updateWorkflow } = require('./commands/update');
const { deleteWorkflow } = require('./commands/delete');

program
  .name('n8n-workflow-cli')
  .description('CLI tool for managing n8n workflow deployments')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new n8n workflow project')
  .option('-n, --name <name>', 'Workflow name')
  .option('-d, --description <description>', 'Workflow description')
  .action(createWorkflow);

program
  .command('deploy')
  .description('Deploy a workflow to n8n instance')
  .option('-f, --file <file>', 'Workflow file path')
  .option('-e, --env <env>', 'Environment (dev/prod)')
  .action(deployWorkflow);

program
  .command('list')
  .description('List all workflows')
  .action(listWorkflows);

program
  .command('update')
  .description('Update an existing workflow')
  .option('-i, --id <id>', 'Workflow ID')
  .option('-f, --file <file>', 'Updated workflow file path')
  .action(updateWorkflow);

program
  .command('delete')
  .description('Delete a workflow')
  .option('-i, --id <id>', 'Workflow ID')
  .action(deleteWorkflow);

program.parse(); 