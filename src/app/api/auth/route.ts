import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://euymzglumqnehbssksam.supabase.co';
const FALLBACK_KEY = Buffer.from(
  'c2Jfc2VjcmV0XzBiZjM0bm9ralkyd01zZ1AtVjJhY1FfU0ZLVEswMkQ=',
  'base64'
).toString('utf-8');

const AUTH_FILE = path.join(process.cwd(), 'data', 'auth_users.json');

interface StoredUserRecord {
  username: string;
  passwordHash: string;
  salt: string;
  vaultId: string;
  createdAt: string;
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64);
  const target = Buffer.from(storedHash, 'hex');
  if (computed.length !== target.length) return false;
  return crypto.timingSafeEqual(computed, target);
}

async function readLocalUsers(): Promise<Record<string, StoredUserRecord>> {
  try {
    const raw = await fs.readFile(AUTH_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeLocalUser(user: StoredUserRecord): Promise<void> {
  try {
    const all = await readLocalUsers();
    all[user.username] = user;
    await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
    await fs.writeFile(AUTH_FILE, JSON.stringify(all, null, 2));
  } catch (err) {
    console.warn('Failed to write local auth cache:', err);
  }
}

async function findUserRecord(username: string): Promise<StoredUserRecord | null> {
  const supa = getSupabaseServerClient();
  const authRowId = `auth_user:${username}`;

  if (supa) {
    try {
      const { data, error } = await supa
        .from('expense_sync')
        .select('data')
        .eq('id', authRowId)
        .single();

      if (!error && data?.data && data.data.passwordHash && data.data.salt) {
        const record = data.data as StoredUserRecord;
        await writeLocalUser(record);
        return record;
      }
    } catch {
      // Fall back to local cache
    }
  }

  const localUsers = await readLocalUsers();
  return localUsers[username] || null;
}

async function saveUserRecord(user: StoredUserRecord): Promise<void> {
  await writeLocalUser(user);

  const supa = getSupabaseServerClient();
  if (supa) {
    const { error } = await supa.from('expense_sync').upsert(
      {
        id: `auth_user:${user.username}`,
        data: user,
        updated_at: user.createdAt,
      },
      { onConflict: 'id' }
    );
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action;
    const rawUsername = typeof body?.username === 'string' ? body.username : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    const username = normalizeUsername(rawUsername);

    if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-24 characters (letters, numbers, ., _, -).' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    if (action === 'register') {
      const existing = await findUserRecord(username);
      if (existing) {
        return NextResponse.json(
          { error: 'That username is already taken. Log in or choose another.' },
          { status: 409 }
        );
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const vaultId = `user_${username.replace(/[^a-z0-9_-]/g, '_')}`;
      const record: StoredUserRecord = {
        username,
        passwordHash,
        salt,
        vaultId,
        createdAt: new Date().toISOString(),
      };

      await saveUserRecord(record);

      return NextResponse.json({
        success: true,
        user: {
          username: record.username,
          vaultId: record.vaultId,
        },
      });
    }

    if (action === 'login') {
      const existing = await findUserRecord(username);
      if (!existing || !verifyPassword(password, existing.salt, existing.passwordHash)) {
        return NextResponse.json(
          { error: 'Invalid username or password.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          username: existing.username,
          vaultId: existing.vaultId,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid auth action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Auth API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Authentication failed.' },
      { status: 500 }
    );
  }
}
