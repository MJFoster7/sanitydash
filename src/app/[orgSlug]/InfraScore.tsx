'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { infraPercent } from '@/lib/scoring';

export default function InfraScore({ orgSlug }: { orgSlug: string }) {
  const supabase = getSupabaseBrowser();
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      // Resolve org id
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .maybeSingle();
      if (!org?.id || cancel) return;

      const [{ data: fw }, { data: sw }] = await Promise.all([
        supabase.from('firewalls')
          .select('sanity_icon, weight')
          .eq('client_id', org.id)
          .maybeSingle(),
        supabase.from('switches')
          .select('sanity_icon, weight')
          .eq('client_id', org.id)
          .maybeSingle(),
      ]);

      const p = infraPercent(
        fw ? { sanity_icon: fw.sanity_icon, weight: fw.weight } : null,
        sw ? { sanity_icon: sw.sanity_icon, weight: sw.weight } : null
      );
      if (!cancel) setPercent(p);
    })();
    return () => { cancel = true; };
  }, [orgSlug, supabase]);

  return (
    <span style={{ fontSize: 12, color: '#444' }}>
      {percent === null ? '—' : `${percent}%`}
    </span>
  );
}
