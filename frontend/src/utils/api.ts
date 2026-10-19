const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const defaultApiUrl = process.env.NODE_ENV === 'production'
  ? 'https://assetra-ynox.onrender.com/api/v1'
  : 'http://localhost:5000/api/v1';

const apiBaseUrl = (configuredApiUrl || defaultApiUrl).replace(/\/+$/, '');

export const apiUrl = (path: string) => `${apiBaseUrl}/${path.replace(/^\/+/, '')}`;
