'use client';

// Path: src/app/[orgSlug]/report/page.tsx
// Renders a printable report for the organization under [orgSlug].
// Use the browser's "Save as PDF" via the Print button.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type SanityLevel = 'good' | 'warning' | 'critical';

const ICONS: Record<SanityLevel, string> = {
  good: '✅',
  warning: '⚠️',
  critical: '💣',
};

const LABELS: Record<SanityLevel, string> = {
  good: 'Good',
  warning: 'Warning',
  critical: 'Critical',
};

type SanityBlock = {
  sanity_icon: SanityLevel | null;
  status: string | null;
  risk: string | null;
  solution: string | null;
};

type InfraRow = {
  name: 'Switches' | 'Firewall';
  data: SanityBlock | null;
};

export default function ReportPage() {
  const { orgSlug } = useParams() as { orgSlug: string };
  const supabase = getSupabaseBrowser();

  const [orgName, setOrgName] = useState<string>('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [firewall, setFirewall] = useState<SanityBlock | null>(null);
  const [switches, setSwitches] = useState<SanityBlock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Resolve organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', orgSlug) // if URL uses UUID, change to .eq('id', orgSlug)
        .maybeSingle();

      if (cancelled) return;

      if (orgErr || !org?.id) {
        setLoading(false);
        return;
      }

      setOrgId(org.id);
      setOrgName(org.name ?? org.slug ?? '');

      // 2) Fetch infra sanity for Firewall and Switches
      const [{ data: fw }, { data: sw }] = await Promise.all([
        supabase
          .from('firewalls')
          .select('sanity_icon, status, risk, solution')
          .eq('client_id', org.id)
          .maybeSingle(),
        supabase
          .from('switches')
          .select('sanity_icon, status, risk, solution')
          .eq('client_id', org.id)
          .maybeSingle(),
      ]);

      setFirewall(fw ?? null);
      setSwitches(sw ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [orgSlug, supabase]);

  const rows: InfraRow[] = useMemo(
    () => [
      { name: 'Switches', data: switches },
      { name: 'Firewall', data: firewall },
    ],
    [firewall, switches]
  );

  if (loading) return <div>Loading…</div>;

  function onPrint() {
    window.print();
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Toolbar (hidden in PDF) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <a href={`/${orgSlug}`}>&larr; Back</a>
        </div>
        <button onClick={onPrint} style={{ padding: '10px 16px' }}>Print / Save as PDF</button>
      </div>

      {/* Header */}
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>{orgName || orgSlug}</h1>
        <div style={{ color: '#666', fontSize: 14 }}>
          Generated: {new Date().toLocaleString()}
        </div>
      </header>

      {/* Title */}
      <h2 style={{ marginTop: 24, marginBottom: 12 }}>INFRASTRUCTURE</h2>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['', 'Icon', 'Risk', 'Status', 'Solution'].map((h) => (
              <th key={h} style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px 6px' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const icon = row.data?.sanity_icon ?? null;
            const iconText = icon ? `${ICONS[icon]} ${LABELS[icon]}` : '—';
            const risk = row.data?.risk || '—';
            const status = row.data?.status || '—';
            const solution = row.data?.solution || '—';
            return (
              <tr key={row.name}>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px 6px', fontWeight: 600 }}>{row.name}</td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px 6px' }}>{iconText}</td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px 6px', whiteSpace: 'pre-wrap' }}>{risk}</td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px 6px' }}>{status}</td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px 6px', whiteSpace: 'pre-wrap' }}>{solution}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 16mm; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>
    </div>
  );
}
