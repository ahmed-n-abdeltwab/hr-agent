import { LuaTool } from "lua-cli";
import { z } from "zod";
import { checkIqamaExpiry, checkIqamaSchema } from "../../tools/documents.js";

export default class CheckIqamaExpiryTool implements LuaTool {
  name = "check_iqama_expiry";
  description = "Check one employee's Iqama expiry. 10 days out is expiring. Past dates are expired.";
  inputSchema = checkIqamaSchema;
  async execute(input: z.infer<typeof checkIqamaSchema>) {
    return checkIqamaExpiry(input);
  }
}
