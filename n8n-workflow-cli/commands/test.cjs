const config = require('../config.cjs');
const HttpClient = require('../http-client.cjs');

async function testWorkflow(options) {
    try {
        const { id, env } = options;
        const envConfig = config.environments[env];

        if (!envConfig) {
            throw new Error(`Invalid environment: ${env}`);
        }

        const httpClient = new HttpClient(envConfig);

        // Run test cases
        for (const testCase of config.testCases) {
            console.log(`\nTesting case: ${testCase.name}`);
            
            const data = JSON.stringify({ symbol: testCase.symbol });
            console.log('Request data:', data);
            
            try {
                // Use the production webhook URL format
                const webhookUrl = `/webhook/${id}`;
                const response = await httpClient.post(webhookUrl, data);
                console.log('Response:', response);
                console.log('Response data:', response.data);
                const result = response.data;
                
                const symbolMatch = result.symbol === testCase.expected;
                const priceValid = testCase.expectedPrice ? typeof result.price === 'string' && parseFloat(result.price) > 0 : !result.price;
                const testPassed = symbolMatch && priceValid;

                console.log(`Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
                console.log(`Symbol - Expected: ${testCase.expected}, Got: ${result.symbol}`);
                console.log(`Price - Expected: ${testCase.expectedPrice ? 'valid price' : 'no price'}, Got: ${result.price || 'no price'}`);
            } catch (error) {
                console.log(`Result: ❌ FAIL (Error: ${error.message})`);
            }
        }

        console.log('\nTesting completed');
    } catch (error) {
        console.error('Error in testing:', error.message);
        throw error;
    }
}

module.exports = { testWorkflow }; 