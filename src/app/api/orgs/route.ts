export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";

function slugify(input: string) {
  return input.toLowerCase().trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const base = slugify(name);

    const { data: existing } = await supabase
      .from("organizations").select("slug").eq("slug", base).maybeSingle();

    const finalSlug = existing ? `${base}-${Date.now().toString().slice(-5)}` : base;

    const { data, error } = await supabase
      .from("organizations")
      .insert({ name, slug: finalSlug })
      .select("id, name, slug")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, org: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
