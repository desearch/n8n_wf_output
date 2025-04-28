import http from 'http';
import https from 'https';
import { URL } from 'url';

// Load environment variables directly
import dotenv from 'dotenv';
dotenv.config();

class HttpClient {
    constructor() {
        // Use environment variables directly
        this.baseUrl = process.env.N8N_BASE_URL;
        this.apiKey = process.env.N8N_API_KEY;

        // Replace localhost with 127.0.0.1 in baseUrl if present
        if (this.baseUrl && this.baseUrl.includes('localhost')) {
            this.baseUrl = this.baseUrl.replace('localhost', '127.0.0.1');
        }

        if (!this.baseUrl || !this.apiKey) {
            console.warn('Warning: N8N_BASE_URL or N8N_API_KEY environment variables are not set.');
            // Optionally, throw an error if these are critical
            // throw new Error('N8N_BASE_URL and N8N_API_KEY must be set in environment variables.');
        }
    }

    async request(options, data = null) {
        return new Promise((resolve, reject) => {
            // Ensure baseUrl is available before proceeding
            if (!this.baseUrl) {
                return reject(new Error('HttpClient requires N8N_BASE_URL to be set.'));
            }

            const url = new URL(options.url || options.path, this.baseUrl);
            const protocol = url.protocol === 'https:' ? https : http;

            const requestOptions = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'X-N8N-API-KEY': this.apiKey, // Use the apiKey from the instance
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            const req = protocol.request(requestOptions, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(responseData);
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: parsedData
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: responseData // Return raw data if JSON parsing fails
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async get(path, options = {}) {
        return this.request({ ...options, method: 'GET', path });
    }

    async post(path, data, options = {}) {
        return this.request({ ...options, method: 'POST', path }, data);
    }

    async put(path, data, options = {}) {
        return this.request({ ...options, method: 'PUT', path }, data);
    }

    async delete(path, options = {}) {
        return this.request({ ...options, method: 'DELETE', path });
    }
}

export default HttpClient; 