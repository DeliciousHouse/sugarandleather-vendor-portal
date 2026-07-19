import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = resolve(process.cwd(), ".github/workflows/ci.yml");

describe("CI workflow", () => {
  it("defines a fail-closed quality gate for every main branch change", () => {
    expect(existsSync(workflowPath)).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/pull_request:\s*\n\s+branches: \[main\]/);
    expect(workflow).toMatch(/push:\s*\n\s+branches: \[main\]/);
    expect(workflow).not.toMatch(/paths(?:-ignore)?:/);
    expect(workflow).toContain("cancel-in-progress: true");
    expect(workflow).toMatch(/timeout-minutes: \d+/);
    expect(workflow).toContain("uses: actions/checkout@v7");
    expect(workflow).toContain("uses: actions/setup-node@v4");
    expect(workflow).toContain("node-version: '24.15.0'");
    expect(workflow).toContain("cache: npm");
    expect(workflow).toContain("run: npm ci");

    const requiredCommands = [
      "run: npm run prisma:validate",
      "run: npm run check:tokens",
      "run: npm run lint",
      "run: npm run test",
      "run: npx next build --webpack",
    ];
    let previousIndex = -1;
    for (const command of requiredCommands) {
      const commandIndex = workflow.indexOf(command);
      expect(commandIndex).toBeGreaterThan(previousIndex);
      previousIndex = commandIndex;
    }

    expect(workflow).not.toContain("continue-on-error:");
    expect(workflow).not.toContain("${{ secrets.");
    expect(workflow).toContain(
      "DATABASE_URL: postgresql://ci:ci@127.0.0.1:5432/vendor_portal_ci",
    );
    expect(workflow).toContain(
      "AUTH_SECRET: ci-only-placeholder-auth-secret-change-before-production",
    );
  });
});
