import axios from 'axios';
import configLoader from '../config/loader.js';

class HttpClient {
    constructor() {
        const config = configLoader.getConfig();
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': this.apiKey
            }
        });

        // Add response interceptor for better error handling
        this.client.interceptors.response.use(
            response => response,
            error => Promise.reject(this.handleError(error))
        );
    }

    async get(endpoint) {
        try {
            const response = await this.client.get(endpoint);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await this.client.post(endpoint, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async put(endpoint, data) {
        try {
            const response = await this.client.put(endpoint, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await this.client.delete(endpoint);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const message = error.response.data.message || error.response.statusText;
            const enhancedError = new Error(`API Error: ${message}`);
            enhancedError.status = error.response.status;
            enhancedError.data = error.response.data;
            enhancedError.response = error.response;
            return enhancedError;
        } else if (error.request) {
            // The request was made but no response was received
            const networkError = new Error('No response received from server');
            networkError.request = error.request;
            return networkError;
        } else {
            // Something happened in setting up the request that triggered an Error
            return error;
        }
    }
}

// Create singleton instance
const httpClient = new HttpClient();

export default httpClient;

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = httpClient;
} 