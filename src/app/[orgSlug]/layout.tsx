import Link from 'next/link';
import { ReactNode } from 'react';

export default function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { orgSlug: string };
}) {
  const { orgSlug } = params;
  const nav = [
    { label: 'Firewall',  href: `/${orgSlug}/infrastructure/firewall` },
    { label: 'Switches',  href: `/${orgSlug}/infrastructure/switches` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid #eee', padding: 16, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>Infrastructure</div>
        <nav style={{ display: 'grid', gap: 8 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: '#111' }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
