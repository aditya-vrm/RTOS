/**
 * ui.js — Phase 1 UI Bootstrap
 *
 * Wires up:
 *  1. Algorithm card visual selection (radio → card highlight)
 *  2. Speed slider label
 *  3. Keyboard shortcuts scaffold
 *  4. Toast notification helper
 *  5. Global reset button
 *
 * Everything here is pure DOM manipulation — no scheduling logic.
 */

// ── Algorithm Card Selection ────────────────────────────────
function initAlgorithmCards() {
  const cards = document.querySelectorAll('.algo-card');
  const radios = document.querySelectorAll('input[name="algorithm"]');
  const activeBadge = document.getElementById('algo-active-badge');
  const timelineBadge = document.getElementById('timeline-algo-badge');

  const ALGO_LABELS = {
    fcfs: 'FCFS',
    fp:   'Fixed-Priority',
    rms:  'RMS',
    edf:  'EDF',
  };

  function updateCards() {
    const selected = document.querySelector('input[name="algorithm"]:checked');
    if (!selected) return;
    cards.forEach(card => card.classList.remove('selected'));
    const label = document.querySelector(`label[for="${selected.id}"]`);
    if (label) label.classList.add('selected');

    const label_text = ALGO_LABELS[selected.value] || selected.value.toUpperCase();
    if (activeBadge)  activeBadge.textContent = label_text;
    if (timelineBadge) timelineBadge.textContent = label_text;
  }

  radios.forEach(radio => {
    radio.addEventListener('change', updateCards);
  });

  // Clicking the card label also triggers the radio change
  cards.forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const radio = card.querySelector('input[type="radio"]');
        if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
      }
    });
  });

  // Initialise from the default checked radio
  updateCards();
}

// ── Speed Slider Label ──────────────────────────────────────
function initSpeedSlider() {
  const slider = document.getElementById('speed-slider');
  const display = document.getElementById('speed-value');

  const SPEED_LABELS = { 1: 'Very Slow', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Very Fast' };

  function update() {
    const label = SPEED_LABELS[slider.value] || 'Normal';
    display.textContent = label;
    slider.setAttribute('aria-valuetext', label);
  }

  slider.addEventListener('input', update);
  update();
}

// ── Toast Notifications ─────────────────────────────────────
export function showToast(message, type = 'info', durationMs = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 350);
  }, durationMs);
}

// ── Keyboard Shortcuts (scaffold for future phases) ─────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts when typing in inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        // Phase 4: toggle start/pause
        break;
      case 'ArrowRight':
        e.preventDefault();
        // Phase 4: step simulation
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        document.getElementById('btn-reset-sim')?.click();
        break;
    }
  });
}

// ── Global Reset ─────────────────────────────────────────────
function initGlobalReset() {
  const btn = document.getElementById('btn-global-reset');
  btn?.addEventListener('click', () => {
    // Phase 2+: will call state.reset()
    showToast('Reset — add tasks to begin.', 'info');
    setStatus('idle');
  });
}

// ── Simulation Status Indicator ─────────────────────────────
export function setStatus(state) {
  const indicator = document.getElementById('status-indicator');
  const text = document.getElementById('status-text');
  if (!indicator || !text) return;

  const STATES = {
    idle:     'Idle',
    running:  'Running',
    paused:   'Paused',
    complete: 'Complete',
    error:    'Error',
  };

  indicator.className = `status-indicator ${state}`;
  text.textContent = STATES[state] ?? 'Unknown';
}

// ── Main init ────────────────────────────────────────────────
export function initUI() {
  initAlgorithmCards();
  initSpeedSlider();
  initKeyboardShortcuts();
  initGlobalReset();

  // Clear log button
  document.getElementById('btn-clear-log')?.addEventListener('click', () => {
    const log = document.getElementById('event-log');
    if (!log) return;
    log.innerHTML = '<div class="event-log-empty">Events will appear here during simulation.</div>';
  });

  console.log('[RTOS Simulator] Phase 1 UI initialised.');
}
