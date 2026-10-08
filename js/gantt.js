// ==============================
// GANTT CHART
// ==============================

let ganttZoom = 1;
let ganttFitBlockWidth = 110;
const GANTT_ZOOM_MIN = 0.5;
const GANTT_ZOOM_MAX = 2;
const GANTT_ZOOM_STEP = 0.1;
const GANTT_BASE_BLOCK_WIDTH = 110;

function createEmptyGanttChart(schedule) {
    let timeline = document.getElementById("timeline");
    timeline.innerHTML = "";
    ganttZoom = 1;

    let toolbar = document.createElement("div");
    toolbar.className = "gantt-toolbar";
    toolbar.innerHTML = `
        <span class="gantt-toolbar-label">CPU Timeline</span>
        <div class="gantt-zoom-controls" aria-label="Gantt chart zoom controls">
            <button type="button" class="gantt-zoom-button" id="gantt-zoom-minus" title="Zoom out" aria-label="Zoom out">−</button>
            <span id="gantt-zoom-value" class="gantt-zoom-value">100%</span>
            <button type="button" class="gantt-zoom-button" id="gantt-zoom-plus" title="Zoom in" aria-label="Zoom in">+</button>
        </div>
    `;
    timeline.appendChild(toolbar);

    let viewport = document.createElement("div");
    viewport.className = "gantt-scroll-viewport";

    let chart = document.createElement("div");
    chart.className = "gantt-chart";
    chart.dataset.blockCount = schedule.length;

    let blocks = document.createElement("div");
    blocks.className = "gantt-blocks";

    for (let i = 0; i < schedule.length; i++) {
        let block = document.createElement("div");
        block.className = "gantt-block";
        if (i === 0) block.classList.add("active-block");
        block.innerHTML = `
            <div class="gantt-process">EMPTY</div>
            <div class="gantt-end-time"></div>
        `;
        blocks.appendChild(block);
    }

    let times = document.createElement("div");
    times.className = "gantt-times";

    for (let i = 0; i < schedule.length; i++) {
        let time = document.createElement("span");
        time.textContent = schedule[i].start;
        times.appendChild(time);
    }

    let finalTime = document.createElement("span");
    finalTime.textContent = schedule[schedule.length - 1].end;
    times.appendChild(finalTime);

    chart.appendChild(blocks);
    chart.appendChild(times);
    viewport.appendChild(chart);
    timeline.appendChild(viewport);

    let replayControls = document.createElement("div");
    replayControls.id = "gantt-replay-controls";
    replayControls.className = "gantt-replay-controls";
    replayControls.innerHTML = `
        <button type="button" id="gantt-replay-prev" class="gantt-replay-arrow" aria-label="Previous solved step" title="Previous solved step">←</button>
        <button type="button" id="gantt-replay-button" class="gantt-replay-button" aria-label="Replay solved Gantt steps" title="Replay solved Gantt steps">Replay</button>
        <button type="button" id="gantt-replay-next" class="gantt-replay-arrow" aria-label="Next solved step" title="Next solved step">→</button>
        <span id="gantt-replay-status" class="gantt-replay-status">Solve a block to replay it</span>
    `;
    timeline.appendChild(replayControls);

    document.getElementById("gantt-replay-prev").addEventListener("click", function() {
        moveGanttReplay(-1);
    });
    document.getElementById("gantt-replay-next").addEventListener("click", function() {
        moveGanttReplay(1);
    });
    document.getElementById("gantt-replay-button").addEventListener("click", function() {
        startGanttReplay();
    });

    ganttReplayIndex = -1;
    ganttReplayActive = false;
    updateGanttReplayControls();

    document.getElementById("gantt-zoom-minus").addEventListener("click", function() {
        setGanttZoom(ganttZoom - GANTT_ZOOM_STEP);
    });
    document.getElementById("gantt-zoom-plus").addEventListener("click", function() {
        setGanttZoom(ganttZoom + GANTT_ZOOM_STEP);
    });

    updateGanttZoom();
}

function isGanttReplayViewing() {
    return !!ganttReplayActive && currentSchedule.length > 0;
}

