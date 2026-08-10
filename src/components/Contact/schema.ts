// Validation schema for the contact form fields.
//
// Shared between the client (inline validation in ContactFields.astro) and, if
// a server endpoint is added later, the server (re-validate what the browser
// sends — never trust the client). Kept message-free so the UI can supply
// localized error text; the client only needs to know *which* field failed.
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phoneCountry: z.string().trim().min(1),
  phone: z
    .string()
    .trim()
    .min(6)
    .regex(/^[0-9\s()-]+$/),
  company: z.string().trim().optional(),
  /** Text of the "señales" ticked in step 1 (empty for the single-step form). */
  signals: z.array(z.string().trim().min(1)).default([]),
});

export type ContactPayload = z.infer<typeof contactSchema>;
