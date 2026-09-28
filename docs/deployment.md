# Vendor Portal deployment staging

Status: repository staging only, not a production deployment record. The owner
approved a Docker deployment behind the existing Caddy proxy, using the same
GHCR/exact-source-image approach as Aries. No canonical origin has been registered
here yet. Do not guess a hostname or treat CI as proof of a live deployment.

## What this repository now verifies

- `Dockerfile` builds Next.js standalone output on Node 24.15.0, generates Prisma
  inside Linux, and runs as the unprivileged `node` user. The build context is an
  allowlist; local env files, credentials, generated clients and worktrees stay out.
- `SOURCE_REVISION` must be a full Git SHA. It is both an OCI revision label and a
  build-time constant returned by `GET /api/version`. A runtime env override cannot
  relabel that response. An unstamped local build returns 503 with `revision: null`.
- The existing CI quality gate remains mandatory. A dependent, hosted-runner job
  builds and smokes the image without registry credentials, publishing, exposed
  ports, a database, external network access from the container, or a live POST.
- The smoke exercises the real container: revision readback, static JS, one
  feedback control on each public entry page, and unauthenticated admin/partner
  redirects. Existing feedback tests retain the fixed GEN/Vendor Portal identity,
  pathname-only payload, field allowlist, retry and duplicate-prevention coverage.

`/api/version` and the Docker healthcheck prove HTTP liveness and artifact identity,
NOT database readiness, usable login, Jira configuration, or production readiness.
Never put credentials in build args or `next.config.ts`'s public build-time `env`.

To reproduce locally on Linux from a clean, committed checkout:

```sh
revision="$(git rev-parse HEAD)"
docker build --build-arg SOURCE_REVISION="$revision" --tag vendor-portal-check .
bash scripts/check-container.sh vendor-portal-check "$revision"
```

On Windows use Git for Windows to resolve the revision, then run only Docker/bash
through WSL with that literal revision. No Git commands or Git environment overrides
may cross into the WSL runner. The smoke removes only its own disposable container.
Do not use a dirty checkout's label as source-containment evidence.

## Release gates still required

Dev-lead owns the remaining decisions; the host operator executes only after their
scope and rollback have been approved. Use only owner-controlled accounts, not
former organization accounts or copied application data.

1. Record the exact approved HTTPS origin, DNS change, Caddy upstream address/port,
   host deployment directory, and restricted runner/registry authorization. No
   self-hosted runner may execute pull-request code. This PR adds no deploy trigger.
2. Provision an isolated, owner-controlled Postgres database and protected runtime
   configuration (`DATABASE_URL`, `APP_URL`, a fresh `AUTH_SECRET` of at least 32
   characters, `NODE_ENV=production`, `DISABLE_PORTAL_AUTH=false`). Explicitly verify
   all of these before starting a reachable service; never rely on development
   defaults. Configure owner-controlled Jira access with project GEN, email sender,
   and agreement-packet access. Do not reuse Aries's database or credentials.
3. Resolve database initialization separately: there is currently NO tracked
   `prisma/migrations` directory. `prisma migrate deploy` alone cannot create this
   schema. Obtain schema-owner approval for a baseline migration and demonstrate
   creation, seed and backup/restore against a disposable database first. No
   `db push`, auto-seeding or production migration is hidden in this image.
4. Resolve production session issuance: the login button is disabled and the app
   currently verifies signed cookies but has no production sign-in issuer. Never
   enable bypass or inject fabricated sessions to make authenticated QA appear green.
   Until resolved, QA may inspect public pages and protected-route redirects only.
5. After independent review and green exact-head CI, merge through the assigned
   reviewer. Add the gated publication/deployment wiring in a subsequent approved
   change: build the clean merged SHA, confirm it contains
   `9802c2004e94927bbde41c52229dc1abda65a42d`, publish to the approved GHCR package,
   record its registry digest and Actions run, then deploy that digest, not `latest`.
   Keep one application instance: feedback's in-flight duplicate guard is currently
   process-local. Any scale-out needs durable uniqueness first.
6. Before routing traffic, verify app and DB behavior privately. Restrict the host
   port to the approved proxy path; public Docker port binding is not an access
   policy. Apply only the approved DNS/Caddy changes, then GET the canonical
   `/api/version` and compare its exact SHA against the running image label and
   registry digest. Record the GitHub deployment/run and origin together. Readiness
   and external-service configuration need separate evidence; never test by sending
   real feedback or onboarding mail.

## Rollback contract

No prior production artifact/configuration is known, so production rollback has
NOT been exercised. A first deployment's baseline is **no portal exposed**, not an
invented previous image. Before the change, the operator must capture the current
DNS/Caddy configuration and confirm that baseline; preserve any unrelated routes.

For subsequent releases, retain the previous image's immutable registry digest,
source SHA, Compose/runtime configuration revision, and a protected configuration
backup. Retain the DB backup and verify schema compatibility before switching.
Never copy secret values into Actions output, this document, or a card.

On failure, stop exposure of the new service, restore the prior image digest AND
its compatible configuration, and restore only this portal's proxy/DNS changes.
Verify the old `/api/version`, container digest, public routing, and DB readiness.
Do not claim an image rollback reverses a database migration. If compatibility is
unknown, keep the portal unexposed and route the recovery decision to dev-lead;
never drop data, roll back financial records, or remove database volumes.

For a first deploy failure, stop only the new portal container and restore the
pre-change routing configuration; retain DB volumes and evidence. Verify no portal
is exposed and existing proxy routes still work. Rehearse the applicable rollback
on the approved staging target BEFORE a live switch and record actual results.

## Required deployment handoff (still pending)

Record: canonical origin; full source SHA and feedback-ancestor proof; immutable
registry image digest; Actions/deployment run URL; container image/label/readback
match; schema/configuration revision (no secrets); prior-artifact or first-deploy
baseline; timestamped rollback drill; safe reachable-route matrix.

Only after successful deployment, the shipping/review owner creates one
parent-gated scratch task assigned to `dev-qa`:

- Subject: `Live Vendor Portal product feedback QA`
- Idempotency: `qa:vendor-portal:feedback-rollout-<deploy-run-or-sha>`
- Priority: 5; runtime: 7200 seconds
- Include all 23 page-route families, exact runtime evidence above, only safely
  reachable journeys, and **no live POST**. Do not create it from source-only CI.

Include literally in that task:

```text
Narrow checks:
- `SOURCE-EXISTS`
- `UI-PROOF`
```
