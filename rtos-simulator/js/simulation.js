/**
 * simulation.js — Simulation Engine (Phases 3–7 fully implemented)
 *
 * Drives the discrete-time simulation clock.
 */

import { selectNextJob, computeRMSPriorities } from './scheduler.js';

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

/** Speed level → tick interval in ms */
function speedToMs(level) {
  const map = { 1: 800, 2: 400, 3: 200, 4: 80, 5: 20 };
  return map[level] ?? 200;
}

/** Create a Job object for job index k of a task. */
function makeJob(task, jobIndex, effectivePriority) {
  const release = task.firstRelease + jobIndex * (task.period ?? 0);
  const deadline = task.relativeDeadline != null
    ? release + task.relativeDeadline
    : Infinity;
  return {
    id: `${task.id}-j${jobIndex}`,
    taskId: task.id,
    taskName: task.name,
    jobIndex,
    releaseTime: release,
    absoluteDeadline: deadline,
    executionTime: task.executionTime,
    remainingTime: task.executionTime,
    priority: effectivePriority,
    colorIndex: task.colorIndex,
    startTime: null,
    completionTime: null,
    deadlineMissed: false,
    deadlineChecked: false,
  };
}

/**
 * Build the full job list for the simulation.
 * For periodic tasks, generates all jobs with release < horizon.
 */
export function buildJobList(tasks, horizon, algorithm) {
  const rmsPriorities = computeRMSPriorities(tasks);
  const jobs = [];

  for (const task of tasks) {
    const effectivePriority = algorithm === 'rms'
      ? (rmsPriorities.get(task.id) ?? task.priority)
      : task.priority;

    if (task.period == null) {
      if (task.firstRelease < horizon) {
        jobs.push(makeJob(task, 0, effectivePriority));
      }
    } else {
      let k = 0;
      while (true) {
        const release = task.firstRelease + k * task.period;
        if (release >= horizon) break;
        jobs.push(makeJob(task, k, effectivePriority));
        k++;
      }
    }
  }

  return jobs;
}

/**
 * Run one discrete tick of the simulation.
 * Mutates state directly.
 */
export function tick(state) {
  const { simConfig, simState, jobs, history, events } = state;
  const clock = simState.clock;
  const horizon = simConfig.horizon;
  const algorithm = simConfig.algorithm;
  const newEvents = [];

  if (clock >= horizon) {
    simState.complete = true;
    return { events: newEvents, complete: true };
  }

  // 1. Log job releases at this tick
  const released = jobs.filter(j =>
    j.releaseTime === clock && j.completionTime === null && !j.deadlineMissed
  );
  for (const j of released) {
    const dl = j.absoluteDeadline === Infinity ? '∞' : j.absoluteDeadline;
    newEvents.push({
      time: clock, type: 'release',
      message: `[t=${clock}] ${j.taskName} job #${j.jobIndex} released (deadline @${dl})`,
      jobId: j.id,
    });
  }

  // 2. Check for deadline misses on all active jobs
  for (const job of jobs) {
    if (!job.deadlineChecked && job.absoluteDeadline !== Infinity && job.absoluteDeadline <= clock) {
      job.deadlineChecked = true;
      if (job.completionTime === null) {
        job.deadlineMissed = true;
        newEvents.push({
          time: clock, type: 'miss',
          message: `[t=${clock}] ⚠ ${job.taskName} job #${job.jobIndex} MISSED deadline (was @${job.absoluteDeadline})`,
          jobId: job.id,
        });
      }
    }
  }

  // 3. Build ready queue
  const readyQueue = jobs.filter(j =>
    j.releaseTime <= clock &&
    j.remainingTime > 0 &&
    j.completionTime === null &&
    !j.deadlineMissed
  );

  // 4. Select next job
  const running = simState.currentJob;
  const { job: selected, preempted } = selectNextJob(readyQueue, running, algorithm);

  // 5. Handle preemption
  if (preempted && running) {
    newEvents.push({
      time: clock, type: 'preempt',
      message: `[t=${clock}] ${running.taskName} preempted by ${selected.taskName}`,
      jobId: running.id,
    });
  }

  // 6. Execute selected job for one tick
  if (selected) {
    const isResume = running && running.id !== selected.id && !preempted;
    if (selected.startTime === null) {
      selected.startTime = clock;
      newEvents.push({
        time: clock, type: 'start',
        message: `[t=${clock}] ${selected.taskName} job #${selected.jobIndex} started`,
        jobId: selected.id,
      });
    } else if (isResume || preempted) {
      newEvents.push({
        time: clock, type: 'resume',
        message: `[t=${clock}] ${selected.taskName} job #${selected.jobIndex} resumed`,
        jobId: selected.id,
      });
    }

    selected.remainingTime -= 1;
    simState.currentJob = selected;

    // Merge consecutive intervals for same job
    const last = history[history.length - 1];
    if (last && last.jobId === selected.id && last.end === clock) {
      last.end = clock + 1;
    } else {
      history.push({
        jobId: selected.id, taskId: selected.taskId,
        taskName: selected.taskName, colorIndex: selected.colorIndex,
        start: clock, end: clock + 1,
      });
    }

    // Completion check
    if (selected.remainingTime === 0) {
      selected.completionTime = clock + 1;
      selected.deadlineChecked = true;
      const met = selected.absoluteDeadline === Infinity || selected.completionTime <= selected.absoluteDeadline;
      if (!met) {
        selected.deadlineMissed = true;
        newEvents.push({
          time: clock + 1, type: 'miss',
          message: `[t=${clock + 1}] ⚠ ${selected.taskName} job #${selected.jobIndex} completed LATE (deadline was @${selected.absoluteDeadline})`,
          jobId: selected.id,
        });
      } else {
        newEvents.push({
          time: clock + 1, type: 'complete',
          message: `[t=${clock + 1}] ✓ ${selected.taskName} job #${selected.jobIndex} completed`,
          jobId: selected.id,
        });
      }
      simState.currentJob = null;
    }
  } else {
    // CPU idle
    simState.currentJob = null;
    const last = history[history.length - 1];
    if (last && last.jobId === '__idle__' && last.end === clock) {
      last.end = clock + 1;
    } else {
      history.push({ jobId: '__idle__', taskId: '__idle__', taskName: 'Idle', colorIndex: -1, start: clock, end: clock + 1 });
    }
    newEvents.push({ time: clock, type: 'idle', message: `[t=${clock}] CPU idle`, jobId: null });
  }

  // 7. Advance clock
  simState.clock += 1;
  for (const ev of newEvents) events.push(ev);

  // Check completion
  const allSettled = jobs.every(j =>
    j.completionTime !== null || j.deadlineMissed || j.releaseTime >= horizon
  );
  if (simState.clock >= horizon || allSettled) {
    simState.complete = true;
    return { events: newEvents, complete: true };
  }

  return { events: newEvents, complete: false };
}

/**
 * Run the full simulation step-by-step with a timer.
 */
export function runSimulation(state, onTick, onComplete) {
  function step() {
    if (state.simState.complete || !state.simState.running || state.simState.paused) return;

    const { events, complete } = tick(state);
    if (onTick) onTick(state, events);

    if (complete) {
      state.simState.running = false;
      if (onComplete) onComplete(state);
      return;
    }

    const ms = speedToMs(state.simConfig.speedLevel);
    state.simState.intervalId = setTimeout(step, ms);
  }

  step();
}

/**
 * Advance exactly one tick (manual step mode).
 */
export function stepSimulation(state) {
  if (state.simState.complete) return { events: [], complete: true };
  return tick(state);
}
