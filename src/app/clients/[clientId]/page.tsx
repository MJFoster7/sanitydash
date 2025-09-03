import { redirect } from 'next/navigation';

export default function ClientLanding({
  params,
}: { params: { clientId: string } }) {
  // For now, when someone visits /clients/[clientId],
  // send them to the Firewall page (which already exists).
  redirect(`/clients/${params.clientId}/infrastructure/firewall`);
}
