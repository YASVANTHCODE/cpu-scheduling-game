// ==============================
// ALGORITHM-SPECIFIC BUTTONS
// ==============================

function clearProcessButtons() {
    let oldContainer = document.getElementById("process-buttons");
    if (oldContainer) {
        oldContainer.remove();
    }
}

function createProcessButtons() {

    clearProcessButtons();

    let actionArea = document.getElementById("action-area");
    let container = document.createElement("div");
    container.id = "process-buttons";

    let title = document.createElement("h3");
    title.textContent = getButtonTitle();
    container.appendChild(title);

    if (currentAlgorithm === "RR") {
        createRoundRobinButtons(container);
    } else if (currentAlgorithm === "SRTF") {
        createSRTFButtons(container);
    } else {
        createSimpleProcessButtons(container);
    }

    actionArea.prepend(container);

    refreshAlgorithmButtonStates();
}

function getButtonTitle() {
    if (currentAlgorithm === "RR") {
        return "Select the next execution block:";
    }

    if (currentAlgorithm === "SRTF") {
        return "Select the process with the shortest remaining time:";
    }

    return "Select the next process:";
}

// ==============================
// FCFS / SJF
// ==============================

function createSimpleProcessButtons(container) {

    getSnapshotProcessOrder(currentAlgorithm, processes).forEach(function(process) {
        let button = document.createElement("button");
        button.className = "process-button process-button-large";
        button.dataset.process = process.id;

        let name = document.createElement("span");
        name.className = "button-process-name";
        name.textContent = process.id;

        let detail = document.createElement("small");
        detail.textContent = getProcessBurstText(process);

        button.appendChild(name);
        button.appendChild(detail);

        button.addEventListener("click", function() {
            checkProcessAnswer(process.id);
        });

        container.appendChild(button);
    });
}

// ==============================
// SRTF BUTTONS
// ==============================

function createSRTFButtons(container) {

    getSnapshotProcessOrder(currentAlgorithm, processes).forEach(function(process) {
        let button = document.createElement("button");
        button.className = "process-button process-button-large srtf-button";
        button.dataset.process = process.id;

        let name = document.createElement("span");
        name.className = "button-process-name";
        name.textContent = process.id;

        let remaining = document.createElement("strong");
        remaining.className = "button-remaining-time";
        remaining.textContent = getRemainingCpu(process.id);

        let bar = document.createElement("div");
        bar.className = "srtf-time-bar";
        bar.dataset.process = process.id;

        createSRTFTimeSegments(bar, process);

        let detail = document.createElement("small");
        detail.className = "srtf-status";

        button.appendChild(name);
        button.appendChild(remaining);
        button.appendChild(bar);

        let barLabel = document.createElement("small");
        barLabel.className = "srtf-bar-label";
        barLabel.textContent = "CPU units";
        button.appendChild(barLabel);

        button.appendChild(detail);

        button.addEventListener("click", function() {
            checkProcessAnswer(process.id);
        });

        container.appendChild(button);
    });
}

function createSRTFTimeSegments(container, process) {
    if (selectedQuestionType === "type2") {
        let phaseOrder = getSnapshotPhaseOrder(currentAlgorithm);

        phaseOrder.forEach(function(phase) {
            if (phase === "CPU1") {
                addSRTFPhaseLabel(container, "CPU1");
                for (let i = 0; i < process.burst1; i++) {
                    let segment = document.createElement("span");
                    segment.className = "srtf-time-segment segment-cpu1";
                    container.appendChild(segment);
                }
            }

            if (phase === "IO") {
                addSRTFPhaseLabel(container, "I/O", true);
                for (let i = 0; i < process.io; i++) {
                    let segment = document.createElement("span");
                    segment.className = "srtf-time-segment segment-io";
                    container.appendChild(segment);
                }
            }

            if (phase === "CPU2") {
                addSRTFPhaseLabel(container, "CPU2", false);
                for (let i = 0; i < process.burst2; i++) {
                    let segment = document.createElement("span");
                    segment.className = "srtf-time-segment segment-cpu2";
                    container.appendChild(segment);
                }
            }
        });
        return;
    }

    for (let i = 0; i < process.burst; i++) {
        let segment = document.createElement("span");
        segment.className = "srtf-time-segment segment-cpu";
        container.appendChild(segment);
    }
}

