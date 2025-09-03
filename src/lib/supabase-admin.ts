import { createClient } from "@supabase/supabase-js";

function required(name: string, v?: string) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function supabaseAdmin() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const svc = required("SUPABASE_SERVICE_ROLE", process.env.SUPABASE_SERVICE_ROLE);
  return createClient(url, svc, { auth: { persistSession: false } });
}
