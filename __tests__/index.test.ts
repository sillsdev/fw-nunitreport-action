/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { describe, expect, it, vi } from "vitest";
import { run } from "../src/main.js";

// Replace the action's main function so importing the entrypoint does nothing
vi.mock("../src/main.js", () => ({ run: vi.fn() }));

describe("index", () => {
  it("calls run when imported", async () => {
    await import("../src/index.js");

    expect(run).toHaveBeenCalled();
  });
});
