import { LuaTool } from "lua-cli";
import { z } from "zod";
import { calculateGratuityTool, gratuitySchema } from "../../tools/payroll.js";

export default class CalculateGratuityTool implements LuaTool {
  name = "calculate_gratuity";
  description = "Calculate end-of-service gratuity from TypeScript rules.";
  inputSchema = gratuitySchema;
  async execute(input: z.infer<typeof gratuitySchema>) {
    return calculateGratuityTool(input);
  }
}
