import { LuaSkill } from "lua-cli";
import StartOnboardingTool from "./tools/StartOnboardingTool.js";
import SubmitOnboardingDocumentTool from "./tools/SubmitOnboardingDocumentTool.js";
import AssignOrientationTool from "./tools/AssignOrientationTool.js";
import CompleteOnboardingTool from "./tools/CompleteOnboardingTool.js";
import RequestLeaveTool from "./tools/RequestLeaveTool.js";
import SearchSopsTool from "./tools/SearchSopsTool.js";
import GetSopTool from "./tools/GetSopTool.js";
import LogSopGapTool from "./tools/LogSopGapTool.js";
import SubmitTeamCheckinTool from "./tools/SubmitTeamCheckinTool.js";
import WeeklyTeamPerformanceTool from "./tools/WeeklyTeamPerformanceTool.js";
import CalculateGratuityTool from "./tools/CalculateGratuityTool.js";
import CheckIqamaExpiryTool from "./tools/CheckIqamaExpiryTool.js";

export const hrCoreSkill = new LuaSkill({
  name: "hr-core-operations",
  description: "Onboarding and leave against BambooHR.",
  context: `Use start_onboarding, submit_onboarding_document, assign_orientation, complete_onboarding, request_leave.
Escalate compensation changes, disciplinary cases, and legal disputes to HR.`,
  tools: [
    new StartOnboardingTool(),
    new SubmitOnboardingDocumentTool(),
    new AssignOrientationTool(),
    new CompleteOnboardingTool(),
    new RequestLeaveTool(),
  ],
});

export const hrKnowledgeSkill = new LuaSkill({
  name: "hr-knowledge-compliance",
  description: "SOPs, gratuity, Iqama.",
  context: `Use search_sops, get_sop, log_sop_gap, calculate_gratuity, check_iqama_expiry.
Never invent an SOP.`,
  tools: [
    new SearchSopsTool(),
    new GetSopTool(),
    new LogSopGapTool(),
    new CalculateGratuityTool(),
    new CheckIqamaExpiryTool(),
  ],
});

export const performanceSkill = new LuaSkill({
  name: "performance-management",
  description: "Daily check-ins and weekly summaries.",
  context: `Use submit_team_checkin and weekly_team_performance. Ahmad Al-Harbi is a fixture team lead.`,
  tools: [new SubmitTeamCheckinTool(), new WeeklyTeamPerformanceTool()],
});
