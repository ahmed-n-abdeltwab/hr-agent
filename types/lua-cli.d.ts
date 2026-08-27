declare module "lua-cli" {
  export class LuaAgent {
    constructor(config: Record<string, unknown>);
  }
  export class LuaSkill {
    constructor(config: Record<string, unknown>);
  }
  export class LuaJob {
    constructor(config: Record<string, unknown>);
  }
  export class PreProcessor {
    constructor(config: Record<string, unknown>);
  }
  export class PostProcessor {
    constructor(config: Record<string, unknown>);
  }
  export interface LuaTool {
    name: string;
    description: string;
    inputSchema: unknown;
    execute(input: unknown): Promise<unknown>;
  }
  export function env(name: string): string;
  export const Data: { search: (...args: never[]) => Promise<unknown> };
}
