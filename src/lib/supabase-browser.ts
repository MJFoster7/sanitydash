// src/lib/supabase-browser.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}
