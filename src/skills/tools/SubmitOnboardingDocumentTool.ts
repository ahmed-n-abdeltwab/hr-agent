import { LuaTool } from "lua-cli";
import { z } from "zod";
import { submitOnboardingDocument, submitDocSchema } from "../../tools/onboarding.js";

export default class SubmitOnboardingDocumentTool implements LuaTool {
  name = "submit_onboarding_document";
  description = "Store Iqama copy, bank IBAN, or emergency contact and mark the checklist item complete.";
  inputSchema = submitDocSchema;
  async execute(input: z.infer<typeof submitDocSchema>) {
    return submitOnboardingDocument(input);
  }
}
