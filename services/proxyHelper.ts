// --- PROXY CONFIGURATION ---
// To improve speed and reliability, deploy your own CORS proxy using Cloudflare Workers.
// 1. Create a new Worker in your Cloudflare account.
// 2. Paste the contents of the `cloudflare-worker.js` file (in the project root) into the Worker.
// 3. Deploy the Worker and get its URL (e.g., https://my-proxy.user.workers.dev).
// 4. Replace the PROXY_URL below with your Worker's URL.
//
// Your final PROXY_URL should look like this:
// const PROXY_URL = 'https://my-proxy.user.workers.dev';
const PROXY_URL = 'https://stock.woody40814.workers.dev'; // Using public proxy by default.

/**
 * Formats the URL for the proxy.
 * - A custom Cloudflare worker expects `.../?url=ENCODED_TARGET_URL`
 * - The public corsproxy.io expects `.../?ENCODED_TARGET_URL`
 * @param url The target URL to proxy.
 * @returns The full proxied URL.
 */
export const getProxiedUrl = (url: string): string => {
    if (PROXY_URL.includes('workers.dev')) {
        // Note: Ensure your worker URL does not have a trailing slash in PROXY_URL.
        return `${PROXY_URL}/?url=${encodeURIComponent(url)}`;
    }
    // Default format for corsproxy.io
    return `${PROXY_URL}/?${encodeURIComponent(url)}`;
};