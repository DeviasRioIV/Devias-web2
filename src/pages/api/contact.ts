// Contact form endpoint.
//
// Runs on-demand (see `prerender = false`) as a Vercel serverless function.
// Re-validates the payload with the SAME Zod schema the client uses — never
// trust the browser — then stores it in the Supabase `contacts` table (insert
// allowed by an RLS policy for the `anon` role; see db/contacts.sql).
import type { APIRoute } from "astro";
import { contactSchema } from "../../components/Contact/schema";
import { getSupabaseClient } from "../../lib/supabase";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    return json({ ok: false, error: "unsupported_media_type" }, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const result = contactSchema.safeParse(body);
  if (!result.success) {
    return json({ ok: false, error: "validation", issues: result.error.flatten() }, 422);
  }

  const data = result.data;

  try {
    const { error } = await getSupabaseClient()
      .from("contacts")
      .insert({
        name: data.name,
        email: data.email,
        phone_country: data.phoneCountry,
        phone: data.phone,
        company: data.company ?? null,
        signals: data.signals,
      });

    if (error) {
      console.error("[contact] insert failed:", error);
      return json({ ok: false, error: "storage" }, 500);
    }
  } catch (error) {
    console.error("[contact] unexpected error:", error);
    return json({ ok: false, error: "server" }, 500);
  }

  return json({ ok: true });
};