function addSRTFPhaseLabel(container, text, isIO) {
    let label = document.createElement("small");
    label.className = "srtf-phase-label" + (isIO ? " io-label" : "");
    label.textContent = text;
    container.appendChild(label);
}

function refreshSRTFTimeBars() {
    document.querySelectorAll(".srtf-time-bar").forEach(function(bar) {
        let processId = bar.dataset.process;
        let process = processes.find(function(item) {
            return item.id === processId;
        });

        if (!process) return;

        let executed = getExecutedCpuBeforeCurrent(processId);
        let segments = bar.querySelectorAll(".srtf-time-segment");

        if (selectedQuestionType !== "type2") {
            segments.forEach(function(segment, index) {
                // Type 1 SRTF: all CPU blocks start blue.
                // Completed CPU blocks turn gray from left to right.
                let completed = index < executed;
                segment.classList.toggle("segment-used", completed);
                segment.classList.toggle("segment-remaining", !completed);
            });
            return;
        }

        let cpu1Used = Math.min(executed, process.burst1);
        let cpu2Used = Math.min(Math.max(executed - process.burst1, 0), process.burst2);
        let cpu1Index = 0;
        let cpu2Index = 0;

        segments.forEach(function(segment) {
            if (segment.classList.contains("segment-cpu1")) {
                let used = cpu1Index < cpu1Used;
                segment.classList.toggle("segment-used", used);
                segment.classList.toggle("segment-remaining", !used);
                cpu1Index++;
            } else if (segment.classList.contains("segment-cpu2")) {
                let used = cpu2Index < cpu2Used;
                segment.classList.toggle("segment-used", used);
                segment.classList.toggle("segment-remaining", !used);
                cpu2Index++;
            } else if (segment.classList.contains("segment-io")) {
                segment.classList.remove("segment-used", "segment-remaining");
            }
        });
    });
}

function createRRQueue(container) {
    let queueTitle = document.createElement("div");
    queueTitle.className = "rr-queue-title";
    queueTitle.textContent = "Round Robin execution queue";
    container.appendChild(queueTitle);

    let queue = document.createElement("div");
    queue.className = "rr-queue";

    let queueBlocks = [...currentSchedule];
    let queueConfig = getSnapshotConfig("RR");

    if (queueConfig.snapshotOrder === "execution" && queueConfig.queueDirection === "reverse") {
        queueBlocks.reverse();
    }

    queueBlocks.forEach(function(block, index) {
        if (index > 0) {
            let arrow = document.createElement("span");
            arrow.className = "rr-queue-arrow";
            arrow.textContent = "→";
            queue.appendChild(arrow);
        }

        let item = document.createElement("span");
        item.className = "rr-queue-item";
        let originalIndex = currentSchedule.indexOf(block);
        item.dataset.index = originalIndex;
        item.textContent = `${index + 1}. ${block.id}`;
        queue.appendChild(item);
    });

    container.appendChild(queue);

    let legend = document.createElement("div");
    legend.className = "rr-queue-legend";
    legend.innerHTML =
        '<span><b>Completed</b> = already executed</span>' +
        '<span><b>Available</b> = still in the circular order</span>';
    container.appendChild(legend);
}

function refreshRRQueue() {
    document.querySelectorAll(".rr-queue-item").forEach(function(item) {
        let index = Number(item.dataset.index);
        item.classList.remove("queue-current", "queue-completed", "queue-waiting");

        if (index < currentBlock) {
            item.classList.add("queue-completed");
        } else {
            item.classList.add("queue-waiting");
        }
    });
}


function getCurrentTime() {
    if (!currentSchedule.length) return 0;

    if (currentBlock >= currentSchedule.length) {
        return currentSchedule[currentSchedule.length - 1].end;
    }

    return currentSchedule[currentBlock].start;
}

