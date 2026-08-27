import { LuaTool } from "lua-cli";
import { z } from "zod";
import { startOnboarding, startOnboardingSchema } from "../../tools/onboarding.js";

export default class StartOnboardingTool implements LuaTool {
  name = "start_onboarding";
  description = "Create an onboarding case and BambooHR checklist for a new hire.";
  inputSchema = startOnboardingSchema;
  async execute(input: z.infer<typeof startOnboardingSchema>) {
    return startOnboarding(input);
  }
}
