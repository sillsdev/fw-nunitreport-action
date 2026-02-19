import { XMLParser } from "fast-xml-parser";
import { TestResults, TestResult, FailureDetail } from "./test-results-parser";

interface TrxUnitTestResult {
  "@_testName": string;
  "@_outcome": string;
  "@_testId": string;
  Output?: {
    ErrorInfo?: {
      Message?: string;
      StackTrace?: string;
    };
  };
}

interface TrxUnitTest {
  "@_name": string;
  "@_storage": string;
  "@_id": string;
  TestMethod?: {
    "@_className"?: string;
  };
}

interface TrxTestRun {
  TestRun: {
    Results?: {
      UnitTestResult?: TrxUnitTestResult | TrxUnitTestResult[];
    };
    TestDefinitions?: {
      UnitTest?: TrxUnitTest | TrxUnitTest[];
    };
  };
}

/**
 * Parses a .trx (Visual Studio Test Results) XML file content.
 * @param xmlContent The XML content of the .trx file
 * @returns TestResults object compatible with the NUnit parser output
 */
export function parseTrxResults(xmlContent: string): TestResults {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const parsed: TrxTestRun = parser.parse(xmlContent);

  // Create a map of test definitions for lookup
  const testDefinitions = new Map<string, TrxUnitTest>();
  const testDefs = parsed.TestRun.TestDefinitions?.UnitTest;
  if (testDefs) {
    const testArray = Array.isArray(testDefs) ? testDefs : [testDefs];
    for (const test of testArray) {
      testDefinitions.set(test["@_id"], test);
    }
  }

  // Group results by storage (DLL/assembly name)
  const resultsByStorage = new Map<string, TestResult>();

  const results = parsed.TestRun.Results?.UnitTestResult;
  if (results) {
    const resultsArray = Array.isArray(results) ? results : [results];

    for (const result of resultsArray) {
      const testDef = testDefinitions.get(result["@_testId"]);
      const fixture = testDef?.["@_storage"] || "Unknown";

      if (!resultsByStorage.has(fixture)) {
        resultsByStorage.set(fixture, {
          fixture,
          failures: 0,
          ignored: 0,
          passed: 0,
          failureDetails: [],
        });
      }

      const testResult = resultsByStorage.get(fixture);
      if (!testResult) {
        continue; // Skip if we somehow can't get the result
      }

      const outcome = result["@_outcome"];
      switch (outcome) {
        case "Passed":
          testResult.passed++;
          break;
        case "Failed":
          testResult.failures++;
          // Extract failure details
          if (result.Output?.ErrorInfo) {
            const failureDetail = extractFailureDetail(
              result["@_testName"],
              result.Output.ErrorInfo.StackTrace,
            );
            if (failureDetail) {
              testResult.failureDetails.push(failureDetail);
            }
          }
          break;
        case "NotExecuted":
        case "Skipped":
        case "Inconclusive":
          testResult.ignored++;
          break;
        default:
          // Log warning for unknown outcomes and treat as ignored
          console.warn(
            `Unknown test outcome '${outcome}' for test '${result["@_testName"]}', treating as ignored`,
          );
          testResult.ignored++;
          break;
      }
    }
  }

  return {
    results: Array.from(resultsByStorage.values()),
  };
}

/**
 * Extracts failure details from a stack trace.
 * @param testName The name of the test that failed
 * @param stackTrace The stack trace from the error
 * @returns FailureDetail or null if extraction failed
 */
function extractFailureDetail(
  testName: string,
  stackTrace?: string,
): FailureDetail | null {
  if (!stackTrace) {
    return null;
  }

  // Try to match patterns like:
  // "at Namespace.Class.Method() in C:\Path\To\File.cs:line 123"
  // The leading "at" is optional (may or may not have spaces)
  // Use a non-greedy match to get everything before ":line"
  const regex = /in (.+?):line (\d+)/i;
  const match = stackTrace.match(regex);

  if (match) {
    return {
      unitName: testName,
      fileName: match[1].trim(),
      lineInfo: parseInt(match[2]),
    };
  }

  return null;
}

export default parseTrxResults;
