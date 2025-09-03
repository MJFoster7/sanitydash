"use client";

export function NewClientForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("name") as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (res.ok) {
      input.value = "";
      location.reload();
    } else {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      alert(error || "Failed to create client");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12 }}>
      <input
        type="text"
        name="name"
        placeholder="New client name (e.g., Dunder Mifflin)"
        style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        autoComplete="off"
      />
      <button type="submit" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #0ea5e9", background: "#0ea5e9", color: "#fff" }}>
        + Add Client
      </button>
    </form>
  );
}