function getExecutedCpuBeforeCurrent(processId) {
    let executed = 0;

    for (let i = 0; i < currentBlock; i++) {
        if (currentSchedule[i].id === processId) {
            executed += currentSchedule[i].end - currentSchedule[i].start;
        }
    }

    return executed;
}

function getRemainingCpu(processId) {
    let process = processes.find(function(item) {
        return item.id === processId;
    });

    if (!process) return 0;

    let total = selectedQuestionType === "type2"
        ? process.burst1 + process.burst2
        : process.burst;

    return Math.max(0, total - getExecutedCpuBeforeCurrent(processId));
}

function getSRTFStatus(processId) {
    let process = processes.find(function(item) {
        return item.id === processId;
    });

    if (!process) return "Unavailable";

    let now = getCurrentTime();
    let remaining = getRemainingCpu(processId);

    if (remaining <= 0) {
        return "Finished";
    }

    if (now < process.arrival) {
        return "Not arrived";
    }

    if (selectedQuestionType === "type2") {
        let executed = getExecutedCpuBeforeCurrent(processId);
        let ioStart = null;

        if (executed >= process.burst1) {
            let cpuBeforeBurst2 = process.burst1;
            let cumulative = 0;

            for (let i = 0; i < currentBlock; i++) {
                if (currentSchedule[i].id === processId) {
                    let duration = currentSchedule[i].end - currentSchedule[i].start;
                    cumulative += duration;

                    if (ioStart === null && cumulative >= cpuBeforeBurst2) {
                        let extra = cumulative - cpuBeforeBurst2;
                        ioStart = currentSchedule[i].end - extra;
                    }
                }
            }

            if (ioStart !== null && now < ioStart + process.io) {
                return "I/O";
            }
        }
    }

    return "Ready";
}

function refreshSRTFButtonValues() {
    if (currentAlgorithm !== "SRTF") return;

    let buttons = document.querySelectorAll(".srtf-button");

    buttons.forEach(function(button) {
        let processId = button.dataset.process;
        let remaining = button.querySelector(".button-remaining-time");
        let status = button.querySelector(".srtf-status");
        let state = getSRTFStatus(processId);

        if (remaining) {
            remaining.textContent = getRemainingCpu(processId);
        }

        if (status) {
            status.textContent = state;
        }

        button.classList.remove(
            "state-ready",
            "state-io",
            "state-finished",
            "state-not-arrived"
        );

        button.classList.add(
            "state-" + state.toLowerCase().replace(" ", "-")
        );

        button.disabled = state !== "Ready";
    });

    refreshSRTFTimeBars();
}

// ==============================
// ROUND ROBIN BUTTONS
// ==============================

