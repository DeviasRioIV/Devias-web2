import { Resend } from "resend";
import { readEnv } from "./supabase";

// Emails the team when something operational breaks (e.g. the Supabase
// keep-alive). Never throws: an alert that fails must not mask the original
// error or change the endpoint's response.
export async function sendAlertEmail(subject: string, detail: string): Promise<void> {
  const apiKey = readEnv("RESEND_API_KEY");
  const from = readEnv("RESEND_FROM");

  // Comma-separated list, e.g. "a@x.com,b@y.com".
  const to = (readEnv("ALERT_EMAIL_TO") ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  if (!apiKey || !from || to.length === 0) {
    console.error(
      "[alert] Missing RESEND_API_KEY, RESEND_FROM or ALERT_EMAIL_TO, alert not sent:",
      subject,
    );
    return;
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      subject: `[Devias] ${subject}`,
      text: `${detail}\n\nHora: ${new Date().toISOString()}`,
    });
    if (error) console.error("[alert] Resend failed:", error.message);
  } catch (err) {
    console.error("[alert] unexpected error sending alert:", err);
  }
}
