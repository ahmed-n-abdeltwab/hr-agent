import { LuaTool } from "lua-cli";
import { z } from "zod";
import { submitTeamCheckin, submitCheckinSchema } from "../../tools/performance.js";

export default class SubmitTeamCheckinTool implements LuaTool {
  name = "submit_team_checkin";
  description = "Save daily check-ins to Google Sheets. Ratings must be 1-5.";
  inputSchema = submitCheckinSchema;
  async execute(input: z.infer<typeof submitCheckinSchema>) {
    return submitTeamCheckin(input);
  }
}
