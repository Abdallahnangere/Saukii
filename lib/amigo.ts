import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// CONFIGURATION
const AMIGO_URL = process.env.AMIGO_BASE_URL?.replace(/\/$/, '') || 'https://amigo.ng/api'; 
const PROXY_URL = process.env.AWS_PROXY_URL; 
const API_KEY = process.env.AMIGO_API_KEY || '';

let httpsAgent;
if (PROXY_URL) {
    httpsAgent = new HttpsProxyAgent(PROXY_URL);
}

// Create Axios Instance
export const amigoClient = axios.create({
  baseURL: AMIGO_URL,
  httpsAgent: httpsAgent,
  proxy: false,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`, // Some endpoints might use Bearer
    'Token': API_KEY, // Try both standard headers
    'X-API-Key': API_KEY,
    'Accept': 'application/json',
  },
  timeout: 60000, 
});

export async function callAmigoAPI(endpoint: string, payload: any, idempotencyKey?: string) {
  if (!AMIGO_URL) {
    return { success: false, data: { error: 'Configuration Error: AMIGO_BASE_URL missing' }, status: 500 };
  }

  // ROBUST URL HANDLING
  // If endpoint is "/data/", and base is "https://amigo.ng/api", result is "https://amigo.ng/api/data/"
  // We remove leading slash from endpoint to let axios handle baseURL correctly, OR we handle it manually.
  // Best practice with Axios baseURL: Endpoint should NOT start with / if baseURL has it, but let's be safe.
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  console.log(`[Amigo API] 🚀 Tunneling to: ${AMIGO_URL}/${cleanEndpoint}`);

  try {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await amigoClient.post(`/${cleanEndpoint}`, payload, { headers });
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[Amigo API] ❌ Failed: ${errorMsg}`);
    
    return {
      success: false,
      data: error.response?.data || { error: errorMsg },
      status: error.response?.status || 500
    };
  }
}

export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};