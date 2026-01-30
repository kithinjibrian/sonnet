import { z } from "zod";

export const chatListOutput = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
  })
);
