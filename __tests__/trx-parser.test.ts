import parseTrxResults from "../src/trx-parser";
import * as fs from "fs";

describe("parse TRX test results", () => {
  test("parse successful test runs from TRX", () => {
    const xml = fs.readFileSync("./__tests__/sample.trx", {
      encoding: "utf-8",
    });
    const parsedData = parseTrxResults(xml);

    expect(parsedData.results).toHaveLength(1);
    expect(parsedData.results[0].fixture).toBe("ITextDllTests.dll");
    expect(parsedData.results[0].failures).toBe(0);
    expect(parsedData.results[0].ignored).toBe(1);
    expect(parsedData.results[0].passed).toBe(2);
    expect(parsedData.results[0].failureDetails).toEqual([]);
  });

  test("should parse TRX file with failures", () => {
    const xml = fs.readFileSync("./__tests__/failed.trx", "utf-8");
    const parsedData = parseTrxResults(xml);

    expect(parsedData.results).toHaveLength(1);
    expect(parsedData.results[0].fixture).toBe("FwUtilsTests.dll");
    expect(parsedData.results[0].failures).toBe(2);
    expect(parsedData.results[0].ignored).toBe(0);
    expect(parsedData.results[0].passed).toBe(0);

    expect(parsedData.results[0].failureDetails).toHaveLength(2);
    expect(parsedData.results[0].failureDetails[0]).toEqual({
      unitName: "Equals_ExactlyTheSame",
      fileName:
        "C:\\Repositories\\fwroot\\fw\\Src\\Common\\FwUtils\\FwUtilsTests\\FwLinkArgsTests.cs",
      lineInfo: 30,
    });
    expect(parsedData.results[0].failureDetails[1]).toEqual({
      unitName: "Equals_SameObject",
      fileName:
        "C:\\Repositories\\fwroot\\fw\\Src\\Common\\FwUtils\\FwUtilsTests\\FwLinkArgsTests.cs",
      lineInfo: 43,
    });
  });
});
