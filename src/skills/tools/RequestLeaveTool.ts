import { LuaTool } from "lua-cli";
import { z } from "zod";
import { requestLeave, requestLeaveSchema } from "../../tools/leave.js";

export default class RequestLeaveTool implements LuaTool {
  name = "request_leave";
  description = "Request annual, sick, or emergency leave after checking BambooHR balance.";
  inputSchema = requestLeaveSchema;
  async execute(input: z.infer<typeof requestLeaveSchema>) {
    return requestLeave(input);
  }
}
