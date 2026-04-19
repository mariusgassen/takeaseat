import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(dir, "../../packages");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dir, "."),
      "@takeaseat/ui": path.resolve(packagesDir, "ui/src/index.ts"),
      "@takeaseat/types/generated": path.resolve(packagesDir, "types/src/generated/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "**/layout.tsx",
        "**/loading.tsx",
        "**/not-found.tsx",
        "**/page.tsx",
        "lib/mocks/**",
        "lib/api/types.ts",
        "app/providers.tsx",
        "app/api/mock/**",
        // Navigation chrome — visual shells, exercised manually.
        "app/(app)/_components/sidebar.tsx",
        "app/(app)/_components/topbar.tsx",
      ],
      thresholds: {
        lines: 70,
        branches: 65,
        functions: 40,
        statements: 70,
      },
    },
  },
});
