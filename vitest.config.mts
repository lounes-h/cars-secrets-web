import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // TZ: LocalTime renders in the process's zone; UTC makes the expected times the same on every machine.
    env: { NEXT_PUBLIC_SITE_URL: "https://cars-secrets.test", TZ: "UTC" },
  },
});
