// ==============================
// ROUND ROBIN
// ==============================

function calculateRR() {

    if (selectedQuestionType === "type2") {
        return simulateType2Queue("RR");
    }

    let currentTime = 0;
    let schedule = [];
    let config = getMethodConfig("RR");
    let quantum = config.quantum;

    let inputOrderMap = getInputOrderMap(processes);
    let remaining = processes.map(function(process) {
        return {
            id: process.id,
            arrival: process.arrival,
            remaining: process.burst
        };
    });

    let queue = [];
    let completed = 0;
    let rrCursor = 0;

    function addArrivals(time) {
        let candidates = remaining.filter(function(process) {
            return process.arrival <= time && process.remaining > 0 &&
                !queue.includes(process.id);
        });

        candidates.sort(function(a, b) {
            if (config.arrivalRule === "arrival-then-id") {
                return compareByArrivalThenId(a, b);
            }
            return compareByArrivalThenInput(a, b, inputOrderMap);
        });

        candidates.forEach(function(process) {
            queue.push(process.id);
        });
    }

    while (completed < processes.length) {
        addArrivals(currentTime);

        if (queue.length === 0) {
            let future = remaining.filter(function(process) {
                return process.remaining > 0 && process.arrival > currentTime;
            });

            if (future.length === 0) break;

            let nextArrival = Math.min.apply(null, future.map(function(process) {
                return process.arrival;
            }));

            if (currentTime < nextArrival) {
                schedule.push({ id: "IDLE", start: currentTime, end: nextArrival });
            }

            currentTime = nextArrival;
            continue;
        }

        let currentIndex = -1;
        let currentId = null;

        for (let offset = 0; offset < processes.length; offset++) {
            let index = (rrCursor + offset) % processes.length;
            let candidateId = processes[index].id;
            let candidate = remaining.find(function(process) {
                return process.id === candidateId;
            });

            if (candidate && candidate.remaining > 0 && queue.includes(candidateId)) {
                currentIndex = index;
                currentId = candidateId;
                break;
            }
        }

        if (currentId === null) {
            currentId = queue[0];
            currentIndex = processes.findIndex(function(process) {
                return process.id === currentId;
            });
        }

        queue.splice(queue.indexOf(currentId), 1);
        rrCursor = (currentIndex + 1) % processes.length;

        let currentProcess = remaining.find(function(process) {
            return process.id === currentId;
        });

        let executionTime = Math.min(quantum, currentProcess.remaining);

        schedule.push({
            id: currentProcess.id,
            start: currentTime,
            end: currentTime + executionTime
        });

        currentProcess.remaining -= executionTime;
        currentTime += executionTime;

        // The source does not prescribe simultaneous-event priority.
        // This is therefore a configurable convention.
        if (config.quantumEventOrder === "requeue-before-arrivals" && currentProcess.remaining > 0) {
            queue.push(currentProcess.id);
        }

        addArrivals(currentTime);

        if (currentProcess.remaining > 0) {
            if (config.quantumEventOrder !== "requeue-before-arrivals") {
                queue.push(currentProcess.id);
            }
        } else {
            completed++;
        }
    }

    return schedule;
}
