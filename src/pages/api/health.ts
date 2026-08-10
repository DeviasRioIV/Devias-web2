// Keep-alive endpoint for the daily Vercel cron (see vercel.json).
//
// The free Supabase tier pauses a project after 7 days without activity, and a
// paused project drops the next contact form submission. This route runs
// public.heartbeat() — a real query against Postgres — which resets that clock.
// It reads no table, so a leak here exposes nothing about `contacts`.
import type { APIRoute } from "astro";
import { getSupabaseClient, readEnv } from "../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Vercel attaches `Authorization: Bearer $CRON_SECRET` to every cron request
  // once CRON_SECRET is set on the project. Without that check the route is a
  // public button anyone can hold down, so treat a mismatch as a 404 — no need
  // to advertise that the path exists.
  const secret = readEnv("CRON_SECRET");
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not found", { status: 404 });
  }

  const { data, error } = await getSupabaseClient().rpc("heartbeat");

  if (error) {
    console.error("[health] heartbeat failed:", error);
    return new Response(JSON.stringify({ ok: false, error: "heartbeat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, at: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
