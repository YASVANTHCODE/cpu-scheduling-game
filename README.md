## v29 — Game Mode, Question Editing, Retry Flow, and Study-Tool Refinement

### Game Mode / scoring
- Game Mode toggle is shown beside Practice Mode.
- Gantt Chart carries 50 points.
- Completion Time, Turnaround Time, Waiting Time, Response Time, and Averages carry 10 points each.
- Correctly entered/check-passed values earn their share of the level score.
- Skip & Show never awards points for that skipped value.
- Individual skips preserve points already earned for other values in the same level.
- Solving Kit shows a transparent green score card while Game Mode is enabled.
- Results show the final score as a 0–100 progress bar plus the per-level breakdown.

### Question editing
- Edit is moved to the top-right of the Processes panel and uses a pencil icon.
- Edit mode exposes Arrival and CPU values for direct editing.
- OK commits the edited question and recalculates the selected algorithm's Gantt chart.
- Cancel restores the exact question state that existed before editing.
- Saved edits remain associated with the selected question during the session, so later Cancel actions do not revert an already-committed edit to the original default.

### Navigation / retry
- Results → Try Again restarts Gantt solving for the same current question.
- Results → Home returns to the Start Practice home screen.

### Study tools
- Question and Solving Kit circles remain slightly transparent with a glass-like background instead of becoming fully solid.
- Pinned popup close buttons use centered flex alignment so the X is visually centered.

All previous Round Robin, Gantt, YouTube, performance-level, and study-tool features are preserved.

## Round Robin quantum visualizer

Round Robin now uses a process-and-quantum layout:

- Left side: P1, P2, P3, P4 process buttons.
- Right side: per-process execution quantum blocks.
- CPU1 quanta are blue.
- CPU2 quanta are mild green.
- Type 2 I/O units are gray, numbered in small white circles, and are non-clickable.
- Consumed CPU quanta disappear from the active view so the remaining quanta shift left.
- I/O units disappear as the CPU timeline advances through their duration.
- CPU2 remains locked until the process's I/O has completed.
- The process button selects the corresponding current Round Robin execution quantum.
- Type 2 Round Robin quantum blocks are kept separate in the schedule so individual quanta remain visible.

All other v24 features are preserved.


## Round Robin quantum control
- Default quantum is 2 CPU units.
- The quantum can be changed from the Round Robin control above the CPU Timeline.
- Changing it recalculates the Round Robin schedule from the beginning.
- Quantum chips display the actual duration of each execution block (for example 2 then 1 when a CPU burst of 3 is split by quantum 2).
- CPU1 uses blue, CPU2 uses green, and I/O units remain gray/non-clickable for Type 2.

## v27 Round Robin refinement
- Round Robin now follows a circular process-ID scan: P1 -> P2 -> P3 -> P4 -> P1, skipping processes that are not currently available.
- Type 2 RR therefore gives a newly available process the next turn when it is the next process in the cycle.
- RR legend identifies CPU 1, I/O, and CPU 2 colors.
- Type 2 I/O visualization is split into quantum-sized chunks using the current RR quantum (for example 5 with quantum 2 becomes 2, 2, 1).
- CPU quantum labels remain the actual duration values; no Q prefix is used.


## v31 Edit + Replay Refinement
- Replay now replays algorithm-button visual state as well as the Gantt history.
- Replay is read-only and has a Live toggle to return to the current solving state.
- Edit Question uses a persistent message area above the process table.
- Existing valid integer values are accepted without a false validation warning.
- Saved edits are recalculated; if a schedule cannot be prepared, the edited question is retained and the user is asked to try different values.
