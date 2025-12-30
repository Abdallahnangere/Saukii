import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// CONFIGURATION
// AMIGO_BASE_URL: The actual destination (e.g. https://amigo.ng/api)
// AWS_PROXY_URL: The Squid Proxy Address (e.g. http://35.x.x.x:3128)
const AMIGO_URL = process.env.AMIGO_BASE_URL?.replace(/\/$/, '') || 'https://amigo.ng/api'; 
const PROXY_URL = process.env.AWS_PROXY_URL; 
const API_KEY = process.env.AMIGO_API_KEY || '';

// Configure Proxy Agent
// This tells Axios to tunnel the HTTPS request through our AWS Squid Proxy
// to ensure the request originates from our Static IP.
let httpsAgent;
if (PROXY_URL) {
    // HttpsProxyAgent handles the HTTP CONNECT method to the proxy
    httpsAgent = new HttpsProxyAgent(PROXY_URL);
} else {
    console.warn("⚠️ AWS_PROXY_URL is missing. Connection may fail if Static IP is required.");
}

// Create Axios Instance
export const amigoClient = axios.create({
  baseURL: AMIGO_URL,
  httpsAgent: httpsAgent,
  proxy: false, // Important: Disable default axios proxy logic to use the agent explicitly
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'Accept': 'application/json',
  },
  timeout: 60000, // 60s timeout
});

/**
 * Helper to call Amigo endpoints.
 * Routes traffic through the configured AWS Proxy.
 */
export async function callAmigoAPI(endpoint: string, payload: any, idempotencyKey?: string) {
  if (!AMIGO_URL) {
    return { success: false, data: { error: 'Configuration Error: AMIGO_BASE_URL missing' }, status: 500 };
  }

  // Ensure strict path formatting for Amigo (usually expects trailing slash for POSTs)
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!cleanEndpoint.endsWith('/')) cleanEndpoint += '/';

  console.log(`[Amigo API] 🚀 Sending to: ${AMIGO_URL}${cleanEndpoint} ${PROXY_URL ? '(via Proxy)' : '(Direct)'}`);

  try {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await amigoClient.post(cleanEndpoint, payload, { headers });
    
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

// Network Mapping
export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};