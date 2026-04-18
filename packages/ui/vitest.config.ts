import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test-setup.ts",
        "src/index.ts",
        // Thin Radix-style wrappers: render-only, no conditional logic.
        // Covered indirectly via consumer integration tests.
        "src/components/app-shell.tsx",
        "src/components/dialog.tsx",
        "src/components/dropdown-menu.tsx",
        "src/components/input.tsx",
        "src/components/label.tsx",
        "src/components/popover.tsx",
        "src/components/select-native.tsx",
        "src/components/separator.tsx",
        "src/components/toggle-group.tsx",
        "src/components/tooltip.tsx",
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
});
