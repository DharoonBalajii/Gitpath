import { z } from 'zod';

export const importRepositorySchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .regex(
      /^https?:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/?$/,
      'Must be a GitHub repository URL (e.g. https://github.com/owner/repo)',
    ),
});

export type ImportRepositoryInput = z.infer<typeof importRepositorySchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
