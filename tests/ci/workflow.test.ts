import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflowPath = resolve(process.cwd(), ".github/workflows/ci.yml");
const workflow = readFileSync(workflowPath, "utf8").replaceAll("\r\n", "\n");

type WorkflowMapping = Record<string, unknown>;

function requireMapping(value: unknown, label: string): WorkflowMapping {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be a mapping`);
  }

  return value as WorkflowMapping;
}

function requireSteps(value: unknown, label: string): WorkflowMapping[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be a sequence`);
  }

  return value.map((step, index) =>
    requireMapping(step, `${label}[${index}]`),
  );
}

function assertCanonicalQualityContract(candidate: string) {
  const document = requireMapping(parse(candidate), "workflow");
  const jobs = requireMapping(document.jobs, "jobs");

  for (const [jobName, value] of Object.entries(jobs)) {
    const job = requireMapping(value, `jobs.${jobName}`);
    expect(job).not.toHaveProperty("if");
    expect(job).not.toHaveProperty("continue-on-error");

    if (job.steps === undefined) {
      continue;
    }

    const steps = requireSteps(job.steps, `jobs.${jobName}.steps`);
    for (const step of steps) {
      expect(step).not.toHaveProperty("if");
      expect(step).not.toHaveProperty("continue-on-error");
    }
  }

  const quality = requireMapping(jobs.quality, "jobs.quality");
  const qualitySteps = requireSteps(quality.steps, "jobs.quality.steps");
  const runCommands = qualitySteps.flatMap((step) =>
    typeof step.run === "string" ? [step.run] : [],
  );

  expect(quality["timeout-minutes"]).toBe(30);
  expect(runCommands).toEqual([
    "npm ci",
    "npm run prisma:validate",
    "npm run verify",
  ]);

  const environment = requireMapping(quality.env, "jobs.quality.env");
  expect(environment.DATABASE_URL).toBe(
    "postgresql://ci:ci@127.0.0.1:5432/vendor_portal_ci",
  );
  expect(environment.AUTH_SECRET).toBe(
    "ci-only-placeholder-auth-secret-change-before-production",
  );
}

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
    expect(() => assertCanonicalQualityContract(workflow)).not.toThrow();
  });

  it.each([
    [
      "a command that discards verify failures",
      workflow.replace(
        "run: npm run verify",
        "run: npm run verify || true",
      ),
    ],
    [
      "a command that only echoes a commented verify string",
      workflow.replace(
        "run: npm run verify",
        "run: echo skipped # run: npm run verify",
      ),
    ],
    [
      "a Verify step skipped by a leading if key",
      workflow.replace(
        "- name: Verify\n        run: npm run verify",
        "- if: ${{ false }}\n        name: Verify\n        run: npm run verify",
      ),
    ],
    [
      "a quality job allowed to fail",
      workflow.replace(
        "quality:\n    name: Quality gate",
        "quality:\n    continue-on-error: true\n    name: Quality gate",
      ),
    ],
  ])("rejects %s", (_description, mutatedWorkflow) => {
    expect(() => assertCanonicalQualityContract(mutatedWorkflow)).toThrow();
  });
});
