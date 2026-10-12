/**
 * scheduler.js — Scheduling Algorithm Pure Functions
 *
 * ALL functions here are PURE: given a ready queue and config,
 * they return a job ID (or null) with no side effects, no DOM access,
 * no global state mutation.
 *
 * Phase 3: FCFS implemented.
 * Phase 6: Fixed-Priority implemented.
 * Phase 7: RMS implemented (same as FP with auto-priority).
 * Phase 7+: EDF implemented.
 *
 * ─── PRIORITY CONVENTION ────────────────────────────────────
 * Lower numeric value = higher priority.
 * Example: priority 1 beats priority 2.
 *
 * ─── TIE-BREAKING ORDER ─────────────────────────────────────
 * 1. Earliest release time (releaseTime)
 * 2. Smallest task ID (string comparison) — stable, deterministic
 *
 * ─── ALGORITHM OVERVIEW ─────────────────────────────────────
 * FCFS:
 *   Non-preemptive. Once a job starts, it runs to completion.
 *   Among ready jobs, pick the one with the earliest release time.
 *   Does NOT guarantee deadlines.
 *
 * Fixed-Priority Preemptive (FP):
 *   At each tick, the ready job with the lowest priority number wins.
 *   A newly ready higher-priority job can preempt the current runner.
 *   Does NOT automatically guarantee deadlines unless utilisation
 *   and priority assignment are carefully designed.
 *
 * Rate Monotonic Scheduling (RMS):
 *   Identical to FP, but priorities are ASSIGNED BY PERIOD:
 *   shorter period → higher priority (lower number).
 *   The user-specified priority field is ignored.
 *   Optimal among fixed-priority algorithms for periodic tasks
 *   under the RMS utilisation bound: U ≤ n(2^(1/n) − 1).
 *
 * Earliest Deadline First (EDF):
 *   Dynamic. At each tick, pick the ready job with the smallest
 *   absolute deadline. Optimal for uniprocessor utilisation ≤ 100%.
 */

/**
 * @typedef {Object} ReadyJob
 * @property {string}  id               - Job unique ID
 * @property {string}  taskId           - Parent task ID
 * @property {string}  taskName         - Parent task name (for display)
 * @property {number}  releaseTime      - When this job became ready
 * @property {number}  absoluteDeadline - Absolute deadline (release + relDeadline)
 * @property {number}  remainingTime    - CPU units still needed
 * @property {number}  priority         - Effective priority (may be RMS-computed)
 * @property {number}  colorIndex       - Visual colour slot
 */

/**
 * Selects the next job to run given a ready queue and algorithm.
 *
 * @param {ReadyJob[]}  readyQueue     - Jobs currently ready to run
 * @param {ReadyJob|null} runningJob   - Job currently executing (null if idle)
 * @param {string}      algorithm      - 'fcfs' | 'fp' | 'rms' | 'edf'
 * @returns {{ job: ReadyJob|null, preempted: boolean }}
 *          job=null means CPU is idle; preempted=true means runningJob was displaced.
 */
export function selectNextJob(readyQueue, runningJob, algorithm) {
  if (readyQueue.length === 0) {
    // No ready jobs — CPU is idle
    return { job: null, preempted: false };
  }

  switch (algorithm) {
    case 'fcfs': return scheduleFCFS(readyQueue, runningJob);
    case 'fp':   return scheduleFP(readyQueue, runningJob);
    case 'rms':  return scheduleRMS(readyQueue, runningJob);
    case 'edf':  return scheduleEDF(readyQueue, runningJob);
    default:
      console.warn(`[scheduler] Unknown algorithm "${algorithm}", falling back to FCFS.`);
      return scheduleFCFS(readyQueue, runningJob);
  }
}

// ── FCFS ────────────────────────────────────────────────────
function scheduleFCFS(readyQueue, runningJob) {
  // Non-preemptive: if something is already running, keep it.
  if (runningJob && runningJob.remainingTime > 0) {
    return { job: runningJob, preempted: false };
  }
  // Pick the job with the earliest release time (arrival order).
  // Tie: smallest taskId for determinism.
  const sorted = [...readyQueue].sort((a, b) =>
    a.releaseTime !== b.releaseTime
      ? a.releaseTime - b.releaseTime
      : a.taskId.localeCompare(b.taskId)
  );
  return { job: sorted[0], preempted: false };
}

// ── Fixed-Priority Preemptive ────────────────────────────────
function scheduleFP(readyQueue, runningJob) {
  const best = pickLowestPriority(readyQueue);
  if (!best) return { job: null, preempted: false };

  const preempted = !!(
    runningJob &&
    runningJob.remainingTime > 0 &&
    best.id !== runningJob.id &&
    best.priority < runningJob.priority
  );

  return { job: best, preempted };
}

// ── RMS (same as FP — priorities pre-assigned by period) ────
function scheduleRMS(readyQueue, runningJob) {
  // RMS priorities are assigned by the simulation engine before
  // this function is called (shorter period → lower priority number).
  // The scheduling decision itself is identical to Fixed-Priority.
  return scheduleFP(readyQueue, runningJob);
}

// ── EDF ─────────────────────────────────────────────────────
function scheduleEDF(readyQueue, runningJob) {
  // Dynamic priority: job with earliest absolute deadline wins.
  const sorted = [...readyQueue].sort((a, b) => {
    if (a.absoluteDeadline !== b.absoluteDeadline)
      return a.absoluteDeadline - b.absoluteDeadline;
    // Tie: earliest release, then taskId
    if (a.releaseTime !== b.releaseTime)
      return a.releaseTime - b.releaseTime;
    return a.taskId.localeCompare(b.taskId);
  });

  const best = sorted[0];
  const preempted = !!(
    runningJob &&
    runningJob.remainingTime > 0 &&
    best.id !== runningJob.id &&
    best.absoluteDeadline < runningJob.absoluteDeadline
  );

  return { job: best, preempted };
}

// ── Helper: pick job with smallest priority number ───────────
function pickLowestPriority(readyQueue) {
  return readyQueue.reduce((best, job) => {
    if (!best) return job;
    if (job.priority < best.priority) return job;
    if (job.priority === best.priority) {
      // Tie-break: earlier release first, then taskId
      if (job.releaseTime < best.releaseTime) return job;
      if (job.releaseTime === best.releaseTime)
        return job.taskId.localeCompare(best.taskId) < 0 ? job : best;
    }
    return best;
  }, null);
}

/**
 * Compute RMS priority for a task given its period.
 * Shorter period → lower number → higher priority.
 *
 * This is called by the simulation engine when algorithm = 'rms'.
 * It sorts tasks by period and assigns rank 1, 2, 3, …
 *
 * @param {import('./tasks.js').TaskDefinition[]} tasks
 * @returns {Map<string, number>} taskId → priority number
 */
export function computeRMSPriorities(tasks) {
  const sorted = [...tasks].sort((a, b) => {
    const ta = a.period ?? Infinity;
    const tb = b.period ?? Infinity;
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id); // tie: deterministic
  });

  const map = new Map();
  sorted.forEach((task, index) => {
    map.set(task.id, index + 1);
  });
  return map;
}

/**
 * Compute the theoretical RMS utilisation bound for n tasks.
 * U_bound = n * (2^(1/n) - 1)
 * For n → ∞ this approaches ln(2) ≈ 0.693.
 *
 * @param {number} n - Number of periodic tasks
 * @returns {number} Utilisation bound (0–1)
 */
export function rmsBound(n) {
  if (n <= 0) return 0;
  return n * (Math.pow(2, 1 / n) - 1);
}
