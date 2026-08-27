import { LuaTool } from "lua-cli";
import { z } from "zod";
import { logSopGap, logGapSchema } from "../../tools/sop.js";

export default class LogSopGapTool implements LuaTool {
  name = "log_sop_gap";
  description = "Log a missing SOP and notify HR.";
  inputSchema = logGapSchema;
  async execute(input: z.infer<typeof logGapSchema>) {
    return logSopGap(input);
  }
}
