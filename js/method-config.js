// ==============================
// METHOD / TEXTBOOK RULES
// ==============================
// Put method-specific scheduling conventions here.
// The algorithm files should use these helpers instead of hard-coding
// textbook-specific tie/queue decisions.

const METHOD_CONFIG = {
    FCFS: {
        tieRule: "input-order",
        type2TieRule: "ready-order",
        type2QueueRule: "ready-order"
    },

    SJF: {
        // Source rule: equal next CPU burst follows FCFS order.
        tieRule: "fcfs-order",
        type2TieRule: "ready-order",
        type2QueueRule: "ready-order"
    },

    SRTF: {
        // Source does not prescribe an equal-remaining tie-breaker.
        // Keep it configurable; default is input order.
        tieRule: "input-order",
        type2TieRule: "ready-order",
        type2QueueRule: "ready-order",
        // Type 2 reference behavior: give an available CPU1 phase
        // preference over a CPU2 phase when both are ready.
        type2SelectionRule: "cpu1-phase-first"
    },

    RR: {
        quantum: 2,
        arrivalRule: "input-order",
        // CPU selection follows a circular P1 -> P2 -> P3 -> P4 -> P1 scan.
        // Unavailable processes are skipped until the next available process
        // in the cycle is found.
        cycleRule: "process-id-cycle",
        type2QueueRule: "cycle-order",
        // Source does not specify the ordering when arrivals and
        // quantum expiry happen at the same instant.
        quantumEventOrder: "arrivals-before-requeue"
    }
};

function getMethodConfig(algorithm) {
    return METHOD_CONFIG[algorithm] || METHOD_CONFIG.FCFS;
}

function getInputOrderMap(list) {
    let map = {};
    list.forEach(function(item, index) {
        map[item.id] = index;
    });
    return map;
}

function compareProcessIds(a, b) {
    return a.id.localeCompare(b.id);
}

function compareByArrivalThenId(a, b) {
    if (a.arrival !== b.arrival) {
        return a.arrival - b.arrival;
    }
    return compareProcessIds(a, b);
}

function compareByArrivalThenInput(a, b, inputOrderMap) {
    if (a.arrival !== b.arrival) {
        return a.arrival - b.arrival;
    }
    return inputOrderMap[a.id] - inputOrderMap[b.id];
}

function compareByInputOrder(a, b, inputOrderMap) {
    return inputOrderMap[a.id] - inputOrderMap[b.id];
}

function compareReadyOrder(a, b) {
    return a.readySequence - b.readySequence;
}

function chooseShortest(list, valueKey, algorithm, readyOrderKey, inputOrderMap) {
    let config = getMethodConfig(algorithm);
    let selected = list[0];

    for (let i = 1; i < list.length; i++) {
        let candidate = list[i];
        let selectedValue = selected[valueKey];
        let candidateValue = candidate[valueKey];

        if (candidateValue < selectedValue) {
            selected = candidate;
            continue;
        }

        if (candidateValue !== selectedValue) {
            continue;
        }

        if (config.type2TieRule === "ready-order" && readyOrderKey &&
            candidate[readyOrderKey] !== undefined && selected[readyOrderKey] !== undefined) {
            if (candidate[readyOrderKey] < selected[readyOrderKey]) {
                selected = candidate;
            }
            continue;
        }

        let rule = config.tieRule;

        if (rule === "fcfs-order" || rule === "arrival-then-input") {
            if (inputOrderMap) {
                if (compareByArrivalThenInput(candidate, selected, inputOrderMap) < 0) {
                    selected = candidate;
                }
            } else if (candidate.arrival < selected.arrival) {
                selected = candidate;
            }
        } else if (rule === "input-order" && inputOrderMap) {
            if (compareByInputOrder(candidate, selected, inputOrderMap) < 0) {
                selected = candidate;
            }
        } else if (rule === "id") {
            if (compareProcessIds(candidate, selected) < 0) {
                selected = candidate;
            }
        }
    }

    return selected;
}
