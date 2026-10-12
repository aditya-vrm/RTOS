# RTOS Simulator — Manual Test Cases

All expected results are computed by hand before running the simulator.
A test is **PASSED** only when the simulator's computed metrics match
the manually computed values — not merely when the UI looks correct.

---

## Test Case Format

Each case lists:
- **Input**: task set and algorithm
- **Expected schedule**: which job runs at each tick
- **Expected metrics**: computed by hand
- **Expected events**: what should appear in the event log

---

## TC-01: Single Task, Completes Before Deadline

**Algorithm**: FCFS  
**Task**: T1, C=3, D=10, r₀=0, period=none

| t | Running |
|---|---------|
| 0 | T1      |
| 1 | T1      |
| 2 | T1      |
| 3 | Idle    |

**Expected metrics**:
- Jobs released: 1, Jobs completed: 1
- Deadlines met: 1 (T1 finishes at t=3, deadline=10, 3 ≤ 10 ✓)
- CPU utilisation: 3/10 × 100 = 30%
- Turnaround: 3 − 0 = 3
- Waiting: 3 − 3 = 0
- Deadline success rate: 100%

**Expected events**: release@0, start@0, complete@3

---

## TC-02: Two Tasks, Different Arrivals (FCFS)

**Algorithm**: FCFS  
**Tasks**:
- T1: C=3, r₀=0, D=10
- T2: C=2, r₀=2, D=10

| t | Running | Ready queue |
|---|---------|-------------|
| 0 | T1      | [T1]        |
| 1 | T1      | [T1, T2 arrives] |
| 2 | T1      | [T1, T2]    |
| 3 | T2      | [T2]        |
| 4 | T2      | []          |
| 5 | Idle    |             |

> FCFS is non-preemptive. T2 arrives at t=2 but must wait for T1 to finish at t=3.

**Expected metrics**:
- T1: start=0, finish=3, TAT=3, WT=0
- T2: start=3, finish=5, TAT=5-2=3, WT=3-2=1
- Avg TAT = (3+3)/2 = 3
- Avg WT  = (0+1)/2 = 0.5
- CPU util: 5/10 × 100 = 50%

---

## TC-03: Priority Preemption

**Algorithm**: Fixed-Priority Preemptive  
**Tasks**:
- T1: C=4, r₀=0, priority=2 (lower priority)
- T2: C=2, r₀=2, priority=1 (higher priority)

| t | Running | Event |
|---|---------|-------|
| 0 | T1      | T1 starts |
| 1 | T1      |       |
| 2 | T2      | T2 arrives, preempts T1 |
| 3 | T2      |       |
| 4 | T1      | T1 resumes (2 remaining) |
| 5 | T1      |       |

**Expected events**: release@0(T1), start@0(T1), release@2(T2), preempt@2(T1), start@2(T2), complete@4(T2), resume@4(T1), complete@6(T1)

**T1**: start=0, finish=6, TAT=6, WT=6-4=2  
**T2**: start=2, finish=4, TAT=4-2=2, WT=2-2=0  

---

## TC-04: Exact Deadline Completion

**Algorithm**: FCFS  
**Task**: T1, C=5, D=5, r₀=0

| t | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Running | T1 | T1 | T1 | T1 | T1 |

T1 finishes at t=5. Deadline = 5. **5 ≤ 5 → MET** ✓

**Expected**: deadline met = 1, missed = 0, success rate = 100%

---

## TC-05: Deadline Miss

**Algorithm**: FCFS  
**Task**: T1, C=5, D=3, r₀=0

> C > D — the task cannot possibly meet its deadline!  
> (Validator should warn: C must not exceed D.)

If allowed:

| t | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Running | T1 | T1 | T1 | T1→MISS | T1 |

At t=3, deadline passes; T1 has 2 units remaining.
**Expected**: deadline missed = 1, met = 0, success rate = 0%

---

## TC-06: CPU Idle Period

**Algorithm**: FCFS  
**Tasks**:
- T1: C=2, r₀=3, D=10

| t | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Running | Idle | Idle | Idle | T1 | T1 | Idle |

**Expected**: CPU util = 2/10 × 100 = 20%  
**Events**: idle@0, idle@1, idle@2, release@3, start@3, complete@5

---

## TC-07: Simultaneous Releases & Priority Tie

**Algorithm**: Fixed-Priority Preemptive  
**Tasks**:
- T1: C=3, r₀=0, priority=1, id="T1"
- T2: C=3, r₀=0, priority=1, id="T2"  ← same priority!

Tie-break: earliest release (same), then taskId alphabetical → T1 wins.

| t | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Running | T1 | T1 | T1 | T2 | T2 | T2 |

> FP is preemptive but with equal priority and same release, no preemption occurs mid-execution.

---

## TC-08: Periodic Job Releases (RMS)

**Algorithm**: RMS  
**Tasks**:
- T1: C=1, T=4, D=4, r₀=0  → priority 1 (shorter period)
- T2: C=2, T=6, D=6, r₀=0  → priority 2

LCM(4,6) = 12 (simulate horizon=12)

Jobs released:
- T1: at t=0, 4, 8       (3 jobs)
- T2: at t=0, 6          (2 jobs)

Expected schedule (by hand):
| t | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|----|----|
| R | T1 | T2 | T2 | Idle | T1 | T2(resume?) | T2 | T2(new job starts) | T1 | Idle | Idle | Idle |

> Work out the full schedule on paper using RMS priority rules.

---

## TC-09: Simulation Ends with Unfinished Job

**Algorithm**: FCFS  
**Task**: T1, C=5, D=20, r₀=0, horizon=3

T1 is still running when horizon=3 is reached.  
Remaining: 2 units.

**Expected**:
- Jobs completed: 0
- Deadline missed: 0 (deadline=20 > horizon=3, so NOT evaluated)
- Incomplete jobs: 1 (reported separately in results)

---

## TC-10: Reset and Re-run

1. Run TC-01 fully.
2. Click Reset.
3. Verify: Gantt clears, metrics reset to "—", event log clears, clock shows t=0.
4. Re-run TC-03.
5. Verify: new results match TC-03 expected values.

---

## TC-11: RMS Utilisation Bound

**Tasks**: T1(C=1,T=4), T2(C=2,T=6), T3(C=2,T=12)

U = 1/4 + 2/6 + 2/12 = 0.25 + 0.333 + 0.167 = 0.75

RMS bound for n=3: 3 × (2^(1/3) − 1) ≈ 3 × 0.26 = 0.78

0.75 < 0.78 → **Schedulable under RMS** ✓

Run this set with algorithm=RMS, horizon=12 and verify no deadlines are missed.

---

## How to Run Tests

1. Open the simulator in the browser.
2. Manually enter the tasks for each test case.
3. Select the specified algorithm and horizon.
4. Run the simulation.
5. Compare the Gantt chart, metrics panel, and event log against the expected values above.
6. Record pass/fail and any discrepancies.
