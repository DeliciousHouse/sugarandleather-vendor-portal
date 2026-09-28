#!/usr/bin/env bash
# Local/CI artifact smoke only. No published ports, DB writes, or external POSTs.
set -euo pipefail
image="${1:?image required}"
revision="${2:?full source revision required}"
[[ "$revision" =~ ^[a-f0-9]{40}$ ]]
[[ "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")" == "$revision" ]]
[[ "$(docker image inspect --format '{{.Config.User}}' "$image")" == node ]]
container="$(docker run -d --network none -e BUILD_REVISION=runtime-cannot-relabel-this-image "$image")"
trap 'docker stop --time 5 "$container" >/dev/null; docker rm "$container" >/dev/null' EXIT

docker exec -i "$container" node - "$revision" <<'NODE'
const assert = require('node:assert/strict');
const { setTimeout: delay } = require('node:timers/promises');
const origin = 'http://127.0.0.1:3000';
(async () => {
  let response;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      response = await fetch(`${origin}/api/version`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) break;
    } catch { /* The server may still be starting. */ }
    await delay(1000);
  }
  assert.equal(response?.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { revision: process.argv[2] });
  for (const path of ['/', '/login', '/apply']) {
    const page = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(5000) });
    assert.equal(page.status, 200, path);
    const html = await page.text();
    assert.equal((html.match(/aria-label="Send feedback"/g) || []).length, 1, path);
    const asset = html.match(/src="([^" ]*\/_next\/static\/[^" ]+\.js)"/);
    assert.ok(asset, `bundled JS missing on ${path}`);
    assert.equal((await fetch(new URL(asset[1], origin), { signal: AbortSignal.timeout(5000) })).status, 200);
  }
  for (const path of ['/admin', '/partner']) {
    const page = await fetch(`${origin}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    assert.equal(page.status, 307, path);
    assert.equal(new URL(page.headers.get('location'), origin).pathname, '/login');
  }
  console.log(`Container smoke passed: ${process.argv[2]}, immutable readback, public feedback mounts, static assets, protected redirects`);
})().catch(error => { console.error(error); process.exit(1); });
NODE
