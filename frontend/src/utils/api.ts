const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const isProduction = process.env.NODE_ENV === 'production';
const defaultApiUrl = 'http://localhost:5000/api/v1';

const apiBaseUrl = isProduction
  ? '/api/v1'
  : (configuredApiUrl || defaultApiUrl).replace(/\/+$/, '');

export const apiUrl = (path: string) => `${apiBaseUrl}/${path.replace(/^\/+/, '')}`;
