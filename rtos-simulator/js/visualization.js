/**
 * visualization.js — Gantt Chart & Event Log Rendering
 *
 * Renders the Gantt chart as an inline SVG.
 * Renders event log entries as DOM nodes.
 *
 * Phase 1: Constants and DOM helper scaffolding.
 * Phase 4: SVG Gantt chart implementation.
 *
 * ─── ARCHITECTURE ────────────────────────────────────────────
 * This module ONLY reads data; it never writes to state.
 * Input:  jobs[], history[], events[], tasks[]
 * Output: DOM mutations (SVG, event log entries)
 *
 * ─── GANTT CHART LAYOUT ──────────────────────────────────────
 * Left column : task labels  (LABEL_WIDTH px)
 * Right area  : time blocks  (width = horizon * PX_PER_UNIT)
 * Each task   : one row      (ROW_HEIGHT px)
 * Bottom row  : time axis    (AXIS_HEIGHT px)
 *
 * Execution blocks: filled rect with task colour.
 * Idle blocks: dashed rect with muted fill.
 * Deadline markers: downward triangle at absoluteDeadline column.
 * Release markers: vertical dashed line at releaseTime column.
 */

// ── Layout Constants ─────────────────────────────────────────
export const GANTT = {
  LABEL_WIDTH:  80,   // px — left task-label column
  ROW_HEIGHT:   38,   // px — height of each task row
  AXIS_HEIGHT:  22,   // px — time axis strip at bottom
  PX_PER_UNIT:  28,   // px — width of one time unit
  BLOCK_PADDING: 3,   // px — vertical padding inside row
  MIN_LABEL_PX:  18,  // min block width to show text label
};

// Task colour palette (must match CSS --task-color-N variables)
export const TASK_COLORS = [
  '#4d6ef5', // 0 blue
  '#2ecc71', // 1 green
  '#e67e22', // 2 orange
  '#9b59b6', // 3 purple
  '#00d2ff', // 4 cyan
  '#e91e63', // 5 pink
  '#ffeb3b', // 6 yellow
  '#ff5722', // 7 deep-orange
];

/**
 * Render the Gantt chart SVG into #gantt-container.
 * Will be fully implemented in Phase 4.
 *
 * @param {import('./tasks.js').TaskDefinition[]} tasks
 * @param {import('./simulation.js').Job[]}       jobs
 * @param {import('./simulation.js').ExecutionInterval[]} history
 * @param {number} horizon
 */
export function renderGantt(tasks, jobs, history, horizon) {
  console.warn('[visualization] renderGantt() not yet implemented (Phase 4).');
}

/**
 * Append a single event entry to the event log DOM.
 * Will be fully implemented in Phase 4.
 *
 * @param {import('./simulation.js').SimEvent} event
 */
export function logEvent(event) {
  console.warn('[visualization] logEvent() not yet implemented (Phase 4).');
}

/**
 * Clear the event log.
 */
export function clearLog() {
  const log = document.getElementById('event-log');
  if (!log) return;
  log.innerHTML = '<div class="event-log-empty">Events will appear here during simulation.</div>';
}
