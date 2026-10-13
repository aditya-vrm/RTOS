/**
 * visualization.js — Gantt Chart & Event Log Rendering (Phase 4 complete)
 */

// ── Layout Constants ─────────────────────────────────────────
export const GANTT = {
  LABEL_WIDTH:  90,
  ROW_HEIGHT:   40,
  AXIS_HEIGHT:  28,
  PX_PER_UNIT:  30,
  BLOCK_PADDING: 3,
  MIN_LABEL_PX:  20,
};

// Task colour palette (matches CSS --task-color-N variables)
export const TASK_COLORS = [
  '#4d6ef5', '#2ecc71', '#e67e22', '#9b59b6',
  '#00d2ff', '#e91e63', '#ffeb3b', '#ff5722',
];

const IDLE_COLOR   = 'rgba(255,255,255,0.06)';
const MISS_COLOR   = 'rgba(255,60,60,0.25)';
const AXIS_COLOR   = '#a0a8b8';
const GRID_COLOR   = 'rgba(255,255,255,0.06)';
const LABEL_COLOR  = '#e2e8f0';

function px(v) { return String(v); }

function svgEl(tag, attrs = {}, children = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of children) if (c) el.appendChild(c);
  return el;
}

function text(t, attrs) {
  const el = svgEl('text', attrs);
  el.textContent = t;
  return el;
}

/**
 * Render the Gantt chart SVG into #gantt-container.
 */