function createRoundRobinButtons(container) {

    let panel = document.createElement("div");
    panel.className = "rr-process-panel";

    let left = document.createElement("div");
    left.className = "rr-process-list";

    let right = document.createElement("div");
    right.className = "rr-quantum-area";

    let leftTitle = document.createElement("div");
    leftTitle.className = "rr-panel-title";
    leftTitle.textContent = "Processes";
    left.appendChild(leftTitle);

    let rightTitle = document.createElement("div");
    rightTitle.className = "rr-panel-title";
    rightTitle.textContent = "Execution Quanta";
    right.appendChild(rightTitle);

    processes.forEach(function(process) {
        let processButton = document.createElement("button");
        processButton.type = "button";
        processButton.className = "process-button rr-process-button";
        processButton.dataset.process = process.id;

        let name = document.createElement("span");
        name.className = "button-process-name";
        name.textContent = process.id;

        processButton.appendChild(name);
        processButton.addEventListener("click", function() {
            checkProcessAnswer(process.id);
        });

        left.appendChild(processButton);

        let row = document.createElement("div");
        row.className = "rr-quantum-row";
        row.dataset.process = process.id;

        let rowName = document.createElement("span");
        rowName.className = "rr-row-process";
        rowName.textContent = process.id;
        row.appendChild(rowName);

        let units = getRRVisualUnits(process);
        units.forEach(function(unit) {
            let chip = document.createElement("button");
            chip.type = "button";
            chip.className = "rr-quantum-chip rr-phase-" + unit.phase.toLowerCase();
            chip.dataset.process = process.id;
            chip.dataset.phase = unit.phase;
            chip.dataset.unit = unit.unitIndex;
            chip.disabled = unit.phase === "IO";
            chip.title = unit.phase === "IO"
                ? "I/O — unavailable while the process is performing I/O"
                : unit.phase + " — " + unit.duration + " CPU unit" + (unit.duration === 1 ? "" : "s");
            chip.setAttribute("aria-label", chip.title);

            let circle = document.createElement("span");
            circle.className = "rr-quantum-number";
            circle.textContent = unit.duration;

            chip.appendChild(circle);
            row.appendChild(chip);
        });

        right.appendChild(row);
    });

    let legend = document.createElement("div");
    legend.className = "rr-phase-legend";
    legend.innerHTML =
        '<span><i class="rr-legend-swatch rr-legend-cpu1"></i>CPU 1</span>' +
        '<span><i class="rr-legend-swatch rr-legend-io"></i>I/O</span>' +
        '<span><i class="rr-legend-swatch rr-legend-cpu2"></i>CPU 2</span>';

    panel.appendChild(left);
    panel.appendChild(right);
    container.appendChild(legend);
    container.appendChild(panel);

    refreshRRVisuals();
}

function getRRVisualUnits(process) {
    let units = [];

    let processBlocks = currentSchedule.filter(function(block) {
        return block.id === process.id;
    });

    if (selectedQuestionType !== "type2") {
        processBlocks.forEach(function(block) {
            let duration = block.end - block.start;
            units.push({
                phase: "CPU",
                duration: duration,
                scheduleIndex: currentSchedule.indexOf(block),
                unitIndex: units.length
            });
        });
        return units;
    }

    let cpu1Consumed = 0;
    let cpu1End = null;

    processBlocks.forEach(function(block) {
        let duration = block.end - block.start;

        if (cpu1Consumed < process.burst1) {
            units.push({
                phase: "CPU1",
                duration: duration,
                scheduleIndex: currentSchedule.indexOf(block),
                unitIndex: units.length
            });
            cpu1Consumed += duration;

            if (cpu1Consumed >= process.burst1 && cpu1End === null) {
                cpu1End = block.end;
            }
        } else {
            units.push({
                phase: "CPU2",
                duration: duration,
                scheduleIndex: currentSchedule.indexOf(block),
                unitIndex: units.length
            });
        }
    });

    // Split I/O into the same quantum-sized visual chunks as CPU execution.
    // These chunks are deliberately non-clickable because I/O is not a CPU choice.
    if (process.io > 0 && cpu1End !== null) {
        let ioUnits = [];
        let ioRemaining = process.io;
        let ioElapsed = 0;
        let quantum = getMethodConfig("RR").quantum;

        while (ioRemaining > 0) {
            let duration = Math.min(quantum, ioRemaining);
            ioUnits.push({
                phase: "IO",
                duration: duration,
                number: ioUnits.length + 1,
                ioStart: cpu1End + ioElapsed,
                ioEnd: cpu1End + ioElapsed + duration,
                unitIndex: units.length + ioUnits.length
            });
            ioElapsed += duration;
            ioRemaining -= duration;
        }

        let splitIndex = units.findIndex(function(unit) {
            return unit.phase === "CPU2";
        });

        if (splitIndex === -1) {
            units = units.concat(ioUnits);
        } else {
            let cpu1Units = units.slice(0, splitIndex);
            let cpu2Units = units.slice(splitIndex);
            units = cpu1Units.concat(ioUnits, cpu2Units);
        }
    }

    units.forEach(function(unit, index) {
        unit.unitIndex = index;
    });

    return units;
}

function processBlocksCpu1End(process) {
    let total = 0;
    let blocks = currentSchedule.filter(function(block) {
        return block.id === process.id;
    });

    for (let block of blocks) {
        total += block.end - block.start;
        if (total >= process.burst1) {
            return block.end;
        }
    }

    return null;
}

