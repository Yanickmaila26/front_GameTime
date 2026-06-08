import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://gametime.test/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  retry: 4,          // Retry up to 4 times
  retryDelay: 3000   // Wait 3 seconds between retries
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

client.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const { config, response } = error;

  // Handle 401 Unauthorized
  if (response && response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    if (!window.location.pathname.endsWith('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }

  // Only retry on network errors (no response, e.g. CORS preflight issues during spin-up) or 5xx server errors
  const isNetworkOrServerError = !response || (response.status >= 500 && response.status <= 599);

  if (config && config.retry && isNetworkOrServerError) {
    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount < config.retry) {
      config.__retryCount += 1;
      
      console.warn(`[Axios] Connection failed. Retrying request ${config.url} (${config.__retryCount}/${config.retry}) after delay...`);
      
      // Wait for the retry delay
      await new Promise((resolve) => setTimeout(resolve, config.retryDelay || 3000));
      
      // Retry the request with the same configuration
      return client(config);
    }
  }

  return Promise.reject(error);
});

export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://gametime.test/api';
  const host = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${host}${cleanPath}`;
}

export default client;
