

interface AppConfig {
  apiUrl: string;
  appName: string;
  appVersion: string;
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : 'https://panel.socialpreview.cz',
  appName: import.meta.env.VITE_APP_NAME || 'SocialPreview Dashboard',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!config.apiUrl || config.apiUrl === '') {
    return cleanEndpoint;
  }

  return `${config.apiUrl}${cleanEndpoint}`;
};

export default config;
