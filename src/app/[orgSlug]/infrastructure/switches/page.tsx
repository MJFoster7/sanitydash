'use client';

// Path: src/app/[orgSlug]/infrastructure/switches/page.tsx

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

export default function SwitchesPage() {
  const { orgSlug } = useParams() as { orgSlug: string };
  const supabase = getSupabaseBrowser();

  const [clientId, setClientId] = useState<string | null>(null); // UUID resolved from slug
  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 1) Resolve client UUID from slug, then load existing "switches" record (one-per-client POC)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Lookup client UUID
      const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)   // make sure your "organizations" table has a column called "slug"
      .maybeSingle();

      if (cancelled) return;

      if (clientErr) {
        setMessage(`Client lookup error: ${clientErr.message}`);
        setLoading(false);
        return;
      }
      if (!client?.id) {
        setMessage('Client not found for this slug.');
        setLoading(false);
        return;
      }

      setClientId(client.id);

      // Load existing switches row (unique on client_id for POC)
      const { data: sw, error: swErr } = await supabase
        .from('switches')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle();

      if (cancelled) return;

      if (swErr && swErr.code !== 'PGRST116') {
        setMessage(`Load error: ${swErr.message}`);
      } else if (sw) {
        setForm({
          ip_address: sw.ip_address ?? '',
          firmware_version: sw.firmware_version ?? '',
          make: sw.make ?? '',
          model: sw.model ?? '',
          notes: sw.notes ?? '',
          sanity_icon: (sw.sanity_icon as FormState['sanity_icon']) ?? 'warning',
          status: sw.status ?? '',
          risk: sw.risk ?? '',
          solution: sw.solution ?? '',
          weight: sw.weight ?? 5,
        });
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [orgSlug, supabase]);

  async function onSave() {
    if (!clientId) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      client_id: clientId,
      ...form,
      weight: Number(form.weight),
    };

    const { error } = await supabase
      .from('switches')
      .upsert(payload, { onConflict: 'client_id' }); // requires a unique index on switches(client_id)

    setSaving(false);
    setMessage(error ? `Save error: ${error.message}` : 'Saved ✓');
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
      {/* Left: Device details */}
      <section>
        <h2 style={{ marginBottom: 12 }}>Switches</h2>
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
          disabled={saving || !clientId}
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
              <button
                type="button"
                onClick={() => setForm({ ...form, sanity_icon: 'good' })}
                aria-pressed={form.sanity_icon === 'good'}
              >
                ✅
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, sanity_icon: 'warning' })}
                aria-pressed={form.sanity_icon === 'warning'}
              >
                ⚠️
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, sanity_icon: 'critical' })}
                aria-pressed={form.sanity_icon === 'critical'}
              >
                💣
              </button>
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
