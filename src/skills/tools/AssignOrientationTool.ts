import { LuaTool } from "lua-cli";
import { z } from "zod";
import { assignOrientation, employeeIdSchema } from "../../tools/onboarding.js";

export default class AssignOrientationTool implements LuaTool {
  name = "assign_orientation";
  description = "Assign orientation by entity and location.";
  inputSchema = employeeIdSchema;
  async execute(input: z.infer<typeof employeeIdSchema>) {
    return assignOrientation(input);
  }
}
