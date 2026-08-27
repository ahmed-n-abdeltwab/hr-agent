import { LuaTool } from "lua-cli";
import { z } from "zod";
import { completeOnboarding, employeeIdSchema } from "../../tools/onboarding.js";

export default class CompleteOnboardingTool implements LuaTool {
  name = "complete_onboarding";
  description = "Complete onboarding only when all required documents and orientation exist.";
  inputSchema = employeeIdSchema;
  async execute(input: z.infer<typeof employeeIdSchema>) {
    return completeOnboarding(input);
  }
}