function refreshRRVisuals() {
    if (currentAlgorithm !== "RR") return;

    let now = getCurrentTime();

    document.querySelectorAll(".rr-process-button").forEach(function(button) {
        let processId = button.dataset.process;
        let nextIndex = currentSchedule.findIndex(function(block, index) {
            return index >= currentBlock && block.id === processId;
        });

        button.classList.remove("rr-process-completed", "rr-process-ready", "rr-process-current");

        if (nextIndex === -1) {
            button.disabled = true;
            button.classList.add("rr-process-completed");
        } else if (currentSchedule[nextIndex].id === processId) {
            button.disabled = false;
            if (nextIndex === currentBlock) {
                button.classList.add("rr-process-current");
            } else {
                button.classList.add("rr-process-ready");
            }
        } else {
            button.disabled = false;
        }
    });

    document.querySelectorAll(".rr-quantum-row").forEach(function(row) {
        let processId = row.dataset.process;
        let process = processes.find(function(item) {
            return item.id === processId;
        });
        if (!process) return;

        let units = getRRVisualUnits(process);
        let chips = row.querySelectorAll(".rr-quantum-chip");

        chips.forEach(function(chip, index) {
            let unit = units[index];
            if (!unit) return;

            chip.classList.remove("rr-unit-current", "rr-unit-completed", "rr-unit-hidden", "rr-unit-available", "rr-io-active");

            if (unit.phase === "IO") {
                let ioEnd = unit.ioEnd;
                let ioStart = unit.ioStart;
                chip.disabled = true;

                if (now >= ioEnd) {
                    chip.classList.add("rr-unit-hidden");
                } else {
                    chip.classList.add("rr-unit-available");
                    if (now >= ioStart) {
                        chip.classList.add("rr-io-active");
                    }
                }
                return;
            }

            let scheduleIndex = unit.scheduleIndex;

            if (scheduleIndex < currentBlock) {
                chip.classList.add("rr-unit-completed", "rr-unit-hidden");
                chip.disabled = true;
                return;
            }

            if (selectedQuestionType === "type2" && unit.phase === "CPU2") {
                let cpu2Start = processBlocksCpu1End(process) + process.io;
                if (now < cpu2Start) {
                    chip.disabled = true;
                    chip.classList.add("rr-unit-available");
                    return;
                }
            }

            chip.disabled = false;

            if (scheduleIndex === currentBlock) {
                chip.classList.add("rr-unit-current");
            } else {
                chip.classList.add("rr-unit-available");
            }
        });
    });
}

function updateRoundRobinButtonStates() {
    refreshRRVisuals();
}


// ==============================
// GENERAL BUTTON STATE REFRESH
// ==============================

function refreshSimpleButtonStatesForReplay() {
    let buttons = document.querySelectorAll("#process-buttons .process-button-large");
    let now = getCurrentTime();

    buttons.forEach(function(button) {
        let processId = button.dataset.process;
        let process = processes.find(function(item) { return item.id === processId; });
        if (!process) return;

        let executed = getExecutedCpuBeforeCurrent(processId);
        let total = selectedQuestionType === "type2"
            ? process.burst1 + process.burst2
            : process.burst;

        let state = "ready";

        if (executed >= total) {
            state = "finished";
        } else if (now < process.arrival) {
            state = "not-arrived";
        } else if (selectedQuestionType === "type2") {
            let status = getSRTFStatus(processId);
            if (status === "I/O") state = "io";
        }

        button.classList.remove("state-ready", "state-io", "state-finished", "state-not-arrived");
        button.classList.add("state-" + state);
    });
}

