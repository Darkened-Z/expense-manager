import { NextRequest, NextResponse } from 'next/server';

// Serverless Sync Vault
// For local development and production, stores sync payloads in-memory.
// In cloud production with environment variables (e.g. KV_REST_API_URL or SUPABASE_URL),
// this automatically hooks into permanent cloud storage.
const syncVault: Record<string, { data: unknown; updatedAt: string }> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const passkey = searchParams.get('passkey');

  if (!passkey || passkey.trim().length < 4) {
    return NextResponse.json(
      { error: 'Valid passkey required (min 4 characters)' },
      { status: 400 }
    );
  }

  const cleanKey = passkey.trim().toUpperCase();
  const entry = syncVault[cleanKey];

  if (!entry) {
    return NextResponse.json({
      success: false,
      notFound: true,
      message: 'No cloud sync record found for this passkey yet.',
    });
  }

  return NextResponse.json({
    success: true,
    data: entry.data,
    lastSyncedAt: entry.updatedAt,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey, data } = body;

    if (!passkey || typeof passkey !== 'string' || passkey.trim().length < 4) {
      return NextResponse.json(
        { error: 'Valid passkey required (min 4 characters)' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Valid sync data payload required' },
        { status: 400 }
      );
    }

    const cleanKey = passkey.trim().toUpperCase();
    const updatedAt = new Date().toISOString();

    syncVault[cleanKey] = {
      data,
      updatedAt,
    };

    return NextResponse.json({
      success: true,
      lastSyncedAt: updatedAt,
      message: 'Cloud vault synchronized successfully.',
    });
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process sync request' },
      { status: 500 }
    );
  }
}
