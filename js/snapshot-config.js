// ==============================
// SNAPSHOT / VISUALIZATION RULES
// ==============================
// Keep method-specific snapshot choices here.
// Change this file when a textbook uses a different snapshot order,
// display preference, tie preference, or phase presentation.

const SNAPSHOT_CONFIG = {
    FCFS: {
        processOrder: "input",
        type2EventOrder: "arrival-then-id",
        type2PhaseOrder: ["CPU1", "IO", "CPU2"],
        showArrival: true,
        showBurst: true
    },

    SJF: {
        processOrder: "input",
        type2EventOrder: "arrival-then-id",
        type2PhaseOrder: ["CPU1", "IO", "CPU2"],
        showArrival: true,
        showBurst: true
    },

    SRTF: {
        processOrder: "input",
        type2EventOrder: "arrival-then-id",
        type2PhaseOrder: ["CPU1", "IO", "CPU2"],
        showArrival: true,
        showBurst: true,
        showRemainingTime: true,
        showState: true,
        // Change to another value if a reference uses a different
        // visual order for CPU1 / I/O / CPU2.
        snapshotPhaseOrder: ["CPU1", "IO", "CPU2"]
    },

    RR: {
        processOrder: "input",
        type2EventOrder: "arrival-then-id",
        // RR is displayed in execution-block order rather than input order.
        snapshotOrder: "execution",
        type2PhaseOrder: ["CPU1", "IO", "CPU2"],
        showQuantum: true,
        showBlockNumber: true,
        showQueue: true,
        queueDirection: "forward",
        // If a source wants the circular queue represented differently,
        // change this without touching the RR algorithm.
        queueTiePreference: "lower-process-id"
    }
};

function getSnapshotConfig(algorithm) {
    return SNAPSHOT_CONFIG[algorithm] || SNAPSHOT_CONFIG.FCFS;
}

function getSnapshotProcessOrder(algorithm, list) {
    let config = getSnapshotConfig(algorithm);
    let result = [...list];

    if (config.processOrder === "id") {
        result.sort(function(a, b) {
            return a.id.localeCompare(b.id);
        });
    } else if (config.processOrder === "reverse-input") {
        result.reverse();
    }

    // "input" intentionally preserves the question's process order.
    return result;
}

function getSnapshotEventOrder(algorithm) {
    return getSnapshotConfig(algorithm).type2EventOrder || "arrival-then-id";
}

function getSnapshotPhaseOrder(algorithm) {
    return [...getSnapshotConfig(algorithm).snapshotPhaseOrder ||
        getSnapshotConfig(algorithm).type2PhaseOrder || ["CPU1", "IO", "CPU2"]];
}
