// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  ENDPOINTS: {
    SCRAPE_RESOURCES: '/scrape_resources',
    HEALTH: '/health',
  },
  TIMEOUT: 30000, // 30 seconds
};
