import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

// jest-dom 6's Vitest adapter uses the pre-Vitest 5 Assertion signature.
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Module augmentation must use an interface.
  interface Matchers<R extends void | Promise<void> = void | Promise<void>>
    extends TestingLibraryMatchers<unknown, R> {}
}

expect.extend(matchers);
