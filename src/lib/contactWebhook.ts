type ContactWebhookPayload = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  signals: string[];
};

const CONTACT_WEBHOOK_URL = import.meta.env.CONTACT_WEBHOOK_URL;

export async function sendContactWebhook(payload: ContactWebhookPayload): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(CONTACT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      throw new Error(`Webhook responded with ${response.status}: ${responseText}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}