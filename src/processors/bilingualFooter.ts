import { PostProcessor } from "lua-cli";
import { detectLocale } from "../lib/locale.js";
import { t } from "../lib/i18n.js";

export const bilingualFooter = new PostProcessor({
  name: "bilingual-hr-formatter",
  description: "Append a channel footer in the employee language.",
  execute: async (user: any, messages: any[], response: any, channel: string) => {
    const inbound = (messages ?? []).map((m) => m?.text ?? "").join(" ");
    const locale = detectLocale(inbound);
    const ch = String(channel ?? user?.channel ?? "web").toLowerCase();
    const footer = ch.includes("whatsapp") ? t("whatsapp_footer", locale) : t("web_footer", locale);
    if (typeof response === "string") return `${response}\n\n${footer}`;
    if (response && typeof response === "object") {
      return { ...response, footer, locale };
    }
    return response;
  },
});
