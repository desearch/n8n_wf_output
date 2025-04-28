import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

describe('Configuration Loading from .env', () => {
    const envPath = path.resolve(process.cwd(), '.env');
    let originalEnvContent = '';

    // Backup original .env if it exists
    beforeAll(() => {
        if (fs.existsSync(envPath)) {
            originalEnvContent = fs.readFileSync(envPath, 'utf8');
        }
        // Clear existing process.env vars that might clash, except critical ones like PATH
        const keysToClear = Object.keys(process.env).filter(key => 
            key.startsWith('N8N_') || key.startsWith('TWELVEDATA_')
        );
        keysToClear.forEach(key => delete process.env[key]);
    });

    // Restore original .env content after tests
    afterAll(() => {
        if (originalEnvContent) {
            fs.writeFileSync(envPath, originalEnvContent, 'utf8');
        } else if (fs.existsSync(envPath)) {
            // If there was no original file, remove the one created by tests
            fs.unlinkSync(envPath);
        }
        // Reload original env potentially?
        dotenv.config({ path: envPath, override: true }); 
    });

    // Clean up process.env between tests
    beforeEach(() => {
        const keysToClear = Object.keys(process.env).filter(key => 
            key.startsWith('N8N_') || key.startsWith('TWELVEDATA_')
        );
        keysToClear.forEach(key => delete process.env[key]);
    });

    test('should load variables correctly from .env file', () => {
        // Create a dummy .env for this test
        const testEnvContent = `
N8N_API_KEY=test-api-key-123
N8N_BASE_URL=http://testhost:1234
TWELVEDATA_API_KEY=test-twelve-key-456
# This is a comment
N8N_EXTRA_VAR=extra
`;
        fs.writeFileSync(envPath, testEnvContent, 'utf8');

        // Load dotenv
        const result = dotenv.config({ path: envPath, override: true });

        // Check for parsing errors
        expect(result.error).toBeUndefined();

        // Verify that variables are loaded into process.env
        expect(process.env.N8N_API_KEY).toBe('test-api-key-123');
        expect(process.env.N8N_BASE_URL).toBe('http://testhost:1234');
        expect(process.env.TWELVEDATA_API_KEY).toBe('test-twelve-key-456');
        expect(process.env.N8N_EXTRA_VAR).toBe('extra');
        
        // Verify comment is ignored (check a variable that shouldn't exist)
        expect(process.env['# This is a comment']).toBeUndefined();
    });

    test('should handle missing .env file gracefully', () => {
        // Ensure .env file does not exist
        if (fs.existsSync(envPath)) {
            fs.unlinkSync(envPath);
        }

        // Load dotenv
        const result = dotenv.config({ path: envPath, override: true });

        // By default, dotenv doesn't throw but returns an error object
        expect(result.error).toBeDefined();
        // Optionally check the error code
        expect(result.error.code).toBe('ENOENT'); 

        // Variables should not be loaded
        expect(process.env.N8N_API_KEY).toBeUndefined();
        expect(process.env.N8N_BASE_URL).toBeUndefined();
    });

     test('should use provided values for expected keys', () => {
        // Use the actual .env content provided by the user
        const userEnvContent = `
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOTg5ZTJkNS1jYzRkLTRjMDItYWM5Zi1iOTgyMWNmZmI5ZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ1ODAwMjM2LCJleHAiOjE3NDgzMTg0MDB9.r7M_YrTRzi5vdQGdphlXUN4nV3ML3EB2agJWEN6aW4U
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678/
N8N_BASIC_AUTH_ACTIVE=false
N8N_PUBLIC_API_DISABLED=false
TWELVEDATA_API_KEY=384095a28cb749779be4b4b77645d3ee
N8N_BASE_URL=http://localhost:5678
`;
        fs.writeFileSync(envPath, userEnvContent, 'utf8');
        
        const result = dotenv.config({ path: envPath, override: true });
        expect(result.error).toBeUndefined();

        // Check against the user's expected values
        expect(process.env.N8N_API_KEY).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOTg5ZTJkNS1jYzRkLTRjMDItYWM5Zi1iOTgyMWNmZmI5ZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ1ODAwMjM2LCJleHAiOjE3NDgzMTg0MDB9.r7M_YrTRzi5vdQGdphlXUN4nV3ML3EB2agJWEN6aW4U');
        expect(process.env.N8N_HOST).toBe('localhost');
        expect(process.env.N8N_PORT).toBe('5678');
        expect(process.env.N8N_PROTOCOL).toBe('http');
        expect(process.env.N8N_WEBHOOK_URL).toBe('http://localhost:5678/');
        expect(process.env.N8N_BASIC_AUTH_ACTIVE).toBe('false'); // Note: .env values are strings
        expect(process.env.N8N_PUBLIC_API_DISABLED).toBe('false'); // Note: .env values are strings
        expect(process.env.TWELVEDATA_API_KEY).toBe('384095a28cb749779be4b4b77645d3ee');
        expect(process.env.N8N_BASE_URL).toBe('http://localhost:5678');
    });
}); 