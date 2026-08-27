import { LuaJob } from "lua-cli";
import { runIqamaScan } from "../tools/documents.js";

export const iqamaExpiryScan = new LuaJob({
  name: "iqama-expiry-scan",
  description: "Daily 07:00 scan for Iqama expiry within 30 days.",
  schedule: { type: "cron", expression: "0 7 * * *" },
  execute: async () => {
    const result = await runIqamaScan();
    return { status: "completed", ...result };
  },
});
