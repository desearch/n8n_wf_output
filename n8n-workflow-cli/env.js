import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file variables into process.env
// This should ideally happen once at the start of the application (e.g., in workflow-manager.js or config.js)
// but doing it here ensures variables are loaded if this module is used independently.
import dotenv from 'dotenv';
dotenv.config();

// Remove functions related to .env.json management
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const envFile = path.join(__dirname, '.env.json');
// const defaultEnv = { ... };
// function loadEnv() { ... }
// function saveEnv(env) { ... }

// Set an environment variable (Warns about persistence)
function setEnvVar(key, value) {
    try {
        if (typeof key !== 'string' || typeof value !== 'string') {
            throw new Error('Environment variable key and value must be strings');
        }

        process.env[key] = value;
        console.log(`Set environment variable ${key}=${value}`);
        console.warn('Note: This change will only persist for the current process.');
        console.warn('To make it permanent, please update your .env file manually.');
    } catch (error) {
        throw new Error(`Failed to set environment variable: ${error.message}`);
    }
}

// Get an environment variable from process.env
function getEnvVar(key) {
    // dotenv loads variables into process.env
    return process.env[key];
}

// List relevant environment variables from process.env
function listEnvVars() {
    console.log('Relevant Environment variables (from .env and system):');
    const relevantPrefixes = ['N8N_', 'TWELVEDATA_']; // Add other relevant prefixes if needed
    
    Object.entries(process.env).forEach(([key, value]) => {
        if (relevantPrefixes.some(prefix => key.startsWith(prefix))) {
            // Mask sensitive values (basic masking)
            let displayValue = value;
            if (key.includes('API_KEY') || key.includes('SECRET')) {
                 displayValue = value && value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : '********';
            }
             // Mask JWT token if it looks like one
            if (key === 'N8N_API_KEY' && value && value.split('.').length === 3) {
                 const parts = value.split('.');
                 displayValue = `${parts[0].slice(0, 4)}... . ... . ...${parts[2].slice(-4)}`;
            }

            console.log(`  ${key}: ${displayValue}`);
        }
    });
}

export {
    setEnvVar,
    getEnvVar,
    listEnvVars
}; 