import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    env: { NEXT_PUBLIC_SITE_URL: "https://cars-secrets.test" },
  },
});
