/**
 * simulation.js — Simulation Engine
 *
 * Drives the discrete-time simulation clock.
 * Phase 1: type definitions and scaffolding.
 * Phase 3: FCFS simulation loop.
 * Phase 4: Playback controls (step, pause, resume).
 * Phase 5: Deadline checking.
 * Phase 6: Preemption support.
 * Phase 7: Periodic job generation.
 *
 * ─── DATA MODEL ──────────────────────────────────────────────
 *
 * Job (one invocation of a task):
 *   id               string — unique
 *   taskId           string — parent TaskDefinition.id
 *   taskName         string
 *   jobIndex         number — k (0-based, for periodic tasks)
 *   releaseTime      number — when it enters the ready queue
 *   absoluteDeadline number — releaseTime + task.relativeDeadline
 *   executionTime    number — total CPU units needed (copy of task.C)
 *   remainingTime    number — units still to run
 *   priority         number — effective priority (may differ for RMS)
 *   colorIndex       number
 *   startTime        number|null — first time unit it was executed
 *   completionTime   number|null — when remainingTime reached 0
 *   deadlineMissed   boolean — set true when it misses; never toggled back
 *   deadlineChecked  boolean — true once deadline has been evaluated
 *
 * ExecutionInterval (one continuous run on the CPU):
 *   jobId   string
 *   taskId  string
 *   taskName string
 *   colorIndex number
 *   start   number — inclusive start tick
 *   end     number — exclusive end tick (end - start = duration)
 *
 * SimEvent (log entry):
 *   time    number
 *   type    'release'|'start'|'preempt'|'resume'|'complete'|'miss'|'idle'
 *   message string — human-readable description
 *   jobId   string|null
 */

/**
 * @typedef {Object} Job
 * @property {string}      id
 * @property {string}      taskId
 * @property {string}      taskName
 * @property {number}      jobIndex
 * @property {number}      releaseTime
 * @property {number}      absoluteDeadline
 * @property {number}      executionTime
 * @property {number}      remainingTime
 * @property {number}      priority
 * @property {number}      colorIndex
 * @property {number|null} startTime
 * @property {number|null} completionTime
 * @property {boolean}     deadlineMissed
 * @property {boolean}     deadlineChecked
 */

/**
 * @typedef {Object} ExecutionInterval
 * @property {string} jobId
 * @property {string} taskId
 * @property {string} taskName
 * @property {number} colorIndex
 * @property {number} start
 * @property {number} end
 */

/**
 * @typedef {Object} SimEvent
 * @property {number} time
 * @property {string} type
 * @property {string} message
 * @property {string|null} jobId
 */

// Will be fully implemented in Phase 3.
// Exported as stubs so imports don't break.

export function runSimulation(_state, _onTick, _onComplete) {
  console.warn('[simulation] runSimulation() not yet implemented (Phase 3).');
}

export function stepSimulation(_state) {
  console.warn('[simulation] stepSimulation() not yet implemented (Phase 4).');
}
