import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/version/route";

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/version", () => {
  it("returns only the build revision with caching disabled", async () => {
    const revision = "9802c2004e94927bbde41c52229dc1abda65a42d";
    vi.stubEnv("BUILD_REVISION", revision);
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ revision });
  });

  it.each([undefined, "", "main", "9802c200", "x".repeat(40)])(
    "refuses an unstamped or invalid build (%s)",
    async (revision) => {
      vi.stubEnv("BUILD_REVISION", revision);
      const response = GET();
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ revision: null });
    },
  );
});
