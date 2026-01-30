import { z } from "zod";

export const chatUpdateInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const chatUpdateOutput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
