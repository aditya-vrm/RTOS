/**
 * metrics.js — Scheduling Metrics Calculation
 *
 * ALL metrics are computed from the recorded execution history,
 * NOT estimated from the Gantt chart display.
 *
 * Phase 5: Implemented fully.
 * Phase 1: Stub with formula documentation.
 *
 * ─── FORMULAS ────────────────────────────────────────────────
 *
 * Turnaround Time (TAT):
 *   TAT = completionTime − releaseTime
 *   Only defined for COMPLETED jobs.
 *
 * Waiting Time (WT):
 *   WT = TAT − executionTime
 *   Only defined for COMPLETED jobs.
 *   (For a non-preemptive model this = time spent in ready queue.)
 *
 * CPU Utilisation:
 *   U = (totalBusyTime / horizon) × 100
 *   totalBusyTime = sum of all ExecutionInterval durations.
 *   Idle CPU time is NOT counted as busy.
 *
 * Deadline Success Rate:
 *   DSR = (jobsMeetingDeadline / jobsWithDeadlineEvaluated) × 100
 *   Denominator: jobs whose absolute deadline ≤ horizon.
 *   A job completing EXACTLY at its deadline counts as meeting it.
 *   An incomplete job at its deadline counts as missed.
 *   Each job is evaluated exactly once (deadlineChecked flag).
 *
 * Average Waiting Time:
 *   avg WT = (sum of WT for completed jobs) / (count of completed jobs)
 *   Incomplete jobs are EXCLUDED from the average.
 *   The exclusion is noted in the UI.
 *
 * Average Turnaround Time:
 *   avg TAT = (sum of TAT for completed jobs) / (count of completed jobs)
 */

/**
 * Compute all scheduling metrics from simulation output.
 *
 * @param {import('./simulation.js').Job[]}              jobs
 * @param {import('./simulation.js').ExecutionInterval[]} history
 * @param {number} horizon - Simulation end time
 * @returns {Object} Metrics object
 */
export function computeMetrics(jobs, history, horizon) {
  // Will be fully implemented in Phase 5.
  console.warn('[metrics] computeMetrics() not yet implemented (Phase 5).');
  return {
    jobsReleased:       0,
    jobsCompleted:      0,
    deadlinesMet:       0,
    deadlinesMissed:    0,
    deadlineSuccessRate: 0,
    cpuUtilization:     0,
    avgWaitingTime:     null,
    avgTurnaround:      null,
    jobDetails:         [],
  };
}
