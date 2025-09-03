export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseAdmin } from "../../lib/supabase-admin";

async function getOrg(slug: string) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export default async function OrgHome({ params }: { params: { orgSlug: string } }) {
  const org = await getOrg(params.orgSlug);
  if (!org) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Client not found</h1>
        <p><Link href="/dashboard">Back to Dashboard</Link></p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 0 }}>{org.name}</h1>
      <div style={{ color: "#777", fontSize: 12 }}>{org.slug}</div>

      <div style={{ marginTop: 16 }}>
        <Link href="/dashboard" style={{ color: "#2563eb" }}>← Back to Dashboard</Link>
      </div>

      <div style={{ marginTop: 24, color: "#777" }}>
        Placeholder: we’ll add sidebar & pages next once this is green.
      </div>
    </main>
  );
}
