import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ConfigLoader {
    constructor() {
        this.config = null;
    }

    load() {
        if (this.config) {
            return this.config;
        }

        try {
            const configPath = path.join(process.cwd(), 'config.yml');
            const configFile = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(configFile);

            // Get environment from NODE_ENV or use default
            const env = process.env.NODE_ENV || config.defaultEnvironment || 'dev';
            const envConfig = config.environments[env];

            if (!envConfig) {
                throw new Error(`Environment "${env}" not found in config.yml`);
            }

            // Merge environment-specific config with defaults
            this.config = {
                environment: env,
                baseUrl: process.env.N8N_BASE_URL || envConfig.baseUrl,
                apiKey: process.env.N8N_API_KEY || envConfig.apiKey,
                apiEndpoints: envConfig.apiEndpoints,
                defaultWorkflowPattern: config.defaultWorkflowPattern,
                defaultWorkflowFile: config.defaultWorkflowFile,
                defaultWebhookPath: config.defaultWebhookPath,
                defaultVersion: config.defaultVersion,
                testCases: config.testCases,
                dockerComposeTemplate: config.dockerComposeTemplate,
                gitignoreTemplate: config.gitignoreTemplate,
                workflowTemplate: config.workflowTemplate
            };

            return this.config;
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
    }

    getConfig() {
        return this.load();
    }
}

// Create singleton instance
const configLoader = new ConfigLoader();

export default configLoader;

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = configLoader;
} 