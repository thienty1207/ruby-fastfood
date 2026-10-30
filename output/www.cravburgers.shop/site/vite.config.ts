import { defineConfig } from 'vite';

export default defineConfig({
  // Bind BOTH stacks so http://127.0.0.1:5273 and http://localhost:5273 both work.
  // (Default binding exposed only ::1 on this machine, so 127.0.0.1 was refused.)
  server: { host: true, port: 5273, strictPort: true },
  preview: { host: true, port: 5273, strictPort: true },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
