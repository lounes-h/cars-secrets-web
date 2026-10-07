import { vi } from "vitest";

// The page's [lang] segment, which only Next can read: English unless a test says otherwise
// (`vi.mocked(lang).mockResolvedValue("es")`).
vi.mock("next/root-params", () => ({ lang: vi.fn(async () => "en") }));
