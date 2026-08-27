import { LuaTool } from "lua-cli";
import { z } from "zod";
import { searchSops, searchSopsSchema } from "../../tools/sop.js";

export default class SearchSopsTool implements LuaTool {
  name = "search_sops";
  description = "Search HR SOPs. Do not invent policy if nothing scores above 0.7.";
  inputSchema = searchSopsSchema;
  async execute(input: z.infer<typeof searchSopsSchema>) {
    return searchSops(input);
  }
}
