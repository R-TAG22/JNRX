import { createClient } from '@supabase/supabase-js';

// Supabase Project Configuration
export const SUPABASE_PROJECT_ID = 'fyswcrgzryzzimdrdvhm';

// Safely retrieve environment variable across browser, Vite, and Node runtimes
const getEnvVar = (key: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return String(import.meta.env[key]).trim();
    }
  } catch {
    // import.meta.env unavailable
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {
    // process.env unavailable
  }
  return fallback;
};

// Normalizes the project URL by stripping any accidental /rest/v1 or trailing slashes
const rawUrl = getEnvVar('VITE_SUPABASE_URL', 'https://fyswcrgzryzzimdrdvhm.supabase.co');
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

// Anon / Public API Key
export const SUPABASE_ANON_KEY = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5c3djcmd6cnl6emltZHJkdmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjgwNzksImV4cCI6MjEwODMwNDA3OX0.bXl8Jyw8J4jx4A7NRepjvPc1rymgVaIecYzCpVkRfEI'
);

// Export the singleton Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'jnrx_supabase_auth_token',
  },
});

export interface SupabaseInquiry {
  id?: string;
  name: string;
  email: string;
  store_url?: string;
  package_tier: string;
  message?: string;
  status?: string;
  created_at?: string;
}

const LOCAL_INQUIRIES_KEY = 'jnrx_local_inquiries';

// Helper: Test live connection to Supabase
export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  status: number;
  message: string;
  latencyMs: number;
}> {
  const start = performance.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });
    const latencyMs = Math.round(performance.now() - start);
    if (res.ok) {
      return { ok: true, status: res.status, message: 'Connected to Supabase GoTrue Auth API', latencyMs };
    }
    return { ok: false, status: res.status, message: `Supabase returned HTTP ${res.status}`, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, status: 0, message: err instanceof Error ? err.message : 'Connection failed', latencyMs };
  }
}

// Helper: Submit Project Inquiry to Supabase with local fallback
export async function submitProjectInquiry(inquiry: {
  name: string;
  email: string;
  storeUrl?: string;
  packageTier: string;
  message?: string;
}): Promise<{ success: boolean; id: string; source: 'supabase' | 'local' }> {
  const newId = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const record: SupabaseInquiry = {
    id: newId,
    name: inquiry.name,
    email: inquiry.email,
    store_url: inquiry.storeUrl || '',
    package_tier: inquiry.packageTier,
    message: inquiry.message || '',
    created_at: new Date().toISOString(),
  };

  // Always save a local copy to guarantee zero data loss
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_INQUIRIES_KEY) || '[]');
      localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify([record, ...existing]));
    } catch (e) {
      console.warn('Could not cache inquiry locally:', e);
    }
  }

  // Attempt Supabase insert
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert([
        {
          name: record.name,
          email: record.email,
          store_url: record.store_url,
          package_tier: record.package_tier,
          message: record.message,
          created_at: record.created_at,
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase inquiries table insert (cached locally):', error.message);
      return { success: true, id: newId, source: 'local' };
    }

    const insertedId = data?.[0]?.id || newId;
    return { success: true, id: String(insertedId), source: 'supabase' };
  } catch (err) {
    console.warn('Supabase inquiry submission fallback to local storage:', err);
    return { success: true, id: newId, source: 'local' };
  }
}

// Helper: Fetch All Inquiries (from Supabase, or local fallback)
export async function fetchProjectInquiries(): Promise<SupabaseInquiry[]> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as SupabaseInquiry[];
    }
  } catch (e) {
    console.warn('Could not fetch inquiries from Supabase, reading local cache:', e);
  }

  // Fallback to local inquiries
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const local = localStorage.getItem(LOCAL_INQUIRIES_KEY);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Helper: Update Inquiry Status in Supabase & Local Cache
export async function updateInquiryStatus(id: string, status: string): Promise<boolean> {
  // Update local cache
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const local: SupabaseInquiry[] = JSON.parse(localStorage.getItem(LOCAL_INQUIRIES_KEY) || '[]');
      const updated = local.map((inq) => (inq.id === id ? { ...inq, status } : inq));
      localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore cache error
    }
  }

  // Update in Supabase
  try {
    const { error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.warn('Supabase inquiry update error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Could not update inquiry status in Supabase:', e);
    return false;
  }
}

// Helper: Delete Inquiry from Supabase & Local Cache
export async function deleteInquiry(id: string): Promise<boolean> {
  // Delete from local cache
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const local: SupabaseInquiry[] = JSON.parse(localStorage.getItem(LOCAL_INQUIRIES_KEY) || '[]');
      const filtered = local.filter((inq) => inq.id !== id);
      localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore cache error
    }
  }

  // Delete from Supabase
  try {
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase inquiry delete error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Could not delete inquiry from Supabase:', e);
    return false;
  }
}

