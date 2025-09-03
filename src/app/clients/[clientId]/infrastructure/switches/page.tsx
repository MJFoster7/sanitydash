'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/src/lib/supabase-browser';
import { useParams } from 'next/navigation';

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
  const params = useParams() as { clientId: string };
  const clientId = params.clientId;
  const supabase = getSupabaseBrowser();

  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from('switches')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (!ignore) {
        if (error && error.code !== 'PGRST116') {
          setMessage(`Load error: ${error.message}`);
        } else if (data) {
          setForm({
            ip_address: data.ip_address ?? '',
            firmware_version: data.firmware_version ?? '',
            make: data.make ?? '',
            model: data.model ?? '',
            notes: data.notes ?? '',
            sanity_icon: (data.sanity_icon as FormState['sanity_icon']) ?? 'warning',
            status: data.status ?? '',
            risk: data.risk ?? '',
            solution: data.solution ?? '',
            weight: data.weight ?? 5,
          });
        }
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [clientId, supabase]);

  async function onSave() {
    setSaving(true);
    setMessage(null);

    const payload = { client_id: clientId, ...form, weight: Number(form.weight) };

    const { error } = await supabase
      .from('switches')
      .upsert(payload, { onConflict: 'client_id' });

    setSaving(false);
    if (error) setMessage(`Save error: ${error.message}`);
    else setMessage('Saved ✓');
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
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
        <button onClick={onSave} disabled={saving} style={{ marginTop: 16, padding: '10px 16px' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {message && <div style={{ marginTop: 8 }}>{message}</div>}
      </section>

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
            <input value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            <div>Risk</div>
            <textarea value={form.risk} onChange={e => setForm({ ...form, risk: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            <div>Solution</div>
            <textarea value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            <div>Weight (1–10)</div>
            <select value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} style={{ width: '100%', padding: 8 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </aside>
    </div>
  );
}
