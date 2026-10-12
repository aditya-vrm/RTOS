/**
 * state.js — Centralised Application State
 *
 * Single source of truth for:
 *  - taskList:     Array of task definitions (populated in Phase 2)
 *  - simConfig:    Algorithm, horizon, speed
 *  - simState:     Clock, running/paused flag, current job
 *  - history:      Execution intervals, events (populated in Phase 3+)
 *
 * Phase 1: scaffolding only — no logic yet.
 * Phase 2: add task CRUD (addTask, removeTask, updateTask)
 * Phase 3: add simulation state fields
 */

export const state = {
  /** @type {import('./tasks.js').TaskDefinition[]} */
  taskList: [],

  simConfig: {
    algorithm: 'fcfs',   // 'fcfs' | 'fp' | 'rms' | 'edf'
    horizon:   50,       // simulation end time
    speedLevel: 3,       // 1–5 maps to interval ms
  },

  simState: {
    clock:      0,
    running:    false,
    paused:     false,
    complete:   false,
    /** @type {import('./simulation.js').Job | null} */
    currentJob: null,
    intervalId: null,
  },

  /** @type {import('./simulation.js').ExecutionInterval[]} */
  history: [],

  /** @type {import('./simulation.js').SimEvent[]} */
  events: [],

  /** @type {import('./simulation.js').Job[]} */
  jobs: [],
};

/** Reset only the simulation (keep tasks). */
export function resetSimulation() {
  state.simState.clock      = 0;
  state.simState.running    = false;
  state.simState.paused     = false;
  state.simState.complete   = false;
  state.simState.currentJob = null;
  if (state.simState.intervalId) {
    clearInterval(state.simState.intervalId);
    state.simState.intervalId = null;
  }
  state.history = [];
  state.events  = [];
  state.jobs    = [];
}

/** Full reset — clear tasks too. */
export function resetAll() {
  state.taskList = [];
  resetSimulation();
}