function updateGanttReplayControls() {
    let controls = document.getElementById("gantt-replay-controls");
    let prev = document.getElementById("gantt-replay-prev");
    let next = document.getElementById("gantt-replay-next");
    let replay = document.getElementById("gantt-replay-button");
    let status = document.getElementById("gantt-replay-status");
    if (!controls || !prev || !next || !replay || !status) return;

    let solvedCount = Math.max(0, Math.min(currentBlock, currentSchedule.length));
    let maxIndex = solvedCount - 1;
    let hasReplay = solvedCount > 0;

    controls.classList.toggle("replay-available", hasReplay);
    controls.classList.toggle("replay-viewing", isGanttReplayViewing());
    replay.textContent = isGanttReplayViewing() ? "Live" : "Replay";
    replay.title = isGanttReplayViewing() ? "Return to the live solving state" : "Replay solved Gantt steps";
    prev.disabled = !hasReplay || ganttReplayIndex <= 0;
    // Keep one final right-arrow click available on the last solved step.
    // That click exits replay and restores the exact live/completed state,
    // including the final RR quantum disappearing from the visualizer.
    next.disabled = !hasReplay || ganttReplayIndex > maxIndex;
    replay.disabled = !hasReplay;

    if (!hasReplay) {
        status.textContent = "Solve a block to replay it";
        return;
    }

    if (ganttReplayIndex < 0 || ganttReplayIndex > maxIndex) {
        ganttReplayIndex = maxIndex;
    }

    status.textContent = `Step ${ganttReplayIndex + 1} / ${solvedCount}`;

    if (isGanttReplayViewing()) {
        if (typeof refreshAlgorithmButtonStatesForReplay === "function") {
            refreshAlgorithmButtonStatesForReplay(ganttReplayIndex);
        }
    } else if (typeof refreshAlgorithmButtonStates === "function") {
        refreshAlgorithmButtonStates();
    }

    let blocks = document.querySelectorAll("#timeline .gantt-block");
    blocks.forEach(function(block) {
        block.classList.remove("replay-highlight");
    });
    if (blocks[ganttReplayIndex]) {
        blocks[ganttReplayIndex].classList.add("replay-highlight");
    }
}

function startGanttReplay() {
    let solvedCount = Math.max(0, Math.min(currentBlock, currentSchedule.length));
    if (solvedCount === 0) return;

    if (ganttReplayActive) {
        ganttReplayActive = false;
        ganttReplayIndex = solvedCount - 1;
        updateGanttReplayControls();
        return;
    }

    ganttReplayActive = true;
    ganttReplayIndex = 0;
    updateGanttReplayControls();
}

function moveGanttReplay(direction) {
    let solvedCount = Math.max(0, Math.min(currentBlock, currentSchedule.length));
    if (solvedCount === 0) return;

    let maxIndex = solvedCount - 1;
    if (ganttReplayIndex < 0) ganttReplayIndex = maxIndex;

    // One final right-arrow click leaves the replay view clean instead of
    // leaving the last replay highlight visible.
    if (direction > 0 && ganttReplayIndex >= maxIndex) {
        ganttReplayActive = false;
        ganttReplayIndex = maxIndex;
        document.querySelectorAll("#timeline .gantt-block").forEach(function(block) {
            block.classList.remove("replay-highlight");
        });
        updateGanttReplayControls();
        return;
    }

    ganttReplayIndex = Math.max(0, Math.min(maxIndex, ganttReplayIndex + direction));
    updateGanttReplayControls();
}

function setGanttZoom(value) {
    ganttZoom = Math.max(GANTT_ZOOM_MIN, Math.min(GANTT_ZOOM_MAX, value));
    updateGanttZoom();
}

function updateGanttZoom() {
    let chart = document.querySelector("#timeline .gantt-chart");
    let viewport = document.querySelector("#timeline .gantt-scroll-viewport");
    let value = document.getElementById("gantt-zoom-value");
    let minus = document.getElementById("gantt-zoom-minus");
    let plus = document.getElementById("gantt-zoom-plus");
    if (!chart || !viewport) return;

    let count = Number(chart.dataset.blockCount || 1);
    let viewportWidth = viewport.clientWidth || 0;

    if (viewportWidth > 0) {
        ganttFitBlockWidth = viewportWidth / count;
    }

    let actualBlockWidth = ganttFitBlockWidth * ganttZoom;

    chart.style.setProperty("--gantt-block-width", actualBlockWidth + "px");
    chart.style.width = (count * actualBlockWidth) + "px";
    chart.style.margin = ganttZoom === 1 ? "0 auto" : "0";

    if (value) value.textContent = Math.round(ganttZoom * 100) + "%";
    if (minus) minus.disabled = ganttZoom <= GANTT_ZOOM_MIN;
    if (plus) plus.disabled = ganttZoom >= GANTT_ZOOM_MAX;
}


window.addEventListener("resize", function() {
    updateGanttZoom();
});
