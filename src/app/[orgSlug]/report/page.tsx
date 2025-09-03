'use client';

// Path: src/app/[orgSlug]/report/page.tsx
// Printable Infrastructure report (browser print -> Save as PDF)

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { infraPercent, SanityLevel } from '@/lib/scoring';

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
  weight: number | null;
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
      // 1) Resolve organization by slug (or swap to .eq('id', orgSlug) if your URL is the UUID)
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', orgSlug)
        .maybeSingle();

      if (cancelled) return;

      if (orgErr || !org?.id) {
        setLoading(false);
        return;
      }

      setOrgId(org.id);
      setOrgName(org.name ?? org.slug ?? '');

      // 2) Fetch sanity blocks (include weight for scoring)
      const [{ data: fw }, { data: sw }] = await Promise.all([
        supabase
          .from('firewalls')
          .select('sanity_icon, status, risk, solution, weight')
          .eq('client_id', org.id)
          .maybeSingle(),
        supabase
          .from('switches')
          .select('sanity_icon, status, risk, solution, weight')
          .eq('client_id', org.id)
          .maybeSingle(),
      ]);

      setFirewall(
        fw
          ? {
              sanity_icon: (fw.sanity_icon ?? null) as SanityLevel | null,
              status: fw.status ?? null,
              risk: fw.risk ?? null,
              solution: fw.solution ?? null,
              weight: fw.weight ?? null,
            }
          : null
      );
      setSwitches(
        sw
          ? {
              sanity_icon: (sw.sanity_icon ?? null) as SanityLevel | null,
              status: sw.status ?? null,
              risk: sw.risk ?? null,
              solution: sw.solution ?? null,
              weight: sw.weight ?? null,
            }
          : null
      );

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [orgSlug, supabase]);

  const infraPct = useMemo(() => {
    return infraPercent(
      firewall ? { sanity_icon: firewall.sanity_icon, weight: firewall.weight } : null,
      switches ? { sanity_icon: switches.sanity_icon, weight: switches.weight } : null
    );
  }, [firewall, switches]);

  function onPrint() {
    window.print();
  }

  if (loading) return <div>Loading…</div>;

  const rows: Array<{ name: 'Switches' | 'Firewall'; data: SanityBlock | null }> = [
    { name: 'Switches', data: switches },
    { name: 'Firewall', data: firewall },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Toolbar (hidden when printing) */}
      <div
        className="no-print"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
      >
        <div>
          <a href={`/${orgSlug}`}>&larr; Back</a>
        </div>
        <button onClick={onPrint} style={{ padding: '10px 16px' }}>
          Print / Save as PDF
        </button>
      </div>

      {/* Header */}
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>{orgName || orgSlug}</h1>
        <div style={{ color: '#666', fontSize: 14 }}>
          Generated: {new Date().toLocaleString()}
        </div>
      </header>

      {/* Section title with % */}
      <h2 style={{ marginTop: 24, marginBottom: 12 }}>
        INFRASTRUCTURE {infraPct === null ? '' : `— ${infraPct}%`}
      </h2>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['', 'Icon', 'Risk', 'Status', 'Solution'].map((h) => (
              <th
                key={h}
                style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px 6px' }}
              >
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
                <td
                  style={{ borderBottom: '1px solid #ddd', padding: '8px 6px', fontWeight: 600 }}
                >
                  {row.name}
                </td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px 6px' }}>{iconText}</td>
                <td
                  style={{ borderBottom: '1px solid #ddd', padding: '8px 6px', whiteSpace: 'pre-wrap' }}
                >
                  {risk}
                </td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px 6px' }}>{status}</td>
                <td
                  style={{ borderBottom: '1px solid #ddd', padding: '8px 6px', whiteSpace: 'pre-wrap' }}
                >
                  {solution}
                </td>
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
