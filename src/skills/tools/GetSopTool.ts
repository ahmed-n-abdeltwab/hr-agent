import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getSop, getSopSchema } from "../../tools/sop.js";

export default class GetSopTool implements LuaTool {
  name = "get_sop";
  description = "Load one SOP by slug.";
  inputSchema = getSopSchema;
  async execute(input: z.infer<typeof getSopSchema>) {
    return getSop(input);
  }
}
