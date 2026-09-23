import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Separate from `vite.config.ts` on purpose: the app's config runs the
 * cloudflare and tanstackStart plugins, which want a Worker to boot. The units
 * worth testing here — sanitizing, slugging, query shapes — are plain modules.
 */
export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [viteReact()],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
	},
});
