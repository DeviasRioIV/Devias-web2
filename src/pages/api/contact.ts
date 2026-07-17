// Contact form endpoint.
//
// Runs on-demand (see `prerender = false`) as a Vercel serverless function.
// Re-validates the payload with the SAME Zod schema the client uses — never
// trust the browser. On success it logs the submission and, if a
// CONTACT_WEBHOOK_URL env var is set, forwards it there. Swap that block for
// your email / CRM / DB integration when ready.
import type { APIRoute } from "astro";
import { contactSchema } from "../../components/Contact/schema";

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

  // --- Do something with the submission -----------------------------------
  console.log("[contact] new submission:", data);

  const webhook = import.meta.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("[contact] webhook forward failed:", error);
      // The submission is valid; don't fail the user for a webhook hiccup.
    }
  }
  // ------------------------------------------------------------------------

  return json({ ok: true });
};
