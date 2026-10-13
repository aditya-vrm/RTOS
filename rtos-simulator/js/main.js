/**
 * main.js — Entry point & Central Coordinator (Phases 2–8)
 *
 * Wires up:
 *   - Task form CRUD (add, update, delete, load examples)
 *   - Task table rendering
 *   - Simulation start / pause / step / reset
 *   - Live Gantt chart + event log updates on each tick
 *   - Metrics panel and per-job results table
 *   - SVG export
 *   - Keyboard shortcuts
 */

import { initUI, showToast, setStatus } from './ui.js';
import { state, resetSimulation, resetAll } from './state.js';
import { validateTask, createTask, getExampleTasks } from './tasks.js';
import { buildJobList, runSimulation, stepSimulation } from './simulation.js';
import { computeMetrics } from './metrics.js';
import { renderGantt, logEvents, clearLog } from './visualization.js';

// ── Colour index cycling ─────────────────────────────────────
let nextColorIndex = 0;
const COLOR_COUNT  = 8;

// ── Edit state ───────────────────────────────────────────────
let editingTaskId = null;

// ══════════════════════════════════════════════════════════════
//  TASK TABLE
// ══════════════════════════════════════════════════════════════

function renderTaskTable() {
  const tbody = document.getElementById('task-table-body');
  const badge = document.getElementById('task-count-badge');
  if (!tbody) return;

  const emptyRow = document.getElementById('task-table-empty-row');

  // Remove all data rows (preserve empty-row node)
  Array.from(tbody.querySelectorAll('tr[data-task-id]')).forEach(r => r.remove());

  if (state.taskList.length === 0) {
    if (emptyRow) emptyRow.style.display = '';
    if (badge) badge.textContent = '0 tasks';
    return;
  }

  if (emptyRow) emptyRow.style.display = 'none';
  if (badge) badge.textContent = `${state.taskList.length} task${state.taskList.length !== 1 ? 's' : ''}`;

  const COLORS = ['#4d6ef5','#2ecc71','#e67e22','#9b59b6','#00d2ff','#e91e63','#ffeb3b','#ff5722'];

  for (const task of state.taskList) {
    const color = COLORS[task.colorIndex % COLORS.length];
    const tr = document.createElement('tr');
    tr.dataset.taskId = task.id;
    tr.innerHTML = `
      <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>${task.name}</td>
      <td>${task.executionTime}</td>
      <td>${task.period ?? '—'}</td>
      <td>${task.relativeDeadline ?? '—'}</td>
      <td>${task.firstRelease}</td>
      <td>${task.priority}</td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-ghost btn-edit" data-id="${task.id}"
            style="font-size:11px;padding:2px 8px;" title="Edit task">✎</button>
          <button class="btn btn-ghost btn-delete" data-id="${task.id}"
            style="font-size:11px;padding:2px 8px;color:var(--clr-accent-red);" title="Remove task">✕</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  }

  // Edit / delete button listeners
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.id));
  });
}

// ══════════════════════════════════════════════════════════════
//  TASK FORM
// ══════════════════════════════════════════════════════════════

function getFormValues() {
  return {
    name:             document.getElementById('input-task-name')?.value ?? '',
    executionTime:    document.getElementById('input-exec-time')?.value ?? '',
    period:           document.getElementById('input-period')?.value ?? '',
    relativeDeadline: document.getElementById('input-deadline')?.value ?? '',
    firstRelease:     document.getElementById('input-arrival')?.value ?? '0',
    priority:         document.getElementById('input-priority')?.value ?? '1',
  };
}

function clearForm() {
  ['input-task-name','input-exec-time','input-period','input-deadline'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const arr = document.getElementById('input-arrival');
  if (arr) arr.value = '0';
  const pri = document.getElementById('input-priority');
  if (pri) pri.value = '1';
  clearFormErrors();
  hideCallout();
}

function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; });
}

function showCallout(msg) {
  const c = document.getElementById('form-callout');
  const m = document.getElementById('form-callout-msg');
  if (c) c.style.display = '';
  if (m) m.textContent = msg;
}

function hideCallout() {
  const c = document.getElementById('form-callout');
  if (c) c.style.display = 'none';
}

function setEditMode(editing) {
  const btnAdd    = document.getElementById('btn-add-task');
  const btnUpdate = document.getElementById('btn-update-task');
  const btnCancel = document.getElementById('btn-cancel-edit');
  if (editing) {
    btnAdd?.style && (btnAdd.style.display = 'none');
    if (btnUpdate) btnUpdate.style.display = '';
    if (btnCancel) btnCancel.style.display = '';
  } else {
    if (btnAdd) btnAdd.style.display = '';
    btnUpdate?.style && (btnUpdate.style.display = 'none');
    btnCancel?.style && (btnCancel.style.display = 'none');
    editingTaskId = null;
  }
}

function startEdit(taskId) {
  const task = state.taskList.find(t => t.id === taskId);
  if (!task) return;
  editingTaskId = taskId;

  document.getElementById('input-task-name').value  = task.name;
  document.getElementById('input-exec-time').value  = task.executionTime;
  document.getElementById('input-period').value      = task.period ?? '';
  document.getElementById('input-deadline').value    = task.relativeDeadline ?? '';
  document.getElementById('input-arrival').value     = task.firstRelease;
  document.getElementById('input-priority').value    = task.priority;

  setEditMode(true);
  document.getElementById('input-task-name')?.focus();
}

function deleteTask(taskId) {
  state.taskList = state.taskList.filter(t => t.id !== taskId);
  renderTaskTable();
  showToast('Task removed.', 'info', 2000);
  if (editingTaskId === taskId) {
    setEditMode(false);
    clearForm();
  }
}

// ══════════════════════════════════════════════════════════════
//  SIMULATION CONTROLS
// ══════════════════════════════════════════════════════════════

function readConfig() {
  const algo    = document.querySelector('input[name="algorithm"]:checked')?.value ?? 'fcfs';
  const horizon = parseInt(document.getElementById('input-horizon')?.value ?? '50', 10);
  const speed   = parseInt(document.getElementById('speed-slider')?.value ?? '3', 10);
  return { algo, horizon: isNaN(horizon) ? 50 : horizon, speed };
}

function setButtonStates(running, paused, complete) {
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnStep  = document.getElementById('btn-step');
  const btnReset = document.getElementById('btn-reset-sim');

  if (complete) {
    if (btnStart) { btnStart.textContent = '▶ Start'; btnStart.disabled = true; }
    if (btnPause) btnPause.disabled = true;
    if (btnStep)  btnStep.disabled  = true;
    if (btnReset) btnReset.disabled = false;
  } else if (running && !paused) {
    if (btnStart) { btnStart.textContent = '▶ Running…'; btnStart.disabled = true; }
    if (btnPause) btnPause.disabled = false;
    if (btnStep)  btnStep.disabled  = true;
    if (btnReset) btnReset.disabled = false;
  } else if (paused) {
    if (btnStart) { btnStart.textContent = '▶ Resume'; btnStart.disabled = false; }
    if (btnPause) btnPause.disabled = true;
    if (btnStep)  btnStep.disabled  = false;
    if (btnReset) btnReset.disabled = false;
  } else {
    if (btnStart) { btnStart.textContent = '▶ Start'; btnStart.disabled = false; }
    if (btnPause) btnPause.disabled = true;
    if (btnStep)  btnStep.disabled  = false;
    if (btnReset) btnReset.disabled = false;
  }
}

function updateClockDisplay() {
  const el = document.getElementById('sim-clock-display');
  if (el) el.textContent = `t = ${state.simState.clock}`;
}

function onTick(st, newEvents) {
  updateClockDisplay();
  logEvents(newEvents);
  renderGantt(st.taskList, st.jobs, st.history, st.simConfig.horizon);
}

function onComplete(st) {
  setStatus('complete');
  setButtonStates(false, false, true);
  updateClockDisplay();
  renderGantt(st.taskList, st.jobs, st.history, st.simConfig.horizon);
  updateMetrics();
  showToast('Simulation complete!', 'success', 3000);
}

function startSim() {
  if (state.taskList.length === 0) {
    showToast('Add at least one task before running.', 'warn', 3000);
    return;
  }

  const { algo, horizon, speed } = readConfig();

  // Resume if paused
  if (state.simState.paused && !state.simState.complete) {
    state.simState.paused  = false;
    state.simState.running = true;
    setStatus('running');
    setButtonStates(true, false, false);
    runSimulation(state, onTick, onComplete);
    return;
  }

  // Fresh start
  resetSimulation();
  clearLog();
  resetMetrics();

  state.simConfig.algorithm  = algo;
  state.simConfig.horizon    = horizon;
  state.simConfig.speedLevel = speed;
  state.jobs = buildJobList(state.taskList, horizon, algo);
  state.simState.running = true;
  state.simState.paused  = false;

  updateClockDisplay();
  setStatus('running');
  setButtonStates(true, false, false);

  runSimulation(state, onTick, onComplete);
}

function pauseSim() {
  if (!state.simState.running) return;
  state.simState.paused  = true;
  state.simState.running = false;
  if (state.simState.intervalId) {
    clearTimeout(state.simState.intervalId);
    state.simState.intervalId = null;
  }
  setStatus('paused');
  setButtonStates(false, true, false);
  showToast('Simulation paused.', 'info', 2000);
}

function stepSim() {
  if (state.simState.complete) return;

  const { algo, horizon, speed } = readConfig();

  // Init if not yet started
  if (!state.simState.running && !state.simState.paused && state.simState.clock === 0 && state.jobs.length === 0) {
    if (state.taskList.length === 0) {
      showToast('Add at least one task first.', 'warn', 3000);
      return;
    }
    resetSimulation();
    clearLog();
    resetMetrics();
    state.simConfig.algorithm  = algo;
    state.simConfig.horizon    = horizon;
    state.simConfig.speedLevel = speed;
    state.jobs = buildJobList(state.taskList, horizon, algo);
    setStatus('paused');
    setButtonStates(false, true, false);
  }

  state.simState.paused  = true;
  state.simState.running = false;

  const { events, complete } = stepSimulation(state);
  updateClockDisplay();
  logEvents(events);
  renderGantt(state.taskList, state.jobs, state.history, state.simConfig.horizon);

  if (complete) {
    onComplete(state);
  }
}

function doReset() {
  if (state.simState.intervalId) {
    clearTimeout(state.simState.intervalId);
    state.simState.intervalId = null;
  }
  resetSimulation();
  clearLog();
  resetMetrics();
  updateClockDisplay();
  setStatus('idle');
  setButtonStates(false, false, false);

  // Reset Gantt
  const container = document.getElementById('gantt-container');
  const placeholder = document.getElementById('gantt-placeholder');
  if (container) container.querySelectorAll('svg').forEach(s => s.remove());
  if (placeholder) placeholder.style.display = '';
  const legend = document.getElementById('gantt-legend');
  if (legend) legend.style.display = 'none';
  const exportBtn = document.getElementById('btn-export-svg');
  if (exportBtn) exportBtn.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════
//  METRICS PANEL
// ══════════════════════════════════════════════════════════════

function resetMetrics() {
  ['metric-jobs-done','metric-jobs-total','metric-deadlines-met',
   'metric-deadlines-pct','metric-deadlines-missed','metric-cpu-util',
   'metric-avg-wait','metric-avg-turnaround'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
  const bar = document.getElementById('util-bar');
  if (bar) bar.style.width = '0%';
  const wrapper = document.getElementById('results-table-wrapper');
  if (wrapper) wrapper.style.display = 'none';
}

function updateMetrics() {
  const m = computeMetrics(state.jobs, state.history, state.simConfig.horizon);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('metric-jobs-done',       m.jobsCompleted);
  set('metric-jobs-total',      m.jobsReleased);
  set('metric-deadlines-met',   m.deadlinesMet);
  set('metric-deadlines-pct',   m.deadlineSuccessRate);
  set('metric-deadlines-missed', m.deadlinesMissed);
  set('metric-cpu-util',        `${m.cpuUtilization}%`);
  set('metric-avg-wait',        m.avgWaitingTime != null ? m.avgWaitingTime : '—');
  set('metric-avg-turnaround',  m.avgTurnaround  != null ? m.avgTurnaround  : '—');

  // Utilization bar
  const bar = document.getElementById('util-bar');
  if (bar) {
    bar.style.width = `${Math.min(m.cpuUtilization, 100)}%`;
    bar.style.background = m.cpuUtilization > 90
      ? 'var(--clr-accent-red)'
      : m.cpuUtilization > 70
        ? '#ff9800'
        : 'var(--clr-accent-cyan)';
  }

  // Results table
  renderResultsTable(m.jobDetails);
}

function renderResultsTable(jobDetails) {
  const wrapper = document.getElementById('results-table-wrapper');
  const tbody   = document.getElementById('results-table-body');
  if (!wrapper || !tbody || !jobDetails.length) return;

  wrapper.style.display = '';
  tbody.innerHTML = '';

  for (const j of jobDetails) {
    const dl = j.absoluteDeadline === Infinity ? '∞' : j.absoluteDeadline;
    const statusClass = j.deadlineMissed ? 'status-miss' : 'status-ok';
    const statusLabel = j.deadlineMissed ? '⚠ Missed' : '✓ Met';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${j.taskName} #${j.jobIndex}</td>
      <td>${j.releaseTime}</td>
      <td>${j.startTime ?? '—'}</td>
      <td>${j.completionTime}</td>
      <td>${dl}</td>
      <td>${j.turnaround}</td>
      <td>${j.waiting}</td>
      <td><span class="result-status ${statusClass}">${statusLabel}</span></td>`;
    tbody.appendChild(tr);
  }
}

