import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  vaultId: string;
}

const STORAGE_KEYS = {
  SUPABASE_URL: 'expense_manager_supabase_url',
  SUPABASE_KEY: 'expense_manager_supabase_key',
  SUPABASE_VAULT_ID: 'expense_manager_supabase_vault_id',
};

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      vaultId: process.env.NEXT_PUBLIC_SUPABASE_VAULT_ID || 'main',
    };
  }

  const storedUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const storedKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY);
  const storedVaultId = localStorage.getItem(STORAGE_KEYS.SUPABASE_VAULT_ID);

  return {
    url: storedUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: storedKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    vaultId: storedVaultId || process.env.NEXT_PUBLIC_SUPABASE_VAULT_ID || 'main',
  };
}

export function saveSupabaseConfig(config: Partial<SupabaseConfig>): void {
  if (typeof window === 'undefined') return;

  if (config.url !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, config.url.trim());
  }
  if (config.anonKey !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, config.anonKey.trim());
  }
  if (config.vaultId !== undefined) {
    const cleanVault = config.vaultId.trim() || 'main';
    localStorage.setItem(STORAGE_KEYS.SUPABASE_VAULT_ID, cleanVault);
  }

  // Invalidate client cache
  cachedClient = null;
  cachedConfigKey = '';
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey || !config.url.startsWith('http')) {
    return null;
  }

  const currentKey = `${config.url}_${config.anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
      },
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export interface SyncPayload {
  transactions: any[];
  reminders: any[];
  categories: any[];
  wallets: any[];
  savingsGoals: any[];
  simpleSavings: any[];
  settings: any;
  updatedAt: string;
}

export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  const targetConfig = config || getSupabaseConfig();
  if (!targetConfig.url || !targetConfig.anonKey) {
    return { success: false, message: 'Please enter both Supabase URL and Anon Key' };
  }

  try {
    const client = createClient(targetConfig.url, targetConfig.anonKey, {
      auth: { persistSession: false },
    });

    const { error } = await client
      .from('expense_sync')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "expense_sync" does not exist') || error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but the "expense_sync" table is not created yet. Run the SQL snippet below in Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || 'Unknown network error'}` };
  }
}

export async function pushToSupabase(payload: SyncPayload): Promise<{ success: boolean; message: string; lastSyncedAt?: string }> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!client || !config.vaultId) {
    return { success: false, message: 'Supabase is not configured' };
  }

  try {
    const updatedAt = new Date().toISOString();
    const cleanPayload = { ...payload, updatedAt };

    const { error } = await client
      .from('expense_sync')
      .upsert(
        {
          id: config.vaultId,
          data: cleanPayload,
          updated_at: updatedAt,
        },
        { onConflict: 'id' }
      );

    if (error) {
      return { success: false, message: `Upload failed: ${error.message}` };
    }

    return { success: true, message: 'Auto-synced to Supabase', lastSyncedAt: updatedAt };
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function pullFromSupabase(): Promise<{ success: boolean; data?: SyncPayload; message: string; lastSyncedAt?: string }> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!client || !config.vaultId) {
    return { success: false, message: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await client
      .from('expense_sync')
      .select('data, updated_at')
      .eq('id', config.vaultId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found yet
        return { success: false, message: 'No sync data found for this Vault ID yet. It will be created on your first change.' };
      }
      return { success: false, message: `Fetch failed: ${error.message}` };
    }

    if (!data?.data) {
      return { success: false, message: 'No payload data in record' };
    }

    return {
      success: true,
      data: data.data as SyncPayload,
      message: 'Successfully pulled from Supabase',
      lastSyncedAt: data.updated_at,
    };
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export function subscribeToSupabaseUpdates(onUpdate: (payload: SyncPayload) => void): () => void {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!client || !config.vaultId) {
    return () => {};
  }

  try {
    const channel = client
      .channel('expense_sync_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_sync',
          filter: `id=eq.${config.vaultId}`,
        },
        (change) => {
          if (change.new && (change.new as any).data) {
            onUpdate((change.new as any).data as SyncPayload);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Could not subscribe to Supabase realtime channel:', err);
    return () => {};
  }
}
