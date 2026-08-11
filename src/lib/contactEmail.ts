import { Resend } from "resend";

type ContactEmailPayload = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  signals: string[];
};

const CONTACT_EMAIL_TO = "hola@devias.ar";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildContactEmailHtml(payload: ContactEmailPayload): string {
  const company = payload.company ? escapeHtml(payload.company) : "No informado";
  const signalsHtml = payload.signals.length
    ? payload.signals
        .map((signal) => `<li style=\"margin:0 0 8px;\">${escapeHtml(signal)}</li>`)
        .join("")
    : "<li style=\"margin:0;\">Sin señales seleccionadas</li>";

  return `
<!doctype html>
<html lang=\"es\">
  <body style=\"margin:0;padding:0;background:#f3f6fb;font-family:'Segoe UI',Arial,sans-serif;color:#10243b;\">
    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:28px 14px;\">
      <tr>
        <td align=\"center\">
          <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:680px;background:#ffffff;border:1px solid #e2e8f3;border-radius:16px;overflow:hidden;\">
            <tr>
              <td style=\"background:linear-gradient(120deg,#0b2545,#1f4f82);padding:20px 24px;color:#ffffff;\">
                <h1 style=\"margin:0;font-size:22px;line-height:1.2;\">Nuevo contacto recibido</h1>
                <p style=\"margin:8px 0 0;font-size:14px;opacity:.9;\">Formulario web de Devias</p>
              </td>
            </tr>
            <tr>
              <td style=\"padding:22px 24px 6px;\">
                <p style=\"margin:0 0 12px;font-size:14px;color:#3c5169;\">ID: ${escapeHtml(payload.id)}</p>
                <p style=\"margin:0 0 18px;font-size:14px;color:#3c5169;\">Fecha: ${escapeHtml(payload.created_at)}</p>
              </td>
            </tr>
            <tr>
              <td style=\"padding:0 24px 24px;\">
                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;\">
                  <tr>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;background:#f8fbff;font-weight:600;width:35%;\">Nombre</td>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;\">${escapeHtml(payload.name)}</td>
                  </tr>
                  <tr>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;background:#f8fbff;font-weight:600;\">Email</td>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;\">${escapeHtml(payload.email)}</td>
                  </tr>
                  <tr>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;background:#f8fbff;font-weight:600;\">Teléfono</td>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;\">${escapeHtml(payload.phone)}</td>
                  </tr>
                  <tr>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;background:#f8fbff;font-weight:600;\">Empresa</td>
                    <td style=\"padding:12px;border:1px solid #d9e2ef;\">${company}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style=\"padding:0 24px 26px;\">
                <h2 style=\"margin:0 0 10px;font-size:16px;color:#10243b;\">Señales seleccionadas</h2>
                <ul style=\"margin:0;padding-left:22px;color:#1f3c5b;font-size:14px;line-height:1.5;\">${signalsHtml}</ul>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.RESEND_FROM;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!from) {
    throw new Error("Missing RESEND_FROM");
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: CONTACT_EMAIL_TO,
    subject: `Nuevo contacto: ${payload.name}`,
    html: buildContactEmailHtml(payload),
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}