// ══════════════════════════════════════════════════════════════
//  SVG EXPORT
// ══════════════════════════════════════════════════════════════

function exportSVG() {
  const svg = document.querySelector('#gantt-container svg');
  if (!svg) return;
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rtos-gantt.svg';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Gantt chart exported as SVG.', 'success', 2500);
}

// ══════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════

function initFullKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (state.simState.running && !state.simState.paused) pauseSim();
        else startSim();
        break;
      case 'ArrowRight':
        e.preventDefault();
        stepSim();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        doReset();
        break;
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initUI();

  // ── Task form ──────────────────────────────────────────────
  const taskForm = document.getElementById('task-form');
  taskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFormErrors();
    hideCallout();

    const raw = getFormValues();
    const { valid, errors } = validateTask(raw, state.taskList, null);

    if (!valid) {
      showCallout(errors.join(' '));
      return;
    }

    const task = createTask(raw, nextColorIndex % COLOR_COUNT);
    nextColorIndex++;
    state.taskList.push(task);
    renderTaskTable();
    clearForm();
    showToast(`Task "${task.name}" added.`, 'success', 2000);
  });

  // Update task
  document.getElementById('btn-update-task')?.addEventListener('click', () => {
    if (!editingTaskId) return;
    clearFormErrors();
    hideCallout();

    const raw = getFormValues();
    const { valid, errors } = validateTask(raw, state.taskList, editingTaskId);

    if (!valid) {
      showCallout(errors.join(' '));
      return;
    }

    const idx = state.taskList.findIndex(t => t.id === editingTaskId);
    if (idx === -1) return;
    const colorIndex = state.taskList[idx].colorIndex;
    const updated = createTask(raw, colorIndex);
    updated.id = editingTaskId;
    state.taskList[idx] = updated;

    setEditMode(false);
    clearForm();
    renderTaskTable();
    showToast(`Task "${updated.name}" updated.`, 'success', 2000);
  });

  // Cancel edit
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    setEditMode(false);
    clearForm();
  });

  // Load examples
  document.getElementById('btn-load-examples')?.addEventListener('click', () => {
    const examples = getExampleTasks();
    let added = 0;
    for (const raw of examples) {
      if (state.taskList.some(t => t.name === raw.name)) continue;
      const task = createTask(raw, nextColorIndex % COLOR_COUNT);
      nextColorIndex++;
      state.taskList.push(task);
      added++;
    }
    renderTaskTable();
    if (added > 0) showToast(`Loaded ${added} example task${added !== 1 ? 's' : ''}.`, 'success', 2500);
    else showToast('Example tasks already loaded.', 'info', 2000);
  });

  // ── Simulation controls ────────────────────────────────────
  document.getElementById('btn-start')?.addEventListener('click', startSim);
  document.getElementById('btn-pause')?.addEventListener('click', pauseSim);
  document.getElementById('btn-step')?.addEventListener('click', stepSim);
  document.getElementById('btn-reset-sim')?.addEventListener('click', doReset);

  // Global reset
  document.getElementById('btn-global-reset')?.addEventListener('click', () => {
    doReset();
    resetAll();
    nextColorIndex = 0;
    editingTaskId  = null;
    setEditMode(false);
    clearForm();
    renderTaskTable();
    showToast('All tasks and simulation cleared.', 'info', 2500);
  });

  // Speed slider live update
  document.getElementById('speed-slider')?.addEventListener('input', (e) => {
    state.simConfig.speedLevel = parseInt(e.target.value, 10);
  });

  // Export SVG
  document.getElementById('btn-export-svg')?.addEventListener('click', exportSVG);

  // Clear log
  document.getElementById('btn-clear-log')?.addEventListener('click', clearLog);

  // Keyboard shortcuts (replaces scaffold in ui.js)
  initFullKeyboardShortcuts();

  // Initial state
  setStatus('idle');
  setButtonStates(false, false, false);
  renderTaskTable();

  console.log('[RTOS Simulator] All phases initialised.');
});

