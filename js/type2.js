// ==============================
// TYPE 2 SCHEDULING ENGINE
// CPU Burst 1 -> I/O -> CPU Burst 2
// ==============================

function createType2Runtime() {
    return processes.map(function(process, index) {
        return {
            id: process.id,
            arrival: process.arrival,
            burst1: process.burst1,
            io: process.io,
            burst2: process.burst2,
            phase: "NOT_ARRIVED",
            remaining: process.burst1,
            readyOrder: index
        };
    });
}

function type2CurrentBurst(process) {
    return process.remaining;
}

function type2AddEvents(runtime, currentTime, readyQueue, sequence) {
    let events = [];

    runtime.forEach(function(process) {
        if (process.phase === "NOT_ARRIVED" && process.arrival <= currentTime) {
            events.push({ process: process, order: 0 });
        }
        if (process.phase === "IO" && process.ioEnd <= currentTime) {
            events.push({ process: process, order: 1 });
        }
    });

    let eventOrder = getSnapshotEventOrder(currentAlgorithm);

    events.sort(function(a, b) {
        if (eventOrder === "ready-order") {
            return a.process.readyOrder - b.process.readyOrder;
        }

        if (eventOrder === "id") {
            return a.process.id.localeCompare(b.process.id);
        }

        if (a.order !== b.order) {
            return a.order - b.order;
        }

        if (eventOrder === "id-then-arrival") {
            let idCompare = a.process.id.localeCompare(b.process.id);
            if (idCompare !== 0) return idCompare;
        } else if (a.process.arrival !== b.process.arrival) {
            return a.process.arrival - b.process.arrival;
        }

        return a.process.id.localeCompare(b.process.id);
    });

    events.forEach(function(event) {
        let process = event.process;

        if (process.phase === "NOT_ARRIVED") {
            process.phase = "READY";
            process.remaining = process.burst1;
            process.readySequence = sequence.value++;
            readyQueue.push(process);
        } else if (process.phase === "IO") {
            process.phase = "READY";
            process.remaining = process.burst2;
            process.readySequence = sequence.value++;
            readyQueue.push(process);
        }
    });
}

function type2SelectReady(readyQueue, mode) {
    if (readyQueue.length === 0) {
        return null;
    }

    let config = getMethodConfig(mode);

    if (mode === "FCFS" || mode === "RR") {
        let queueRule = config.type2QueueRule || "ready-order";

        if (queueRule === "lower-process-id") {
            readyQueue.sort(function(a, b) {
                return a.id.localeCompare(b.id);
            });
        } else if (queueRule === "arrival-then-id") {
            readyQueue.sort(compareByArrivalThenId);
        }

        return readyQueue.shift();
    }

    // Type 2 SRTF convention used by this question set:
    // if any process is still in its first CPU phase, CPU1 gets
    // preference over processes that have already reached CPU2.
    // The shortest remaining time is compared within that phase.
    if (mode === "SRTF" && config.type2SelectionRule === "cpu1-phase-first") {
        let cpu1Ready = readyQueue.filter(function(process) {
            return !process.usedBurst2;
        });

        if (cpu1Ready.length > 0) {
            let selectedCpu1 = chooseShortest(cpu1Ready, "remaining", mode, "readySequence");
            let selectedCpu1Index = readyQueue.indexOf(selectedCpu1);
            return readyQueue.splice(selectedCpu1Index, 1)[0];
        }
    }

    let selected = chooseShortest(readyQueue, "remaining", mode, "readySequence");
    let selectedIndex = readyQueue.indexOf(selected);
    return readyQueue.splice(selectedIndex, 1)[0];
}

function type2PushBlock(schedule, id, start, end, mergeAdjacent = true) {
    if (end <= start) return;

    let last = schedule[schedule.length - 1];
    if (mergeAdjacent && last && last.id === id && last.end === start) {
        last.end = end;
    } else {
        schedule.push({ id: id, start: start, end: end });
    }
}

