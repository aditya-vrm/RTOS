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
  const jobsReleased = jobs.length;

  const completedJobs = jobs.filter(j => j.completionTime !== null);
  const jobsCompleted = completedJobs.length;

  // Deadline evaluation: jobs whose deadline falls within the horizon
  const evaluatedJobs = jobs.filter(j =>
    j.absoluteDeadline !== Infinity && j.absoluteDeadline <= horizon
  );
  const deadlinesMet    = evaluatedJobs.filter(j => !j.deadlineMissed).length;
  const deadlinesMissed = evaluatedJobs.filter(j => j.deadlineMissed).length;
  const deadlineSuccessRate = evaluatedJobs.length > 0
    ? Math.round((deadlinesMet / evaluatedJobs.length) * 100)
    : 100;

  // CPU utilisation
  const busyTime = history
    .filter(i => i.jobId !== '__idle__')
    .reduce((sum, i) => sum + (i.end - i.start), 0);
  const cpuUtilization = Math.round((busyTime / horizon) * 100);

  // Per-completed-job metrics
  const jobDetails = completedJobs.map(j => {
    const turnaround = j.completionTime - j.releaseTime;
    const waiting    = turnaround - j.executionTime;
    return {
      jobId:        j.id,
      taskName:     j.taskName,
      jobIndex:     j.jobIndex,
      releaseTime:  j.releaseTime,
      startTime:    j.startTime,
      completionTime: j.completionTime,
      absoluteDeadline: j.absoluteDeadline,
      turnaround,
      waiting,
      deadlineMissed: j.deadlineMissed,
    };
  });

  const avgWaitingTime = jobsCompleted > 0
    ? +(jobDetails.reduce((s, j) => s + j.waiting, 0) / jobsCompleted).toFixed(2)
    : null;
  const avgTurnaround = jobsCompleted > 0
    ? +(jobDetails.reduce((s, j) => s + j.turnaround, 0) / jobsCompleted).toFixed(2)
    : null;

  return {
    jobsReleased,
    jobsCompleted,
    deadlinesMet,
    deadlinesMissed,
    deadlineSuccessRate,
    cpuUtilization,
    avgWaitingTime,
    avgTurnaround,
    jobDetails,
  };
}
