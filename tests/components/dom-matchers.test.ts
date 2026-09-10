import { expect, expectTypeOf, it } from "vitest";

it("provides typed DOM matchers for synchronous and asynchronous assertions", async () => {
  expectTypeOf(expect(document.body).toBeInTheDocument()).toEqualTypeOf<void>();
  expectTypeOf(expect(null).not.toBeInTheDocument()).toEqualTypeOf<void>();
  const resolved = expect(
    Promise.resolve(document.body),
  ).resolves.toBeInTheDocument();

  expectTypeOf(resolved).toEqualTypeOf<Promise<void>>();
  await resolved;
});
