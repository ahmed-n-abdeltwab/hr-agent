import { PreProcessor } from "lua-cli";
import { bamboohr } from "../lib/bamboohr.js";
import { detectLocale } from "../lib/locale.js";
import { t } from "../lib/i18n.js";

export const identifyEmployee = new PreProcessor({
  name: "identify-employee",
  description: "Resolve WhatsApp phone numbers to BambooHR employees.",
  execute: async (user: any, messages: any[], channel: string) => {
    const text = (messages ?? [])
      .map((m) => (m?.type === "text" ? m.text : typeof m === "string" ? m : ""))
      .join(" ");
    const locale = detectLocale(text);
    const ch = String(channel ?? user?.channel ?? "").toLowerCase();
    if (!ch.includes("whatsapp")) return { action: "proceed" };

    const phone = user?.phone || user?.mobile || user?.from || user?.id;
    const emp =
      (phone && (await bamboohr.searchEmployee({ phone: String(phone) }))) ||
      (text.match(/\b\d{3,}\b/) && (await bamboohr.searchEmployee({ employeeNumber: text.match(/\b\d{3,}\b/)?.[0] })));

    if (!emp) {
      return { action: "block", response: t("ask_employee_number", locale) };
    }
    if (user && typeof user === "object") user.employeeId = emp.id;
    return { action: "proceed" };
  },
});
