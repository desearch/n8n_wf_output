import inquirer from 'inquirer';
import { listWorkflows } from './list.js';
import { deleteWorkflow } from './delete.js';

async function cleanupWorkflows(options) {
    try {
        const { pattern, dryRun, force } = options;

        console.log('Fetching workflows...');
        const workflows = await listWorkflows({});

        const matchingWorkflows = workflows.filter(workflow => 
            workflow.name && workflow.name.includes(pattern)
        );

        if (matchingWorkflows.length === 0) {
            console.log(`No workflows found matching pattern: "${pattern}"`);
            return;
        }

        console.log(`Found ${matchingWorkflows.length} workflows matching pattern: "${pattern}"`);
        
        if (dryRun) {
            console.log('Dry run mode - no workflows will be deleted:');
            matchingWorkflows.forEach(workflow => {
                console.log(`  - ${workflow.name} (ID: ${workflow.id})`);
            });
            return;
        }

        let confirm = force;
        if (!force) {
            const answers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Are you sure you want to delete ${matchingWorkflows.length} workflows matching "${pattern}"?`,
                    default: false
                }
            ]);
            confirm = answers.confirm;
        }

        if (!confirm) {
            console.log('Operation cancelled.');
            return;
        }

        console.log('Deleting workflows...');
        let deletedCount = 0;
        let failedCount = 0;
        for (const workflow of matchingWorkflows) {
            try {
                await deleteWorkflow({ id: workflow.id });
                deletedCount++;
            } catch (error) {
                failedCount++;
            }
        }

        console.log(`Cleanup completed. ${deletedCount} workflows deleted, ${failedCount} failed.`);
        if (failedCount > 0) {
            console.warn('Some workflows could not be deleted. Check logs above for details.');
        }

    } catch (error) {
        console.error('Error during cleanup process:', error.message);
        throw error;
    }
}

export { cleanupWorkflows }; 