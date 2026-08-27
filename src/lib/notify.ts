import { readEnv } from "./locale.js";

export type NotifyPayload = {
  to: string;
  role: "employee" | "manager" | "hr";
  locale: "ar" | "en";
  body: string;
  channel?: "web" | "whatsapp" | "email";
};

const sent: NotifyPayload[] = [];

export function getNotifications(): NotifyPayload[] {
  return sent.slice();
}

export function clearNotifications(): void {
  sent.length = 0;
}

export async function notify(payload: NotifyPayload): Promise<NotifyPayload> {
  sent.push(payload);
  return payload;
}

export function hrEscalationEmail(): string {
  return readEnv("HR_ESCALATION_EMAIL", "hr-escalation@example.com");
}
