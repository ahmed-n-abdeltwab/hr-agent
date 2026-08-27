import { LuaTool } from "lua-cli";
import { z } from "zod";
import { weeklyTeamPerformance, weeklySchema } from "../../tools/performance.js";

export default class WeeklyTeamPerformanceTool implements LuaTool {
  name = "weekly_team_performance";
  description = "How did Ahmad's team perform this week? Resolves team lead and returns sheet aggregates.";
  inputSchema = weeklySchema;
  async execute(input: z.infer<typeof weeklySchema>) {
    return weeklyTeamPerformance(input);
  }
}