export function renderGantt(tasks, jobs, history, horizon) {
  const container = document.getElementById('gantt-container');
  if (!container) return;

  // Remove old SVG
  container.querySelectorAll('svg').forEach(s => s.remove());
  const placeholder = document.getElementById('gantt-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  if (!tasks.length || !history.length) {
    if (placeholder) placeholder.style.display = '';
    return;
  }

  const G = GANTT;
  const totalWidth  = G.LABEL_WIDTH + horizon * G.PX_PER_UNIT + 1;
  const totalHeight = tasks.length * G.ROW_HEIGHT + G.AXIS_HEIGHT;

  const svg = svgEl('svg', {
    width: totalWidth,
    height: totalHeight,
    viewBox: `0 0 ${totalWidth} ${totalHeight}`,
    'aria-label': 'Gantt chart',
    role: 'img',
    style: 'display:block; overflow:visible;',
  });

  // Background
  svg.appendChild(svgEl('rect', { x:0, y:0, width: totalWidth, height: totalHeight, fill: 'transparent' }));

  // ── Vertical grid lines ──────────────────────────────────
  for (let t = 0; t <= horizon; t++) {
    const x = G.LABEL_WIDTH + t * G.PX_PER_UNIT;
    svg.appendChild(svgEl('line', {
      x1: x, y1: 0, x2: x, y2: tasks.length * G.ROW_HEIGHT,
      stroke: GRID_COLOR, 'stroke-width': 1,
    }));
  }

  // ── Task rows ─────────────────────────────────────────────
  tasks.forEach((task, rowIdx) => {
    const y = rowIdx * G.ROW_HEIGHT;
    const color = TASK_COLORS[task.colorIndex % TASK_COLORS.length];

    // Row background stripe
    svg.appendChild(svgEl('rect', {
      x: 0, y, width: totalWidth, height: G.ROW_HEIGHT,
      fill: rowIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
    }));

    // Task label (left column)
    svg.appendChild(svgEl('rect', {
      x: 0, y, width: G.LABEL_WIDTH - 4, height: G.ROW_HEIGHT,
      fill: color, opacity: 0.15,
    }));
    svg.appendChild(text(task.name, {
      x: G.LABEL_WIDTH / 2 - 2, y: y + G.ROW_HEIGHT / 2 + 5,
      'text-anchor': 'middle', fill: color,
      'font-size': '12', 'font-weight': '600',
      'font-family': 'Inter, system-ui, sans-serif',
    }));

    // Execution blocks for this task
    const taskHistory = history.filter(h => h.taskId === task.id);
    for (const interval of taskHistory) {
      const bx = G.LABEL_WIDTH + interval.start * G.PX_PER_UNIT;
      const bw = (interval.end - interval.start) * G.PX_PER_UNIT;
      const by = y + G.BLOCK_PADDING;
      const bh = G.ROW_HEIGHT - G.BLOCK_PADDING * 2;

      svg.appendChild(svgEl('rect', {
        x: bx, y: by, width: bw, height: bh,
        fill: color, rx: 3, ry: 3, opacity: 0.85,
      }));

      // Label inside block if wide enough
      if (bw >= G.MIN_LABEL_PX) {
        svg.appendChild(text(task.name, {
          x: bx + bw / 2, y: by + bh / 2 + 4,
          'text-anchor': 'middle', fill: '#fff',
          'font-size': '10', 'font-weight': '600',
          'font-family': 'Inter, system-ui, sans-serif',
          'pointer-events': 'none',
        }));
      }
    }

    // Release markers for this task's jobs
    const taskJobs = jobs.filter(j => j.taskId === task.id);
    for (const job of taskJobs) {
      if (job.releaseTime >= horizon) continue;
      const mx = G.LABEL_WIDTH + job.releaseTime * G.PX_PER_UNIT;
      // Small upward triangle at release
      svg.appendChild(svgEl('polygon', {
        points: `${mx},${y + G.ROW_HEIGHT - 2} ${mx - 4},${y + G.ROW_HEIGHT - 10} ${mx + 4},${y + G.ROW_HEIGHT - 10}`,
        fill: color, opacity: 0.7,
      }));
    }

    // Deadline markers
    for (const job of taskJobs) {
      if (job.absoluteDeadline === Infinity || job.absoluteDeadline > horizon) continue;
      const dx = G.LABEL_WIDTH + job.absoluteDeadline * G.PX_PER_UNIT;
      const dlColor = job.deadlineMissed ? '#ff4d4f' : '#ff9800';
      // Downward triangle
      svg.appendChild(svgEl('polygon', {
        points: `${dx},${y + 3} ${dx - 4},${y + 11} ${dx + 4},${y + 11}`,
        fill: dlColor, opacity: 0.9,
      }));
      // Vertical dashed line
      svg.appendChild(svgEl('line', {
        x1: dx, y1: y + 2, x2: dx, y2: y + G.ROW_HEIGHT - 2,
        stroke: dlColor, 'stroke-width': 1.5,
        'stroke-dasharray': '3,2', opacity: 0.75,
      }));
    }
  });

  // Idle blocks (full-height)
  const idleHistory = history.filter(h => h.jobId === '__idle__');
  for (const interval of idleHistory) {
    const bx = G.LABEL_WIDTH + interval.start * G.PX_PER_UNIT;
    const bw = (interval.end - interval.start) * G.PX_PER_UNIT;
    svg.appendChild(svgEl('rect', {
      x: bx, y: 0, width: bw, height: tasks.length * G.ROW_HEIGHT,
      fill: IDLE_COLOR, 'stroke-dasharray': '4,3',
    }));
  }

  // ── Time axis ─────────────────────────────────────────────
  const axisY = tasks.length * G.ROW_HEIGHT;
  svg.appendChild(svgEl('rect', {
    x: 0, y: axisY, width: totalWidth, height: G.AXIS_HEIGHT,
    fill: 'rgba(0,0,0,0.2)',
  }));
  svg.appendChild(svgEl('line', {
    x1: G.LABEL_WIDTH, y1: axisY, x2: totalWidth, y2: axisY,
    stroke: AXIS_COLOR, 'stroke-width': 1,
  }));

  // Axis ticks + labels (every 1 unit, label every 5)
  for (let t = 0; t <= horizon; t++) {
    const tx = G.LABEL_WIDTH + t * G.PX_PER_UNIT;
    const tickH = t % 5 === 0 ? 6 : 3;
    svg.appendChild(svgEl('line', {
      x1: tx, y1: axisY, x2: tx, y2: axisY + tickH,
      stroke: AXIS_COLOR, 'stroke-width': 1,
    }));
    if (t % 5 === 0 || G.PX_PER_UNIT >= 20) {
      svg.appendChild(text(String(t), {
        x: tx, y: axisY + G.AXIS_HEIGHT - 6,
        'text-anchor': 'middle', fill: AXIS_COLOR,
        'font-size': '10', 'font-family': 'Inter, system-ui, sans-serif',
      }));
    }
  }

  container.appendChild(svg);

  // Show legend
  const legend = document.getElementById('gantt-legend');
  if (legend) {
    legend.style.display = 'flex';
    const legendTasks = document.getElementById('gantt-legend-tasks');
    if (legendTasks) {
      legendTasks.innerHTML = '';
      tasks.forEach(task => {
        const color = TASK_COLORS[task.colorIndex % TASK_COLORS.length];
        legendTasks.innerHTML += `
          <div class="legend-item">
            <div class="legend-swatch" style="background:${color};"></div>
            <span>${task.name}</span>
          </div>`;
      });
    }
  }

  // Show export button
  const exportBtn = document.getElementById('btn-export-svg');
  if (exportBtn) exportBtn.style.display = '';
}

/**
 * Append a single event entry to the event log DOM.
 */
export function logEvent(event) {
  const log = document.getElementById('event-log');
  if (!log) return;

  // Remove empty placeholder
  log.querySelector('.event-log-empty')?.remove();

  const typeIcons = {
    release:  '📥',
    start:    '▶',
    resume:   '↩',
    preempt:  '⚡',
    complete: '✅',
    miss:     '⚠️',
    idle:     '💤',
  };
  const typeClasses = {
    release:  'event-release',
    start:    'event-start',
    resume:   'event-resume',
    preempt:  'event-preempt',
    complete: 'event-complete',
    miss:     'event-miss',
    idle:     'event-idle',
  };

  const div = document.createElement('div');
  div.className = `event-entry ${typeClasses[event.type] || ''}`;
  div.innerHTML = `<span class="event-icon">${typeIcons[event.type] || '•'}</span><span class="event-msg">${event.message}</span>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

/**
 * Batch log multiple events (used after step).
 */
export function logEvents(events) {
  for (const ev of events) logEvent(ev);
}

/**
 * Clear the event log.
 */
export function clearLog() {
  const log = document.getElementById('event-log');
  if (!log) return;
  log.innerHTML = '<div class="event-log-empty">Events will appear here during simulation.</div>';
}

