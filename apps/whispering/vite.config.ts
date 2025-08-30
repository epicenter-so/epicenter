import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,

	plugins: [sveltekit(), tailwindcss()],
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		hmr: host
			? {
					host,
					port: 1421,
					protocol: 'ws',
				}
			: undefined,
		host: host || false,
		port: 1420,
		strictPort: true,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ['**/src-tauri/**'],
		},
	},
}));
