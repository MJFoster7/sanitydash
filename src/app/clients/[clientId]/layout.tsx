// src/app/clients/[clientId]/layout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

export default function ClientLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { clientId: string };
}) {
  const { clientId } = params;

  const nav = [
    { label: 'Firewall', href: `/clients/${clientId}/infrastructure/firewall` },
    { label: 'Switches', href: `/clients/${clientId}/infrastructure/switches` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: '1px solid #eee', padding: '16px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>Infrastructure</div>
        <nav style={{ display: 'grid', gap: 8 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: '#111' }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Page content */}
      <main style={{ padding: '24px' }}>{children}</main>
    </div>
  );
}
