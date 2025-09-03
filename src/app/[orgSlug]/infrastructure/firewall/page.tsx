'use client';

// Path: src/app/[orgSlug]/infrastructure/firewall/page.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type FormState = {
  ip_address: string;
  firmware_version: string;
  make: string;
  model: string;
  notes: string;
  sanity_icon: 'good' | 'warning' | 'critical';
  status: string;
  risk: string;
  solution: string;
  weight: number;
};

const defaultState: FormState = {
  ip_address: '',
  firmware_version: '',
  make: '',
  model: '',
  notes: '',
  sanity_icon: 'warning',
  status: '',
  risk: '',
  solution: '',
  weight: 5,
};

export default function FirewallPage() {
  const { orgSlug } = useParams() as { orgSlug: string };
  const supabase = getSupabaseBrowser();

  const [orgId, setOrgId] = useState<string | null>(null); // UUID resolved from "organizations"
  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Resolve organization UUID from slug, then load existing firewall record (one-per-org POC)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) Lookup organization UUID by slug
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug) // If your URL uses the UUID, change to .eq('id', orgSlug)
        .maybeSingle();

      if (cancelled) return;

      if (orgErr) {
        setMessage(`Organization lookup error: ${orgErr.message}`);
        setLoading(false);
        return;
      }
      if (!org?.id) {
        setMessage('Organization not found for this slug.');
        setLoading(false);
        return;
      }

      setOrgId(org.id);

      // 2) Load existing firewall row (unique on client_id/org_id for POC)
      const { data: fw, error: fwErr } = await supabase
        .from('firewalls')
        .select('*')
        .eq('client_id', org.id)
        .maybeSingle();

      if (cancelled) return;

      if (fwErr && fwErr.code !== 'PGRST116') {
        setMessage(`Load error: ${fwErr.message}`);
      } else if (fw) {
        setForm({
          ip_address: fw.ip_address ?? '',
          firmware_version: fw.firmware_version ?? '',
          make: fw.make ?? '',
          model: fw.model ?? '',
          notes: fw.notes ?? '',
          sanity_icon: (fw.sanity_icon as FormState['sanity_icon']) ?? 'warning',
          status: fw.status ?? '',
          risk: fw.risk ?? '',
          solution: fw.solution ?? '',
          weight: fw.weight ?? 5,
        });
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [orgSlug, supabase]);

  async function onSave() {
    if (!orgId) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      client_id: orgId, // using client_id as "organization_id" for POC
      ...form,
      weight: Number(form.weight),
    };

    const { error } = await supabase
      .from('firewalls')
      .upsert(payload, { onConflict: 'client_id' }); // requires unique index on firewalls(client_id)

    setSaving(false);
    setMessage(error ? `Save error: ${error.message}` : 'Saved ✓');
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
      {/* Left: Device details */}
      <section>
        <h2 style={{ marginBottom: 12 }}>Firewall</h2>
        <div style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
          <label>
            <div>IP Address</div>
            <input
              value={form.ip_address}
              onChange={e => setForm({ ...form, ip_address: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
          <label>
            <div>Firmware Version</div>
            <input
              value={form.firmware_version}
              onChange={e => setForm({ ...form, firmware_version: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
          <label>
            <div>Make</div>
            <input
              value={form.make}
              onChange={e => setForm({ ...form, make: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
          <label>
            <div>Model</div>
            <input
              value={form.model}
              onChange={e => setForm({ ...form, model: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
          <label>
            <div>Notes</div>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <button
          onClick={onSave}
          disabled={saving || !orgId}
          style={{ marginTop: 16, padding: '10px 16px' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {message && <div style={{ marginTop: 8 }}>{message}</div>}
      </section>

      {/* Right: Sanity Check */}
      <aside style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, height: 'fit-content' }}>
        <h3>Sanity Check</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div>Icon</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setForm({ ...form, sanity_icon: 'good' })} aria-pressed={form.sanity_icon === 'good'}>✅</button>
              <button type="button" onClick={() => setForm({ ...form, sanity_icon: 'warning' })} aria-pressed={form.sanity_icon === 'warning'}>⚠️</button>
              <button type="button" onClick={() => setForm({ ...form, sanity_icon: 'critical' })} aria-pressed={form.sanity_icon === 'critical'}>💣</button>
            </div>
          </label>

          <label>
            <div>Status</div>
            <input
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </label>

          <label>
            <div>Risk</div>
            <textarea
              value={form.risk}
              onChange={e => setForm({ ...form, risk: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: 8 }}
            />
          </label>

          <label>
            <div>Solution</div>
            <textarea
              value={form.solution}
              onChange={e => setForm({ ...form, solution: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: 8 }}
            />
          </label>

          <label>
            <div>Weight (1–10)</div>
            <select
              value={form.weight}
              onChange={e => setForm({ ...form, weight: Number(e.target.value) })}
              style={{ width: '100%', padding: 8 }}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </aside>
    </div>
  );
}
