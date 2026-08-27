import { z, type ZodType } from "zod";

export type LuaToolLike = {
  name: string;
  description: string;
  inputSchema: ZodType;
  execute: (input: any) => Promise<unknown>;
};

export function tool<T extends ZodType>(spec: {
  name: string;
  description: string;
  inputSchema: T;
  execute: (input: z.infer<T>) => Promise<unknown>;
}): LuaToolLike {
  return spec;
}
