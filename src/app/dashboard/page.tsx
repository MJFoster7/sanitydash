export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { NewClientForm } from "../../components/NewClientForm";

export default async function DashboardPage() {
  let orgs: any[] = [];
  let err: string | null = null;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false });
    if (error) err = error.message;
    else orgs = data ?? [];
  } catch (e: any) {
    err = e?.message ?? "Server error";
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Clients</h1>
      <p style={{ color: "#666" }}>Select a client or add a new one.</p>

      <section style={{ margin: "16px 0 24px", border: "1px solid #eee", padding: 16, borderRadius: 12 }}>
        <NewClientForm />
      </section>

      {err && <div style={{ color: "crimson", marginBottom: 12 }}>Error: {err}</div>}

      {orgs.length ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {orgs.map((o) => (
            <li key={o.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{o.name}</div>
              <div style={{ color: "#777", fontSize: 12, marginBottom: 10 }}>{o.slug}</div>
              <Link href={`/${o.slug}`} style={{ fontSize: 14, color: "#2563eb", textDecoration: "none" }}>
                Open client →
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: "#777" }}>No clients yet. Add one above.</div>
      )}
    </main>
  );
}
