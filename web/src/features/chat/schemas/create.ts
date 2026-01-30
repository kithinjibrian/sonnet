import { z } from "zod";

export const chatCreateInput = z.string().min(1);

export const chatCreateOutput = z.object({
  id: z.uuidv4(),
  title: z.string(),
});
