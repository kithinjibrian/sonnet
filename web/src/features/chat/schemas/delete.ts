import { z } from "zod";

export const chatDeleteInput = z.object({
  id: z.string().uuid(),
});

export const chatDeleteOutput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
