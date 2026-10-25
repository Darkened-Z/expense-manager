import { NextResponse } from 'next/server';

// Automatic server-provided Cloud Sync config
// Allows mobile devices and all browsers accessing the app to auto-configure Supabase sync
// without requiring any manual setup, key entry, or special query parameters.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const vaultId = process.env.NEXT_PUBLIC_SUPABASE_VAULT_ID || 'main';

  return NextResponse.json({
    url,
    anonKey,
    vaultId,
    isConfigured: Boolean(url && anonKey),
  });
}
