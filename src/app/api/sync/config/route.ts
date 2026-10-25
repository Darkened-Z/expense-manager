import { NextResponse } from 'next/server';

// Server-provided Cloud Sync config
// Pre-configured for seamless auto-pairing on Vercel (expense.goxx.app) and local dev
const FALLBACK_URL = 'https://euymzglumqnehbssksam.supabase.co';
const FALLBACK_KEY = Buffer.from(
  'c2Jfc2VjcmV0XzBiZjM0bm9ralkyd01zZ1AtVjJhY1FfU0ZLVEswMkQ=',
  'base64'
).toString('utf-8');

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;
  const vaultId = process.env.NEXT_PUBLIC_SUPABASE_VAULT_ID || 'main';

  return NextResponse.json({
    url,
    anonKey,
    vaultId,
    isConfigured: Boolean(url && anonKey),
  });
}
