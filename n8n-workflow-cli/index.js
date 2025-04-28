#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
// const http = require('http'); // http seems unused, commenting out
// import http from 'http';
import path from 'path';

// Enable better error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Enable better error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Debug logging
// console.log('CLI starting...');
// console.log('Current working directory:', process.cwd());
// console.log('Arguments:', process.argv);

// Load commands
// console.log('Loading commands...');
// These require calls are replaced by dynamic imports below
// const deployCommand = require('./commands/deploy');
// const listCommand = require('./commands/list');
// const cleanupCommand = require('./commands/cleanup');
// const testCommand = require('./commands/test');
// const createCommand = require('./commands/create');
// const deleteCommand = require('./commands/delete');
// console.log('Commands loaded successfully');

program
  .name('n8n-workflow')
  .description('CLI tool for managing n8n workflow deployments')
  .version('1.0.0'); // Assuming version is in package.json, consider reading it dynamically

// Create command
program
  .command('create')
  .description('Create a new workflow')
  .requiredOption('-f, --file <file>', 'Workflow file path')
  .option('-e, --env <env>', 'Environment (dev/staging/prod)', 'dev')
  .option('-v, --version <version>', 'Workflow version', '1.0.0')
  .option('-a, --activate', 'Activate workflow after creation', false)
  .action(async (cmd) => {
    try {
      // console.log('Create command called with options:', cmd);
      // console.log('Checking if workflow file exists:', cmd.file);
      
      const filePath = path.resolve(cmd.file);
      if (!await fs.pathExists(filePath)) {
        console.error('Workflow file not found:', filePath);
        process.exit(1);
      }
      
      // console.log('Workflow file exists, proceeding with creation');
      // Dynamically import the command function
      const { createCommand } = await import('./commands/create.js');
      const result = await createCommand({
        file: filePath,
        env: cmd.env,
        version: cmd.version,
        activate: cmd.activate
      });
      // console.log('Create command completed with result:', result);
    } catch (error) {
      console.error('Error in create command:', error);
      process.exit(1);
    }
  });

// Delete command
program
  .command('delete')
  .description('Delete a workflow')
  .requiredOption('-i, --id <id>', 'Workflow ID')
  .option('-e, --env <env>', 'Environment (dev/staging/prod)', 'dev')
  .option('-f, --force', 'Force deletion without confirmation', false)
  .action(async (cmd) => {
    try {
      // console.log('Delete command called with options:', cmd);
      const { deleteCommand } = await import('./commands/delete.js');
      await deleteCommand({
        id: cmd.id,
        env: cmd.env,
        force: cmd.force
      });
    } catch (error) {
      console.error('Error in delete command:', error);
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy a workflow')
  .requiredOption('-f, --file <file>', 'Workflow file path')
  .option('-e, --env <env>', 'Environment (dev/staging/prod)', 'dev')
  .option('-v, --version <version>', 'Workflow version', '1.0.0')
  .option('-u, --update', 'Update existing workflow if found', false)
  .action(async (cmd) => {
    try {
      // console.log('Deploy command called with options:', cmd);
      // console.log('Checking if workflow file exists:', cmd.file);
      
      const filePath = path.resolve(cmd.file);
      if (!await fs.pathExists(filePath)) {
        console.error('Workflow file not found:', filePath);
        process.exit(1);
      }
      
      // console.log('Workflow file exists, proceeding with deployment');
      const { deployCommand } = await import('./commands/deploy.js');
      const result = await deployCommand({
        file: filePath, // Pass the resolved absolute path
        env: cmd.env,
        version: cmd.version,
        update: cmd.update
      });
      // console.log('Deploy command completed with result:', result);
    } catch (error) {
      console.error('Error in deploy command:', error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List workflows')
  .option('-e, --env <env>', 'Environment (dev/staging/prod)', 'dev')
  .option('-p, --pattern <pattern>', 'Workflow name pattern')
  .option('-d, --deployed-only', 'Show only deployed workflows', false)
  .action(async (cmd) => {
    try {
      // console.log('List command called with options:', cmd);
      const { listWorkflows } = await import('./commands/list.js'); // Assuming listWorkflows is exported
      await listWorkflows({
        env: cmd.env,
        pattern: cmd.pattern,
        deployedOnly: cmd.deployedOnly
      });
    } catch (error) {
      console.error('Error in list command:', error);
      process.exit(1);
    }
  });

// Cleanup command
program
  .command('cleanup')
  .description('Clean up deployed workflows')
  .option('-e, --env <env>', 'Environment (dev/staging/prod)', 'dev')
  .option('-p, --pattern <pattern>', 'Workflow name pattern')
  .option('-n, --dry-run', 'Dry run (no actual deletion)', true)
  .option('-f, --force', 'Force cleanup without confirmation', false)
  .action(async (cmd) => {
    try {
      // console.log('Cleanup command called with options:', cmd);
      const { cleanupCommand } = await import('./commands/cleanup.js');
      await cleanupCommand({
        env: cmd.env,
        pattern: cmd.pattern,
        dryRun: cmd.dryRun,
        force: cmd.force
      });
    } catch (error) {
      console.error('Error in cleanup command:', error);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test a workflow using metadata test cases')
  // Changed from ID to file path based on test.js and README
  .argument('<file>', 'Workflow file path') 
  .option('-e, --env <env>', 'Environment (dev/staging/prod)', 'dev')
  .action(async (file, cmd) => { // Argument comes before options object
    try {
      // console.log('Test command called with file:', file, 'and options:', cmd);
      const filePath = path.resolve(file);
      if (!await fs.pathExists(filePath)) {
        console.error('Workflow file not found:', filePath);
        process.exit(1);
      }
      const { testWorkflow } = await import('./commands/test.js');
      await testWorkflow(filePath, cmd.env);
    } catch (error) {
      console.error('Error in test command:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
try {
  // console.log('Parsing command line arguments...');
  program.parse(process.argv); // Pass process.argv explicitly
  // console.log('Command line arguments parsed successfully');
} catch (error) {
  console.error('Error parsing command line arguments:', error);
  process.exit(1);
} 