function type2SelectRoundRobinCyclic(readyQueue, runtime, cursor) {
    if (readyQueue.length === 0) {
        return { process: null, cursor: cursor };
    }

    let processOrder = runtime.map(function(process) {
        return process.id;
    });

    let queueById = {};
    readyQueue.forEach(function(process) {
        queueById[process.id] = process;
    });

    for (let offset = 0; offset < processOrder.length; offset++) {
        let index = (cursor + offset) % processOrder.length;
        let id = processOrder[index];

        if (queueById[id]) {
            let selected = queueById[id];
            let selectedIndex = readyQueue.indexOf(selected);
            readyQueue.splice(selectedIndex, 1);
            return {
                process: selected,
                cursor: (index + 1) % processOrder.length
            };
        }
    }

    return { process: readyQueue.shift(), cursor: cursor };
}

function simulateType2Queue(mode) {
    let runtime = createType2Runtime();
    let readyQueue = [];
    let schedule = [];
    let sequence = { value: 0 };
    let currentTime = 0;
    let completed = 0;
    let quantum = getMethodConfig("RR").quantum;
    let rrCursor = 0;

    while (completed < runtime.length) {
        type2AddEvents(runtime, currentTime, readyQueue, sequence);

        if (mode === "SRTF") {
            let running = null;

            // Choose the shortest remaining CPU burst at every time unit.
            if (readyQueue.length > 0) {
                running = type2SelectReady(readyQueue, "SRTF");
            }

            if (!running) {
                let next = findNextType2Event(runtime, currentTime);
                if (next === null) break;
                if (currentTime < next) type2PushBlock(schedule, "IDLE", currentTime, next);
                currentTime = next;
                continue;
            }

            running.phase = "RUNNING";
            type2PushBlock(schedule, running.id, currentTime, currentTime + 1);
            running.remaining--;
            currentTime++;

            if (running.remaining === 0) {
                if (running.phase === "RUNNING" && running.burst1 > 0 && running.burst2 > 0 && running.remaining === 0 && !running.usedBurst2) {
                    running.usedBurst2 = true;
                    running.phase = "IO";
                    running.ioEnd = currentTime + running.io;
                } else {
                    running.phase = "DONE";
                    completed++;
                }
            } else {
                running.phase = "READY";
                running.readySequence = sequence.value++;
                readyQueue.push(running);
            }

            continue;
        }

        if (readyQueue.length === 0) {
            let next = findNextType2Event(runtime, currentTime);
            if (next === null) break;
            if (currentTime < next) type2PushBlock(schedule, "IDLE", currentTime, next);
            currentTime = next;
            continue;
        }

        let running;

        if (mode === "RR") {
            let rrSelection = type2SelectRoundRobinCyclic(readyQueue, runtime, rrCursor);
            running = rrSelection.process;
            rrCursor = rrSelection.cursor;
        } else {
            running = type2SelectReady(readyQueue, mode);
        }

        running.phase = "RUNNING";

        let executionTime = running.remaining;
        if (mode === "RR") executionTime = Math.min(quantum, running.remaining);

        type2PushBlock(schedule, running.id, currentTime, currentTime + executionTime, mode !== "RR");
        running.remaining -= executionTime;
        currentTime += executionTime;

        // Add events that happened while the CPU was executing before re-queueing.
        type2AddEvents(runtime, currentTime, readyQueue, sequence);

        if (running.remaining > 0) {
            running.phase = "READY";
            running.readySequence = sequence.value++;
            readyQueue.push(running);
        } else if (!running.usedBurst2) {
            running.usedBurst2 = true;
            running.phase = "IO";
            running.ioEnd = currentTime + running.io;
        } else {
            running.phase = "DONE";
            completed++;
        }
    }

    return schedule;
}

function findNextType2Event(runtime, currentTime) {
    let next = null;

    runtime.forEach(function(process) {
        if (process.phase === "NOT_ARRIVED" && process.arrival >= currentTime) {
            next = next === null ? process.arrival : Math.min(next, process.arrival);
        }
        if (process.phase === "IO" && process.ioEnd >= currentTime) {
            next = next === null ? process.ioEnd : Math.min(next, process.ioEnd);
        }
    });

    return next;
}
