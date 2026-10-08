// ==============================
// STUDY TOOLS: QUESTION + SOLVING KIT
// ==============================

let questionToolButton = null;
let solvingKitButton = null;
let questionToolPopup = null;
let solvingKitPopup = null;
let questionToolPinned = false;
let solvingKitPinned = false;

function initializeStudyTools() {
    questionToolButton = document.getElementById("question-tool-button");
    solvingKitButton = document.getElementById("solving-kit-button");
    questionToolPopup = document.getElementById("question-tool-popup");
    solvingKitPopup = document.getElementById("solving-kit-popup");

    if (!questionToolButton || !solvingKitButton) return;

    questionToolButton.addEventListener("mouseenter", showQuestionTool);
    questionToolButton.addEventListener("mouseleave", function() {
        if (!questionToolPinned) hideQuestionTool();
    });
    questionToolButton.addEventListener("click", function(event) {
        event.stopPropagation();
        questionToolPinned = !questionToolPinned;
        if (questionToolPinned) showQuestionTool(true);
        else hideQuestionTool();
    });

    solvingKitButton.addEventListener("mouseenter", showSolvingKit);
    solvingKitButton.addEventListener("mouseleave", function() {
        if (!solvingKitPinned) hideSolvingKit();
    });
    solvingKitButton.addEventListener("click", function(event) {
        event.stopPropagation();
        solvingKitPinned = !solvingKitPinned;
        if (solvingKitPinned) showSolvingKit(true);
        else hideSolvingKit();
    });

    document.addEventListener("click", function(event) {
        if (questionToolPinned && questionToolPopup && !questionToolPopup.contains(event.target) && event.target !== questionToolButton) {
            questionToolPinned = false;
            hideQuestionTool();
        }
        if (solvingKitPinned && solvingKitPopup && !solvingKitPopup.contains(event.target) && event.target !== solvingKitButton) {
            solvingKitPinned = false;
            hideSolvingKit();
        }
    });

    refreshStudyTools();
}

function isPracticeVisible() {
    let screen = document.getElementById("practice-screen");
    return !!screen && getComputedStyle(screen).display !== "none";
}

function isResultsVisible() {
    let screen = document.getElementById("results-screen");
    return !!screen && getComputedStyle(screen).display !== "none";
}

function refreshStudyTools() {
    if (!questionToolButton || !solvingKitButton) return;

    let practiceVisible = isPracticeVisible();
    let resultsVisible = isResultsVisible();

    // Question is useful only while the game is being played.
    let showQuestion = practiceVisible && processes.length > 0;
    // Solving Kit is useful only while the user is practicing.
    // It is intentionally hidden on the final Results page.
    let showSolvingKit = practiceVisible;

    questionToolButton.style.display = showQuestion ? "flex" : "none";
    solvingKitButton.style.display = showSolvingKit ? "flex" : "none";

    questionToolButton.classList.toggle("study-tool-disabled", !showQuestion);
    solvingKitButton.classList.toggle("study-tool-locked", practiceVisible && (!ganttCompleted || !performanceStarted));

    if (!showQuestion) hideQuestionTool();
    if (!showSolvingKit) hideSolvingKit();

    if (questionToolPopup && questionToolPopup.classList.contains("visible")) showQuestionTool();
    if (solvingKitPopup && solvingKitPopup.classList.contains("visible")) showSolvingKit();
}

function showQuestionTool(pinned = false) {
    if (!questionToolPopup || !isPracticeVisible()) return;

    if (!processes || processes.length === 0) {
        questionToolPopup.innerHTML = '<div class="study-popup-message">Start Practice to view the current question.</div>';
    } else {
        let typeLabel = selectedQuestionType === "type2" ? "Question Type 2" : "Question Type 1";
        let rows = "";
        for (let process of processes) {
            if (selectedQuestionType === "type2") {
                rows += `<tr><td>${process.id}</td><td>${process.arrival}</td><td>${process.burst1}</td><td>${process.io}</td><td>${process.burst2}</td></tr>`;
            } else {
                rows += `<tr><td>${process.id}</td><td>${process.arrival}</td><td>${process.burst}</td></tr>`;
            }
        }

        let head = selectedQuestionType === "type2"
            ? "<tr><th>Process</th><th>Arrival</th><th>CPU 1</th><th>I/O</th><th>CPU 2</th></tr>"
            : "<tr><th>Process</th><th>Arrival</th><th>CPU Burst</th></tr>";

        questionToolPopup.innerHTML = `
            <div class="study-popup-card question-card">
                <div class="study-popup-heading">
                    <span>Current Question</span>
                    <small>${typeLabel}</small>
                </div>
                <table class="study-question-table">${head}${rows}</table>
            </div>
        `;
    }

    questionToolPopup.classList.add("visible");
    questionToolPopup.classList.toggle("pinned", pinned || questionToolPinned);
    questionToolPopup.setAttribute("aria-hidden", "false");
    if (pinned || questionToolPinned) {
        let card = questionToolPopup.querySelector(".study-popup-card");
        if (card && !card.querySelector(".study-popup-close")) {
            card.classList.add("pinned-card");
            let close = document.createElement("button");
            close.type = "button";
            close.className = "study-popup-close";
            close.setAttribute("aria-label", "Close question");
            close.textContent = "×";
            close.addEventListener("click", function(event) {
                event.stopPropagation();
                questionToolPinned = false;
                hideQuestionTool();
            });
            card.appendChild(close);
        }
    }
}

function hideQuestionTool() {
    if (!questionToolPopup) return;
    questionToolPopup.classList.remove("visible", "pinned");
    questionToolPopup.setAttribute("aria-hidden", "true");
}

