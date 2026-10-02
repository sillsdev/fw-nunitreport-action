/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import * as main from "../src/main";

// Mock the GitHub client so importing src/main does not load @octokit/core
jest.mock("@actions/github", () => ({
  getOctokit: () => ({}),
  context: {},
}));

// Mock the action's entrypoint
const runMock = jest.spyOn(main, "run").mockImplementation();

describe("index", () => {
  it("calls run when imported", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../src/index");

    expect(runMock).toHaveBeenCalled();
  });
});
