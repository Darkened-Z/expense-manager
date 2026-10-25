import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DATA_FILE = path.join(process.cwd(), 'data', 'sync_vault.json');

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const passkey = searchParams.get('passkey');
    const vaultId = (passkey && passkey.trim().length >= 4)
      ? passkey.trim().toUpperCase()
      : (process.env.NEXT_PUBLIC_SUPABASE_VAULT_ID || 'main');

    // 1. Try reading from local file cache first (instant local LAN sync for mobile)
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id === vaultId || !parsed.id) && parsed.data) {
        return NextResponse.json({
          success: true,
          source: 'local_disk',
          data: parsed.data,
          lastSyncedAt: parsed.updatedAt || parsed.data?.updatedAt || new Date().toISOString(),
        });
      }
    } catch {
      // Local cache not populated yet, fall through to Supabase
    }

    // 2. Query Supabase
    const supa = getSupabaseServerClient();
    if (supa) {
      try {
        const { data, error } = await supa
          .from('expense_sync')
          .select('data, updated_at')
          .eq('id', vaultId)
          .single();

        if (!error && data?.data) {
          // Cache to local file for instant subsequent mobile requests
          try {
            await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
            await fs.writeFile(
              DATA_FILE,
              JSON.stringify({ id: vaultId, data: data.data, updatedAt: data.updated_at }, null, 2)
            );
          } catch {
            // Ignore write cache error
          }

          return NextResponse.json({
            success: true,
            source: 'supabase',
            data: data.data,
            lastSyncedAt: data.updated_at,
          });
        }
      } catch (supaErr) {
        console.warn('Supabase fetch failed in /api/sync GET:', supaErr);
      }
    }

    return NextResponse.json({
      success: false,
      notFound: true,
      message: 'No cloud sync record found yet.',
    });
  } catch (error) {
    console.error('Sync API GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to process sync fetch request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey, data } = body;

    const vaultId = (passkey && typeof passkey === 'string' && passkey.trim().length >= 4)
      ? passkey.trim().toUpperCase()
      : (process.env.NEXT_PUBLIC_SUPABASE_VAULT_ID || 'main');

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Valid sync data payload required' },
        { status: 400 }
      );
    }

    const updatedAt = new Date().toISOString();
    const payloadWithTime = { ...data, updatedAt };

    // 1. Save immediately to local disk cache
    try {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(
        DATA_FILE,
        JSON.stringify({ id: vaultId, data: payloadWithTime, updatedAt }, null, 2)
      );
    } catch (fsErr) {
      console.error('Failed to write local sync file:', fsErr);
    }

    // 2. Also persist to Supabase in background
    const supa = getSupabaseServerClient();
    if (supa) {
      try {
        await supa.from('expense_sync').upsert(
          {
            id: vaultId,
            data: payloadWithTime,
            updated_at: updatedAt,
          },
          { onConflict: 'id' }
        );
      } catch (supaErr) {
        console.error('Failed to upsert to Supabase in /api/sync POST:', supaErr);
      }
    }

    return NextResponse.json({
      success: true,
      lastSyncedAt: updatedAt,
      message: 'Cloud vault synchronized successfully.',
    });
  } catch (error) {
    console.error('Sync API POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process sync request' },
      { status: 500 }
    );
  }
}
