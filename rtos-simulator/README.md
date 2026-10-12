# RTOS Task Scheduling Simulator

> An interactive, browser-based simulator for Real-Time Operating System (RTOS) scheduling algorithms.  
> Built as a college Operating Systems assignment to demonstrate task scheduling concepts.

---

## Features

- **Four scheduling algorithms**: FCFS, Fixed-Priority Preemptive, Rate Monotonic (RMS), Earliest Deadline First (EDF)
- **Live Gantt chart** with task colours, idle periods, and deadline markers
- **Deadline analysis**: per-job status, missed deadline detection, success rate
- **Scheduling metrics**: CPU utilisation, turnaround time, waiting time
- **Event log**: release, start, preempt, resume, complete, miss, idle events
- **Example task sets** for quick experimentation
- **Responsive design** — works on desktop and tablet

---

## Setup

No build step required. The app uses ES modules and runs directly in a modern browser.

```bash
# Clone the repo
git clone https://github.com/aditya-vrm/RTOS.git
cd RTOS/rtos-simulator

# Option A — Python (recommended, always available)
python3 -m http.server 8080
# Open: http://localhost:8080

# Option B — Node.js (if installed)
npx serve .
# Open the URL shown in the terminal
```

> **Why a server?**  
> ES module `import` statements are blocked by browsers when opening files via `file://` due to CORS restrictions.  
> A simple local HTTP server resolves this without any build tool.

---

## Folder Structure

```
rtos-simulator/
├── index.html          — App shell, all sections declared here
├── README.md
├── assets/
│   └── icons/          — SVG icons (future)
├── css/
│   ├── style.css       — Design tokens, layout, typography
│   ├── components.css  — Reusable component styles (Gantt, cards)
│   └── responsive.css  — Breakpoint overrides
├── js/
│   ├── main.js         — Entry point, wires up all modules
│   ├── ui.js           — Algorithm card selection, status, toasts
│   ├── state.js        — Centralised application state
│   ├── tasks.js        — Task model, validation, job creation
│   ├── scheduler.js    — Pure scheduling algorithm functions
│   ├── simulation.js   — Clock loop, job releases, events
│   ├── metrics.js      — Turnaround, waiting, utilisation formulas
│   └── visualization.js — Gantt SVG renderer, event log
└── tests/
    └── test-cases.md   — Manual test cases with expected results
```

---

## Algorithms

### 1. FCFS — First-Come First-Served
- **Non-preemptive**: once a job starts, it runs to completion.
- Selection: job with the earliest release time wins.
- **Does not guarantee deadlines.**
- Suitable for understanding baseline scheduling.

### 2. Fixed-Priority Preemptive (FP)
- **Preemptive**: a newly ready job with a higher priority (lower number) immediately preempts the running job.
- Priority is manually assigned per task (1 = highest).
- Tie-break: earliest release time, then task ID.
- **Does not automatically guarantee deadlines** — depends on task set design.

### 3. Rate Monotonic Scheduling (RMS)
- A special case of Fixed-Priority where **periods determine priorities**.
- Shorter period → higher priority (lower number), assigned automatically.
- Optimal among fixed-priority algorithms for periodic tasks on a uniprocessor.
- Schedulability condition: `U = Σ(Cᵢ/Tᵢ) ≤ n(2^(1/n) − 1)`.
  - For n=1: U ≤ 1.0; for n=2: U ≤ 0.828; for n→∞: U ≤ ln(2) ≈ 0.693.

### 4. Earliest Deadline First (EDF)
- **Dynamic priority**: at each tick, the ready job with the nearest absolute deadline runs.
- Optimal for uniprocessor: can schedule any task set with U ≤ 100%.
- More complex to implement than fixed-priority schemes.

---

## Priority Convention

> **Lower numeric value = Higher priority.**  
> Priority 1 beats Priority 2.  
> RMS ignores user-set priorities and assigns them by period automatically.

**Tie-breaking (all algorithms):**
1. Earliest release time
2. Smallest task ID (alphabetical) — for determinism

---

## Assumptions & Limitations

- **Discrete time only**: all execution times are positive integers. Fractional execution is not modelled.
- **Single-core CPU**: no parallelism.
- **Jobs do not overlap**: if a periodic job has not finished by the time its next job is released, the next job is still released (the unfinished job is marked as missed, not merged).
- **No context-switch overhead**: preemption is instantaneous.
- **No resource sharing / priority inversion**: tasks do not share locks or semaphores.
- **This is a simulator**, not an actual RTOS kernel. No real-time hardware guarantees apply.
- **Simulation horizon**: the clock stops at the configured horizon. Incomplete jobs at the horizon are counted as missed if their deadline has passed, and as incomplete otherwise.

---

## Metrics Formulas

| Metric | Formula | Notes |
|---|---|---|
| Turnaround | `completion − release` | Completed jobs only |
| Waiting | `turnaround − executionTime` | Completed jobs only |
| CPU Utilisation | `busyTime / horizon × 100` | Idle time excluded |
| Deadline Success Rate | `met / evaluated × 100` | Jobs with deadline ≤ horizon |
| Avg Waiting | `Σ waiting / completed` | Incomplete jobs excluded |
| Avg Turnaround | `Σ turnaround / completed` | Incomplete jobs excluded |

---

## Development Phases

| Phase | Content |
|---|---|
| 1 | Static HTML/CSS dashboard |
| 2 | Task configuration form + validation |
| 3 | FCFS engine + manual test cases |
| 4 | Simulation controls + Gantt chart + event log |
| 5 | Deadline checking + metrics panel |
| 6 | Fixed-Priority preemptive scheduling |
| 7 | Periodic tasks + RMS + EDF |
| 8 | Responsive polish + documentation + export |

---

## License

MIT — for educational use.
