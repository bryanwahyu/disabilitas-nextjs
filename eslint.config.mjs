import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Konfigurasi ini dulu memuat `eslint-config-next`. Paket itu ikut dicopot saat
 * migrasi ke TanStack Start, jadi config lama **gagal load** — `eslint` tidak
 * bisa jalan sama sekali sejak 2026-08-11 tanpa ada yang menyadarinya.
 *
 * Sekarang hanya aturan inti ESLint, tanpa dependency tambahan. Cakupannya
 * memang sempit: gerbang tipe yang sebenarnya adalah `npx tsc --noEmit`
 * (`strictNullChecks` aktif). Untuk lint TypeScript sungguhan perlu memasang
 * `typescript-eslint` — keputusan itu belum diambil.
 */
export default defineConfig([
  globalIgnores([
    ".output/**",
    ".nitro/**",
    "node_modules/**",
    "src/routeTree.gen.ts", // digenerate plugin Vite
  ]),
  {
    files: ["**/*.{js,mjs,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
]);
