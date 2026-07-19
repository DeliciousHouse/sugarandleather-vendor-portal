import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = resolve(process.cwd(), ".github/workflows/ci.yml");
const workflow = readFileSync(workflowPath, "utf8");

describe("CI workflow", () => {
  it("runs for every pull request and push to main", () => {
    expect(existsSync(workflowPath)).toBe(true);
    expect(workflow).toMatch(/pull_request:\s*\n\s+branches: \[main\]/);
    expect(workflow).toMatch(/push:\s*\n\s+branches: \[main\]/);
    expect(workflow).not.toMatch(/paths(?:-ignore)?:/);
    expect(workflow).toContain("cancel-in-progress: true");
  });

  it("uses a read-only checkout without retaining credentials", () => {
    expect(workflow.match(/^\s*permissions:/gm)).toHaveLength(1);
    expect(workflow).toMatch(
      /^permissions:\n {2}contents: read\n\nconcurrency:/m,
    );
    expect(workflow).toContain("uses: actions/checkout@v7");
    expect(workflow).toMatch(
      /uses: actions\/checkout@v7\n\s+with:\n\s+persist-credentials: false/,
    );
    expect(workflow).not.toMatch(/\$\{\{[^}]*\bsecrets\b/);
    expect(workflow).not.toMatch(/^\s+secrets:/m);
  });

  it("installs with the pinned Node and npm contract", () => {
    expect(workflow).toContain("uses: actions/setup-node@v4");
    expect(workflow).toContain("node-version: '24.15.0'");
    expect(workflow).toContain("cache: npm");
    expect(workflow).toContain("run: npm ci");
  });

  it("runs the unskippable canonical quality contract", () => {
    expect(workflow).toContain("timeout-minutes: 30");
    const requiredCommands = [
      "run: npm run prisma:validate",
      "run: npm run verify",
    ];
    let previousIndex = -1;
    for (const command of requiredCommands) {
      const commandIndex = workflow.indexOf(command);
      expect(commandIndex).toBeGreaterThan(previousIndex);
      previousIndex = commandIndex;
    }

    expect(workflow).not.toContain("run: npm run check:tokens");
    expect(workflow).not.toContain("run: npm run lint");
    expect(workflow).not.toContain("run: npm run test");
    expect(workflow).not.toMatch(/run: (?:npm run|npx next) build/);
    expect(workflow).not.toContain("continue-on-error:");
    expect(workflow).not.toMatch(/^\s+if:/m);
    expect(workflow).toMatch(
      /DATABASE_URL: postgresql:\/\/ci:ci@127\.0\.0\.1:5432\/vendor_portal_ci/,
    );
    expect(workflow).toContain(
      "AUTH_SECRET: ci-only-placeholder-auth-secret-change-before-production",
    );
  });
});
