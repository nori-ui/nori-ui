import { defineConfig, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config';
import { z } from 'zod/v4';

export const { docs, meta } = defineDocs({
    dir: 'content/docs',
    docs: {
        schema: frontmatterSchema.extend({
            since: z.string().default('0.1.0'),
            tags: z.array(z.string()).default([]),
            platform: z.enum(['web', 'native', 'both']).default('both'),
        }),
    },
});

export default defineConfig();
