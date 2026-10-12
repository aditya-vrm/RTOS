/**
 * tasks.js — Task Definition Model & Validation
 *
 * Phase 1: JSDoc type definitions + validation rules (scaffold).
 * Phase 2: addTask(), removeTask(), updateTask(), loadExamples()
 *
 * TERMINOLOGY
 * ──────────────────────────────────────────────────────────────
 * TaskDefinition : what the user configures (period, deadline, etc.)
 * Job            : a single instance/invocation of a task, with its
 *                  own release time, absolute deadline, and remaining
 *                  execution time.
 *
 * For a periodic task, job k (k = 0, 1, 2, …) is released at:
 *   releaseTime_k = task.firstRelease + k * task.period
 *
 * Its absolute deadline is:
 *   absoluteDeadline_k = releaseTime_k + task.relativeDeadline
 *
 * For a one-shot task (no period), only job 0 is generated.
 */

/**
 * @typedef {Object} TaskDefinition
 * @property {string}  id               - Unique identifier (auto-generated)
 * @property {string}  name             - User-provided label, e.g. "T1"
 * @property {number}  executionTime    - Worst-case execution time (C), integer ≥ 1
 * @property {number|null} period       - Period (T); null = one-shot task
 * @property {number}  relativeDeadline - Deadline relative to release (D)
 * @property {number}  firstRelease     - First release / arrival time (r₀) ≥ 0
 * @property {number}  priority         - Manual priority (1 = highest); used by FP
 * @property {number}  colorIndex       - Index into CSS task-color palette (0–7)
 */

/**
 * Validates a raw task input object.
 * Returns { valid: true } or { valid: false, errors: string[] }.
 *
 * @param {Object} raw - Raw form values (strings or numbers)
 * @param {TaskDefinition[]} existingTasks - Current task list (for name uniqueness)
 * @param {string|null} editId - ID of task being edited (skip uniqueness for itself)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTask(raw, existingTasks = [], editId = null) {
  const errors = [];

  // Name
  const name = (raw.name ?? '').trim();
  if (!name) {
    errors.push('Task name is required.');
  } else if (name.length > 12) {
    errors.push('Task name must be ≤ 12 characters.');
  } else if (existingTasks.some(t => t.name === name && t.id !== editId)) {
    errors.push(`A task named "${name}" already exists.`);
  }

  // Execution time
  const C = Number(raw.executionTime);
  if (!Number.isInteger(C) || C < 1 || C > 100) {
    errors.push('Execution time must be an integer between 1 and 100.');
  }

  // Period (optional)
  const T = raw.period !== '' && raw.period != null ? Number(raw.period) : null;
  if (T !== null && (!Number.isInteger(T) || T < 1 || T > 1000)) {
    errors.push('Period must be an integer between 1 and 1000.');
  }

  // Relative deadline
  let D = raw.relativeDeadline !== '' && raw.relativeDeadline != null
    ? Number(raw.relativeDeadline)
    : null;
  // Default to period if set
  if (D === null) D = T;
  // If still null (one-shot, no deadline given), leave as null (means no deadline check)
  if (D !== null && (!Number.isInteger(D) || D < 1 || D > 1000)) {
    errors.push('Relative deadline must be an integer between 1 and 1000.');
  }
  if (D !== null && C > D) {
    errors.push(`Execution time (C=${C}) cannot exceed relative deadline (D=${D}).`);
  }
  if (T !== null && D !== null && D > T) {
    // Allowed but warn; constrained deadline (D < T) is fine too
    // D > T means deadline extends into next period — technically allowed but unusual
  }

  // First release
  const r0 = Number(raw.firstRelease ?? 0);
  if (!Number.isInteger(r0) || r0 < 0 || r0 > 1000) {
    errors.push('First release time must be an integer between 0 and 1000.');
  }

  // Priority
  const pri = Number(raw.priority ?? 1);
  if (!Number.isInteger(pri) || pri < 1 || pri > 99) {
    errors.push('Priority must be an integer between 1 and 99.');
  }

  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}

/**
 * Build a TaskDefinition from validated raw input.
 * @param {Object} raw
 * @param {number} colorIndex
 * @returns {TaskDefinition}
 */
export function createTask(raw, colorIndex) {
  const T = raw.period !== '' && raw.period != null ? Number(raw.period) : null;
  let D = raw.relativeDeadline !== '' && raw.relativeDeadline != null
    ? Number(raw.relativeDeadline)
    : null;
  if (D === null) D = T;

  return {
    id:               crypto.randomUUID(),
    name:             raw.name.trim(),
    executionTime:    Number(raw.executionTime),
    period:           T,
    relativeDeadline: D,   // null if one-shot with no deadline
    firstRelease:     Number(raw.firstRelease ?? 0),
    priority:         Number(raw.priority ?? 1),
    colorIndex:       colorIndex,
  };
}

/**
 * Example task set — demonstrating a classic RMS scenario.
 * τ1: C=1, T=4, D=4   (utilisation = 0.25)
 * τ2: C=2, T=6, D=6   (utilisation = 0.33)
 * τ3: C=2, T=12, D=12 (utilisation = 0.17)
 * Total U ≈ 0.75, well within RMS bound n(2^(1/n)−1) ≈ 0.78 for n=3
 *
 * @returns {Object[]} Array of raw task objects suitable for createTask()
 */
export function getExampleTasks() {
  return [
    { name: 'T1', executionTime: 1, period: 4,  relativeDeadline: 4,  firstRelease: 0, priority: 1 },
    { name: 'T2', executionTime: 2, period: 6,  relativeDeadline: 6,  firstRelease: 0, priority: 2 },
    { name: 'T3', executionTime: 2, period: 12, relativeDeadline: 12, firstRelease: 0, priority: 3 },
  ];
}
