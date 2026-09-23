import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // TZ: LocalTime renders in the process's zone; UTC makes the expected times the same on every machine.
    env: { NEXT_PUBLIC_SITE_URL: "https://cars-secrets.test", TZ: "UTC" },
    // `yarn test:coverage` fails below 95 % on any metric (see AGENTS.md, Tests).
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
});
