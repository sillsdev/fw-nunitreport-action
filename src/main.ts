import * as core from '@actions/core'
import * as fs from 'fs'
import * as github from '@actions/github'
import parseTestResults, { TestResults } from './test-results-parser'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const octokit = github.getOctokit(core.getInput('token'))
    const runContext = getRunContextForCheck()
    const createCheckResponse = await octokit.rest.checks.create({
      head_sha: runContext.head_sha,
      name: 'Unit Test Results',
      status: 'in_progress',
      output: {
        title: 'Unit Test Results',
        summary: ''
      },
      ...github.context.repo
    })
    const testResultsText = fs.readFileSync(core.getInput('log-path'), 'utf8')
    const testResults = parseTestResults(testResultsText)
    await octokit.rest.checks.update({
      check_run_id: createCheckResponse.data.id,
      conclusion: testResults.results.every(t => t.failures === 0)
        ? 'success'
        : 'failure',
      status: 'completed',
      output: {
        title: generateShortSummaryFromResults(testResults),
        summary: generateSummaryFromResults(testResults),
        annotations: generateAnnotationsFromResults(testResults)
      },
      ...github.context.repo
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function getRunContextForCheck(): { head_sha: string; runId: number } {
  if (github.context.eventName === 'workflow_run') {
    const event = github.context.payload
    if (!event.workflow_run) {
      throw new Error('Unexpected event contents, workflow_run missing?')
    }
    return {
      head_sha: event.workflow_run.head_commit.id,
      runId: event.workflow_run.id
    }
  }

  const runId = github.context.runId
  if (github.context.payload.pull_request) {
    const pr = github.context.payload.pull_request
    return { head_sha: pr.head.sha, runId }
  }

  return { head_sha: github.context.sha, runId }
}

function generateShortSummaryFromResults(testResults: TestResults): string {
  const summaryResults = testResults.results.reduce<{
    passed: number
    ignored: number
    failed: number
  }>(
    (summary, result) => {
      summary.passed += result.passed
      summary.ignored += result.ignored
      summary.failed += result.failures
      return summary
    },
    { passed: 0, ignored: 0, failed: 0 }
  )
  return `Unit Test Results (${summaryResults.passed} passed, ${summaryResults.failed} failed, ${summaryResults.ignored} ignored)`
}
function generateSummaryFromResults(testResults: TestResults): string {
  return testResults.results
    .map(
      tr =>
        `${tr.fixture}: ${tr.passed} Passed, ${tr.failures} Failed, ${tr.ignored} Ignored`
    )
    .join('\n')
}

function generateAnnotationsFromResults(testResults: TestResults):
  | {
      path: string
      start_line: number
      end_line: number
      start_column?: number | undefined
      end_column?: number | undefined
      annotation_level: 'failure' | 'notice' | 'warning'
      message: string
      title?: string | undefined
      raw_details?: string | undefined
    }[]
  | undefined {
  const annotations: {
    path: string
    start_line: number
    end_line: number
    annotation_level: 'failure' | 'notice' | 'warning'
    message: string
  }[] = []
  for (const result of testResults.results) {
    if (result.failures > 0) {
      for (const failure of result.failureDetails) {
        annotations.push({
          path: failure.fileName,
          start_line: failure.lineInfo,
          end_line: failure.lineInfo,
          message: `${result.fixture}: ${failure.unitName} failed.`,
          annotation_level: 'failure'
        })
      }
    }
  }
  return annotations
}
