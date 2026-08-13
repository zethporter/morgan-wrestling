import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	// bun's isolated linker hides these transitive deps from the app root, so
	// Vite serves @tanstack/react-store raw and its CJS `use-sync-external-store`
	// import blows up in the browser. Pre-bundle them via their visible parent.
	optimizeDeps: {
		include: [
			'@tanstack/react-form > @tanstack/react-store',
			'@tanstack/react-form > @tanstack/react-store > use-sync-external-store/shim/with-selector.js',
		],
	},
	server: {
		watch: {
			ignored: ['**/.env'],
		},
	},
	plugins: [
		devtools(),
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
