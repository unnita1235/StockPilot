/**
 * Environment variable validation and configuration
 * Ensures required environment variables are set before the app runs
 */

type Env = {
  apiUrl: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
};

function validateEnv(): Env {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Warn if API URL is not set in production
  if (nodeEnv === 'production' && !apiUrl) {
    console.error(
      '⚠️  NEXT_PUBLIC_API_URL is not set. API calls will fail in production.'
    );
  }

  // Provide fallback for development
  const finalApiUrl = apiUrl || 'http://localhost:3001/api';

  if (!apiUrl && nodeEnv === 'development') {
    console.warn(
      `ℹ️  NEXT_PUBLIC_API_URL not set, using fallback: ${finalApiUrl}`
    );
  }

  return {
    apiUrl: finalApiUrl,
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
  };
}

export const env = validateEnv();

// Helper to check if environment is properly configured
export function isEnvConfigured(): boolean {
  if (env.isProduction && !process.env.NEXT_PUBLIC_API_URL) {
    return false;
  }
  return true;
}

// Log environment info in development
if (env.isDevelopment) {
  console.log('🔧 Environment:', {
    nodeEnv: env.nodeEnv,
    apiUrl: env.apiUrl,
  });
}
