import { z } from "zod";

export const chatGetInput = z.object({
  id: z.string().uuid(),
});

export const chatGetOutput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
