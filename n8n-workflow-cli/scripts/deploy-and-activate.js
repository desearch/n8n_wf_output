#!/usr/bin/env node

import { program } from 'commander';
import { deployCommand } from '../commands/deploy.js';
import { activateWorkflow } from '../commands/activate.js';
import config from '../config.js';

program
  .description('Deploy and activate a workflow in one command')
  .requiredOption('-f, --file <file>', 'Workflow file path')
  .option('-e, --env <env>', 'Environment (dev/staging/prod)', 'dev')
  .option('-v, --version <version>', 'Workflow version', '1.0.0')
  .option('-u, --update', 'Update existing workflow if found', false)
  .action(async (options) => {
    try {
      console.log('Starting deployment and activation process...');
      console.log('Options:', options);

      // Validate environment
      if (!config.environments[options.env]) {
        throw new Error(`Invalid environment: ${options.env}`);
      }

      // Deploy the workflow
      console.log('Deploying workflow...');
      const workflowId = await deployCommand({
        file: options.file,
        env: options.env,
        version: options.version,
        update: options.update
      });

      // Activate the workflow
      console.log('Activating workflow...');
      await activateWorkflow({
        id: workflowId,
        env: options.env
      });

      console.log('✅ Workflow deployed and activated successfully!');
      console.log(`Workflow ID: ${workflowId}`);
      console.log(`Environment: ${options.env}`);
      console.log(`Version: ${options.version}`);
    } catch (error) {
      console.error('❌ Error during deployment and activation:');
      console.error(error.message);
      process.exit(1);
    }
  });

program.parse(process.argv); 