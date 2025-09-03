export const runtime = "nodejs";

import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>MSP Docs</h1>
      <p>
        Welcome 👋 <br />
        Go to your{" "}
        <Link href="/dashboard" style={{ color: "#2563eb" }}>
          Dashboard
        </Link>
        .
      </p>
    </main>
  );
}