function refreshAlgorithmButtonStatesForReplay(replayBoundary) {
    if (!currentSchedule.length) return;

    let boundary = Math.max(0, Math.min(replayBoundary, currentSchedule.length));
    let liveBlock = currentBlock;

    // Replay is a read-only history view. Temporarily present the selected
    // historical boundary to the existing state calculators, then restore the
    // real solving position immediately.
    currentBlock = boundary;

    if (currentAlgorithm === "SRTF") {
        refreshSRTFButtonValues();
    } else if (currentAlgorithm === "RR") {
        updateRoundRobinButtonStates();
    } else {
        refreshSimpleButtonStatesForReplay();
    }

    currentBlock = liveBlock;
}

function refreshAlgorithmButtonStates() {

    if (currentAlgorithm === "SRTF") {
        refreshSRTFButtonValues();
    }

    if (currentAlgorithm === "RR") {
        updateRoundRobinButtonStates();
    }
}

// ==============================
// DISPLAY HELPERS
// ==============================

function getProcessBurstText(process) {
    if (selectedQuestionType === "type2") {
        return `CPU ${process.burst1} → I/O ${process.io} → CPU ${process.burst2}`;
    }

    return `CPU Burst ${process.burst}`;
}

// ==============================
// CHECK PROCESS ANSWER
// ==============================

function checkProcessAnswer(selectedProcess, selectedBlockIndex = null) {

    // Replay is a read-only history view. Never let a replay click change
    // the real solved progress.
    if (typeof isGanttReplayViewing === "function" && isGanttReplayViewing()) {
        return;
    }

    if (currentBlock >= currentSchedule.length) {
        return;
    }

    let correctProcess = currentSchedule[currentBlock].id;

    let feedback = document.getElementById("feedback");

    if (!feedback) {
        feedback = document.createElement("p");
        feedback.id = "feedback";
        document.getElementById("action-area").appendChild(feedback);
    }

    if (correctProcess === "IDLE") {
        advanceCurrentBlock();
        return;
    }

    if (selectedProcess === correctProcess) {

        let timeline = document.getElementById("timeline");
        let blocks = timeline.querySelectorAll(".gantt-block");
        let block = blocks[currentBlock];

        block.querySelector(".gantt-process").textContent = selectedProcess;
        block.querySelector(".gantt-process").style.color = "#2563eb";
        block.querySelector(".gantt-end-time").textContent = currentSchedule[currentBlock].end;

        feedback.textContent = "✅ Correct!";
        feedback.style.color = "#16a34a";

        if (currentAlgorithm === "RR" && selectedBlockIndex !== null && selectedBlockIndex !== currentBlock) {
            feedback.textContent = "✅ Correct process, but select the current execution quantum.";
            feedback.style.color = "#d97706";
            return;
        }

        advanceCurrentBlock();

    } else {
        feedback.textContent = "❌ Try again!";
        feedback.style.color = "#dc2626";
    }
}

function advanceCurrentBlock() {

    let timeline = document.getElementById("timeline");
    let blocks = timeline.querySelectorAll(".gantt-block");
    let completedIndex = currentBlock;

    if (blocks[completedIndex]) {
        blocks[completedIndex].classList.remove("active-block");
        blocks[completedIndex].classList.add("completed-block");
    }

    currentBlock++;
    ganttReplayActive = false;
    ganttReplayIndex = currentBlock > 0 ? currentBlock - 1 : -1;

    if (currentAlgorithm === "SRTF") {
        refreshSRTFButtonValues();
    }

    if (currentBlock < currentSchedule.length) {
        if (blocks[currentBlock]) {
            blocks[currentBlock].classList.add("active-block");
        }

        refreshAlgorithmButtonStates();
        updateGanttReplayControls();
        return;
    }

    updateGanttReplayControls();

    // Refresh one final time so the last executed RR quantum is removed
    // from the quantum visualizer before the completion state is shown.
    if (currentAlgorithm === "RR") {
        refreshRRVisuals();
    }

    let processButtons = document.querySelectorAll(".process-button");
    processButtons.forEach(function(button) {
        button.disabled = true;
        button.classList.add("used-button");
    });

    let feedback = document.getElementById("feedback");
    if (feedback) {
        feedback.textContent = "🎉 Correct! You completed the Gantt chart.";
        feedback.style.color = "#16a34a";
    }

    showGanttCompletionOptions();
}