function showSolvingKit(pinned = false) {
    if (!solvingKitPopup) return;

    if (!isPracticeVisible() && !isResultsVisible()) return;

    if (isResultsVisible()) {
        solvingKitPopup.innerHTML = buildSolvingKitContent(true);
    } else if (!ganttCompleted) {
        solvingKitPopup.innerHTML = `
            <div class="study-popup-card locked-card">
                <div class="study-popup-heading">Solving Kit</div>
                <div class="study-lock-message">Complete the Gantt chart first.</div>
            </div>
        `;
    } else if (!performanceStarted) {
        solvingKitPopup.innerHTML = `
            <div class="study-popup-card locked-card">
                <div class="study-popup-heading">Solving Kit</div>
                <div class="study-lock-message">Go to Level 1 to unlock the Solving Kit.</div>
            </div>
        `;
    } else {
        solvingKitPopup.innerHTML = buildSolvingKitContent(false);
    }

    solvingKitPopup.classList.add("visible");
    solvingKitPopup.classList.toggle("pinned", pinned || solvingKitPinned);
    solvingKitPopup.setAttribute("aria-hidden", "false");
    if (pinned || solvingKitPinned) {
        let card = solvingKitPopup.querySelector(".study-popup-card");
        if (card && !card.querySelector(".study-popup-close")) {
            card.classList.add("pinned-card");
            let close = document.createElement("button");
            close.type = "button";
            close.className = "study-popup-close";
            close.setAttribute("aria-label", "Close solving kit");
            close.textContent = "×";
            close.addEventListener("click", function(event) {
                event.stopPropagation();
                solvingKitPinned = false;
                hideSolvingKit();
            });
            card.appendChild(close);
        }
    }
}

function hideSolvingKit() {
    if (!solvingKitPopup) return;
    solvingKitPopup.classList.remove("visible", "pinned");
    solvingKitPopup.setAttribute("aria-hidden", "true");
}

function buildSolvingKitContent(finalResult) {
    let performanceRows = "";
    let completedValues = getCompletedPerformanceValues();

    for (let process of processes) {
        let values = completedValues[process.id] || {};
        performanceRows += `
            <tr>
                <td><strong>${process.id}</strong></td>
                <td>${displayKitValue(values.completionTime)}</td>
                <td>${displayKitValue(values.turnaroundTime)}</td>
                <td>${displayKitValue(values.waitingTime)}</td>
                <td>${displayKitValue(values.responseTime)}</td>
            </tr>
        `;
    }

    let averages = getCompletedAverages();

    return `
        <div class="study-popup-card solving-card">
            <div class="study-popup-heading">
                <span>${finalResult ? "Solving Kit — Final Result" : "Solving Kit"}</span>
                <small>${currentAlgorithm || "Algorithm"}</small>
            </div>
            <div class="kit-section">
                <div class="kit-section-title">${finalResult ? "Correct Gantt Chart" : "Solved Gantt Chart"}</div>
                ${buildMiniGantt()}
            </div>
            <div class="kit-section">
                <div class="kit-section-title">Performance Progress</div>
                <table class="kit-performance-table">
                    <tr><th>Process</th><th>CT</th><th>TAT</th><th>WT</th><th>RT</th></tr>
                    ${performanceRows}
                </table>
            </div>
            ${gameModeEnabled ? buildScoreCard(true) : ""}
            <div class="kit-section">
                <div class="kit-section-title">Averages</div>
                <table class="kit-performance-table">
                    <tr><th>Metric</th><th>Average</th></tr>
                    <tr><td>Waiting Time</td><td>${displayKitValue(averages.averageWaitingTime)}</td></tr>
                    <tr><td>Turnaround Time</td><td>${displayKitValue(averages.averageTurnaroundTime)}</td></tr>
                    <tr><td>Response Time</td><td>${displayKitValue(averages.averageResponseTime)}</td></tr>
                </table>
            </div>
        </div>
    `;
}

function displayKitValue(value) {
    return value === undefined || value === null || value === "" ? "—" : value;
}

function getCompletedPerformanceValues() {
    let values = {};
    let container = document.getElementById("performance-level-container");
    if (!container) return values;

    let propertyByLevel = ["completionTime", "turnaroundTime", "waitingTime", "responseTime"];
    let panels = Array.from(container.querySelectorAll(".performance-level-card"));

    panels.forEach(function(panel, index) {
        if (index >= propertyByLevel.length) return;
        let property = propertyByLevel[index];
        let inputs = Array.from(panel.querySelectorAll(".performance-answer-input"));
        inputs.forEach(function(input) {
            if (input.value.trim() === "") return;
            let id = input.dataset.processId;
            if (!values[id]) values[id] = {};
            if (input.disabled || input.classList.contains("answer-correct")) values[id][property] = input.value;
        });
    });

    return values;
}

function getCompletedAverages() {
    let values = {};
    let container = document.getElementById("performance-level-container");
    if (!container) return values;

    let panel = container.querySelector('.performance-level-card[data-level="5"]');
    if (!panel) return values;

    Array.from(panel.querySelectorAll(".performance-average-input")).forEach(function(input) {
        if (input.value.trim() !== "" && (input.disabled || input.classList.contains("answer-correct"))) {
            values[input.dataset.averageProperty] = input.value;
        }
    });
    return values;
}

function buildMiniGantt() {
    if (!currentSchedule || currentSchedule.length === 0) {
        return '<div class="kit-empty">Gantt chart unavailable.</div>';
    }

    let blocks = currentSchedule.map(function(block) {
        return `<div class="kit-gantt-block"><strong>${block.id}</strong><span>${block.start}–${block.end}</span></div>`;
    }).join("");

    return `<div class="kit-gantt">${blocks}</div>`;
}

initializeStudyTools();
