export function GET() {
  // Inlined by next.config.ts at build time, not supplied by the runtime host.
  const revision = process.env.BUILD_REVISION;
  const stamped = /^[a-f0-9]{40}$/.test(revision ?? "");
  return Response.json(
    { revision: stamped ? revision : null },
    { status: stamped ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
