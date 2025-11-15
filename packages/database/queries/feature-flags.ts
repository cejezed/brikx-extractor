// Feature flags queries
import { getSupabaseClient } from '../client.js';
import type { FeatureFlag } from '../types/database.js';

/**
 * Get feature flag by name
 */
export async function getFeatureFlag(flagName: string): Promise<FeatureFlag | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_name', flagName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(flagName: string): Promise<boolean> {
  const flag = await getFeatureFlag(flagName);
  return flag?.enabled ?? false;
}

/**
 * Get feature flag config
 */
export async function getFeatureConfig<T = Record<string, any>>(flagName: string): Promise<T | null> {
  const flag = await getFeatureFlag(flagName);
  return flag?.config as T | null;
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from('feature_flags').select('*').order('flag_name');

  if (error) throw error;
  return data || [];
}

/**
 * Update feature flag
 */
export async function updateFeatureFlag(
  flagName: string,
  updates: { enabled?: boolean; config?: Record<string, any> },
  updatedBy?: string
): Promise<FeatureFlag> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .update({
      ...updates,
      updated_by: updatedBy,
    } as any)
    .eq('flag_name', flagName)
    .select()
    .single();

  if (error) throw error;
  return data as FeatureFlag;
}

/**
 * Brikx export configuration helper
 */
export async function getBrikxExportConfig(): Promise<{
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
} | null> {
  const flag = await getFeatureFlag('brikx_export');

  if (!flag || !flag.enabled) {
    return null;
  }

  const config = flag.config as { apiUrl?: string; apiKey?: string };

  if (!config.apiUrl || !config.apiKey) {
    console.warn('Brikx export is enabled but missing apiUrl or apiKey in config');
    return null;
  }

  return {
    enabled: true,
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
  };
}
