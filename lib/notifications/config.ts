import { createAdminClient } from '@/utils/supabase/admin';

interface FallbackConfig {
  SMS_MAX_PER_HOUR: number;
  SMS_WINDOW_HOURS: number;
  SMS_SUPPORTED_COUNTRIES: string[];
  SMS_RATE_LIMIT_ENABLED: boolean;
  FALLBACK_ENABLED: boolean;
}

let cachedConfig: FallbackConfig | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getFallbackConfig(): Promise<FallbackConfig> {
  const now = Date.now();
  
  // Return cached config if still valid
  if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConfig;
  }
  
  try {
    const supabase = createAdminClient();
    const { data: configs, error } = await supabase
      .from('fallback_configs')
      .select('key, value');
    
    if (error) {
      console.error('[Config] Error fetching fallback configs:', error);
      // Fallback to environment variables
      return getFallbackConfigFromEnv();
    }
    
    // Convert array to object
    const configMap = configs?.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>) || {};
    
    // Parse and validate config
    const config: FallbackConfig = {
      SMS_MAX_PER_HOUR: parseInt(configMap.SMS_MAX_PER_HOUR || '10'),
      SMS_WINDOW_HOURS: parseInt(configMap.SMS_WINDOW_HOURS || '1'),
      SMS_SUPPORTED_COUNTRIES: (configMap.SMS_SUPPORTED_COUNTRIES || 'US,IN').split(','),
      SMS_RATE_LIMIT_ENABLED: configMap.SMS_RATE_LIMIT_ENABLED === 'true',
      FALLBACK_ENABLED: configMap.FALLBACK_ENABLED === 'true'
    };
    
    // Cache the config
    cachedConfig = config;
    lastFetchTime = now;
    
    console.log('[Config] Loaded fallback config from DB:', config);
    return config;
    
  } catch (error) {
    console.error('[Config] Error loading fallback config:', error);
    // Fallback to environment variables
    return getFallbackConfigFromEnv();
  }
}

// Fallback to environment variables if DB fails
function getFallbackConfigFromEnv(): FallbackConfig {
  console.log('[Config] Falling back to environment variables');
  
  return {
    SMS_MAX_PER_HOUR: parseInt(process.env.SMS_MAX_PER_HOUR || '10'),
    SMS_WINDOW_HOURS: parseInt(process.env.SMS_WINDOW_HOURS || '1'),
    SMS_SUPPORTED_COUNTRIES: (process.env.SMS_SUPPORTED_COUNTRIES || 'US,IN').split(','),
    SMS_RATE_LIMIT_ENABLED: process.env.SMS_RATE_LIMIT_ENABLED === 'true',
    FALLBACK_ENABLED: process.env.FALLBACK_ENABLED === 'true'
  };
}

// Function to refresh config cache (useful for testing)
export async function refreshFallbackConfig(): Promise<void> {
  cachedConfig = null;
  lastFetchTime = 0;
  await getFallbackConfig();
} 