// ==============================
// PERFORMANCE FLOW + RESULTS
// ==============================

function resetScoreState() {
    scoreState = { gantt: 0, levels: [0, 0, 0, 0, 0], total: 0, earnedKeys: {} };
}

function updateTotalScore() {
    scoreState.total = scoreState.gantt + scoreState.levels.reduce(function(sum, value) { return sum + value; }, 0);
}

function awardScore(key, levelIndex, points) {
    if (!gameModeEnabled || scoreState.earnedKeys[key]) return;
    scoreState.earnedKeys[key] = true;
    if (levelIndex === "gantt") scoreState.gantt += points;
    else scoreState.levels[levelIndex] += points;
    updateTotalScore();
    refreshStudyTools();
}

function awardGanttScore() {
    // The 50 Gantt points can only be awarded after every Gantt block is solved.
    if (!ganttCompleted || currentBlock < currentSchedule.length) return;
    awardScore("gantt", "gantt", 50);
}

function awardPerformanceScore(levelIndex, itemKey, itemCount) {
    let points = 10 / itemCount;
    awardScore("level-" + levelIndex + "-" + itemKey, levelIndex, points);
}

function getScoreSummary() {
    updateTotalScore();
    return {
        gantt: scoreState.gantt,
        levels: scoreState.levels.slice(),
        total: scoreState.total
    };
}

function buildScoreCard(compact) {
    if (!gameModeEnabled) return "";
    let score = getScoreSummary();
    let labels = ["Completion Time", "Turnaround Time", "Waiting Time", "Response Time", "Averages"];
    let levelRows = labels.map(function(label, index) {
        return `<div class="score-row"><span>${label}</span><strong>${formatScore(score.levels[index])}/10</strong></div>`;
    }).join("");

    return `
        <div class="score-card ${compact ? "score-card-compact" : ""}">
            <div class="score-card-heading"><span>Game Score</span><strong>${formatScore(score.total)}/100</strong></div>
            <div class="score-breakdown">
                <div class="score-row"><span>Gantt Chart</span><strong>${formatScore(score.gantt)}/50</strong></div>
                ${levelRows}
            </div>
            <div class="score-progress" aria-label="Score ${formatScore(score.total)} out of 100">
                <div class="score-progress-fill" style="width:${Math.max(0, Math.min(100, score.total))}%"></div>
            </div>
        </div>
    `;
}

function formatScore(value) {
    return Number(value).toFixed(2).replace(/\.00$/, "");
}

function getPerformanceData() {
    if (!currentPerformance) {
        currentPerformance = calculatePerformance(currentSchedule);
    }
    return currentPerformance;
}

function showGanttCompletionOptions() {
    ganttCompleted = true;
    awardGanttScore();
    performanceStarted = false;
    refreshStudyTools();

    let actionArea = document.getElementById("action-area");
    let oldPanel = document.getElementById("completion-panel");
    if (oldPanel) oldPanel.remove();

    let panel = document.createElement("div");
    panel.id = "completion-panel";
    panel.className = "performance-panel";
    panel.innerHTML = `
        <h3>Gantt Chart Completed Successfully</h3>
        <p>Choose how you want to continue.</p>
        <div class="performance-actions">
            <button id="direct-submit-button">Submit to Get Complete Result</button>
            <button id="next-level-button">Next Level</button>
        </div>
    `;
    actionArea.appendChild(panel);

    document.getElementById("direct-submit-button").addEventListener("click", showFinalResults);
    document.getElementById("next-level-button").addEventListener("click", startPerformanceLevels);
}

function startPerformanceLevels() {
    currentPerformance = calculatePerformance(currentSchedule);
    performanceLevel = 0;
    performanceStarted = true;
    refreshStudyTools();

    let completionPanel = document.getElementById("completion-panel");
    if (completionPanel) completionPanel.remove();

    let oldContainer = document.getElementById("performance-level-container");
    if (oldContainer) oldContainer.remove();

    let actionArea = document.getElementById("action-area");
    let container = document.createElement("div");
    container.id = "performance-level-container";
    actionArea.appendChild(container);

    showPerformanceLevel();
}

function showPerformanceLevel() {
    let container = document.getElementById("performance-level-container");
    if (!container) return;

    let panel = document.createElement("div");
    panel.className = "performance-panel performance-level-card";
    panel.dataset.level = performanceLevel + 1;

    let content = "";

    if (performanceLevel === 0) {
        content = buildMetricTable("Level 1 — Completion Time", "Completion Time (CT)", "completionTime");
    } else if (performanceLevel === 1) {
        content = buildMetricTable("Level 2 — Turnaround Time", "Turnaround Time (TAT)", "turnaroundTime");
    } else if (performanceLevel === 2) {
        content = buildMetricTable("Level 3 — Waiting Time", "Waiting Time (WT)", "waitingTime");
    } else if (performanceLevel === 3) {
        content = buildMetricTable("Level 4 — Response Time", "Response Time (RT)", "responseTime");
    } else {
        content = buildAveragesPanel();
    }

    panel.innerHTML = content;
    container.appendChild(panel);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });

    if (performanceLevel < 4) {
        attachMetricLevelHandlers(panel);
    } else {
        attachAveragesLevelHandlers(panel);
    }
}

function getPerformanceFormulaTip(property) {
    let type2 = selectedQuestionType === "type2";

    if (property === "completionTime") {
        return {
            formula: "CT = time when the process completes its final CPU burst",
            tip: type2
                ? "Type 2: use the end of CPU 2. Ignore the I/O interval when identifying the completion instant."
                : "Type 1: use the end of the process's only CPU burst."
        };
    }

    if (property === "turnaroundTime") {
        return {
            formula: "TAT = CT − Arrival Time",
            tip: "Start from the Completion Time you found in Level 1, then subtract that process's arrival time."
        };
    }

    if (property === "waitingTime") {
        return {
            formula: type2
                ? "WT = TAT − (CPU 1 + I/O + CPU 2)"
                : "WT = TAT − CPU Burst",
            tip: type2
                ? "Type 2: subtract the I/O time as well as CPU 1 and CPU 2 from the turnaround time."
                : "Type 1: subtract the process's CPU burst from its turnaround time."
        };
    }

    return {
        formula: "RT = first CPU start time − Arrival Time",
        tip: type2
            ? "Type 2: use the first time the process receives CPU 1. Do not use the start of CPU 2."
            : "Type 1: use the first time the process gets the CPU."
    };
}

function buildMetricTable(title, label, property) {
    let formula = getPerformanceFormulaTip(property);
    let html = `
        <h3>${title}</h3>
        <div class="performance-formula-box">
            <div class="performance-formula-title">Formula / Tip</div>
            <div class="performance-formula-main">${formula.formula}</div>
            <div class="performance-formula-tip">${formula.tip}</div>
        </div>
        <p class="performance-instruction">Enter the ${label} for each process.</p>
        <table class="performance-level-table">
            <tr><th>Process</th><th>${label}</th><th>Check</th></tr>
    `;

    for (let result of currentPerformance.processes) {
        html += `
            <tr data-process-id="${result.id}">
                <td><strong>${result.id}</strong></td>
                <td>
                    <input class="performance-answer-input" type="number" min="0" step="any" data-property="${property}" data-process-id="${result.id}" aria-label="${result.id} ${label}">
                    <span class="performance-feedback"></span>
                </td>
                <td>
                    <button class="check-performance-button" data-process-id="${result.id}">Check</button>
                    <button class="performance-row-skip-button" data-process-id="${result.id}" type="button">Skip &amp; Show</button>
                </td>
            </tr>
        `;
    }

    html += `
        </table>
        <div class="performance-level-actions">
            <button class="skip-level-button">Skip &amp; Show Answers</button>
            <button class="performance-submit-button">Submit &amp; Finish</button>
            <button class="performance-next-button" disabled>Next</button>
        </div>
        <p class="level-status" aria-live="polite"></p>
    `;
    return html;
}

function attachMetricLevelHandlers(panel) {
    let inputs = Array.from(panel.querySelectorAll(".performance-answer-input"));
    let checks = Array.from(panel.querySelectorAll(".check-performance-button"));
    let nextButton = panel.querySelector(".performance-next-button");
    let skipButton = panel.querySelector(".skip-level-button");
    let submitButton = panel.querySelector(".performance-submit-button");
    let status = panel.querySelector(".level-status");
    let rowSkipButtons = Array.from(panel.querySelectorAll(".performance-row-skip-button"));

    rowSkipButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            let processId = button.dataset.processId;
            let input = panel.querySelector(`.performance-answer-input[data-process-id="${processId}"]`);
            fillSingleMetricAnswer(panel, processId, input, true);
            updatePerformanceLevelCompletion(panel, nextButton, status);
            refreshStudyTools();
        });
    });

    checks.forEach(function(button) {
        button.addEventListener("click", function() {
            let processId = button.dataset.processId;
            let input = panel.querySelector(`.performance-answer-input[data-process-id="${processId}"]`);
            checkPerformanceAnswer(panel, processId, input, button);
            updatePerformanceLevelCompletion(panel, nextButton, status);
            refreshStudyTools();
        });
    });

    inputs.forEach(function(input) {
        input.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                let processId = input.dataset.processId;
                let button = panel.querySelector(`.check-performance-button[data-process-id="${processId}"]`);
                button.click();
            }
        });
    });

    skipButton.addEventListener("click", function() {
        fillMetricAnswers(panel, true);
        status.textContent = "Skipped. The correct values have been revealed and this level is complete.";
        status.className = "level-status status-skipped";
        nextButton.disabled = false;
        refreshStudyTools();
    });

    submitButton.addEventListener("click", showFinalResults);

    nextButton.addEventListener("click", function() {
        performanceLevel++;
        showPerformanceLevel();
    });
}

function checkPerformanceAnswer(panel, processId, input, button) {
    let property = input.dataset.property;
    let result = currentPerformance.processes.find(function(item) {
        return item.id === processId;
    });
    let feedback = panel.querySelector(`tr[data-process-id="${processId}"] .performance-feedback`);

    if (!result) return;

    let userValue = Number(input.value);
    let correctValue = Number(result[property]);

    if (input.value.trim() !== "" && Math.abs(userValue - correctValue) < 0.000001) {
        input.value = result[property];
        input.disabled = true;
        button.disabled = true;
        let rowSkip = panel.querySelector(`.performance-row-skip-button[data-process-id="${processId}"]`);
        if (rowSkip) rowSkip.disabled = true;
        input.classList.add("answer-correct");
        awardPerformanceScore(performanceLevel, processId, currentPerformance.processes.length);
        feedback.textContent = "✓ Correct";
        feedback.className = "performance-feedback correct-feedback";
    } else {
        input.classList.remove("answer-correct");
        feedback.textContent = "Try again";
        feedback.className = "performance-feedback wrong-feedback";
        input.focus();
        input.select();
    }
}

function updatePerformanceLevelCompletion(panel, nextButton, status) {
    let inputs = Array.from(panel.querySelectorAll(".performance-answer-input"));
    let complete = inputs.every(function(input) {
        return input.disabled && input.classList.contains("answer-correct");
    });

    nextButton.disabled = !complete;
    refreshStudyTools();
    if (complete) {
        status.textContent = "Level completed successfully. Click Next to continue.";
        status.className = "level-status status-complete";
    }
}

function fillMetricAnswers(panel, skipped) {
    let inputs = Array.from(panel.querySelectorAll(".performance-answer-input"));

    inputs.forEach(function(input) {
        let processId = input.dataset.processId;
        let property = input.dataset.property;
        let result = currentPerformance.processes.find(function(item) {
            return item.id === processId;
        });
        if (!result) return;

        input.value = result[property];
        input.disabled = true;

        let button = panel.querySelector(`.check-performance-button[data-process-id="${processId}"]`);
        if (button) button.disabled = true;
        let rowSkip = panel.querySelector(`.performance-row-skip-button[data-process-id="${processId}"]`);
        if (rowSkip) rowSkip.disabled = true;

        let feedback = panel.querySelector(`tr[data-process-id="${processId}"] .performance-feedback`);
        feedback.textContent = skipped ? "Skipped — answer shown" : "✓ Correct";
        feedback.className = skipped ? "performance-feedback skipped-feedback" : "performance-feedback correct-feedback";
    });
}

function buildAveragesPanel() {
    let rows = [
        { property: "averageWaitingTime", label: "Average Waiting Time" },
        { property: "averageTurnaroundTime", label: "Average Turnaround Time" },
        { property: "averageResponseTime", label: "Average Response Time" }
    ];

    let html = `
        <h3>Level 5 — Averages</h3>
        <div class="performance-formula-box">
            <div class="performance-formula-title">Formula / Tip</div>
            <div class="performance-formula-main">Average = Sum of the process values ÷ Number of processes</div>
            <div class="performance-formula-tip">Use the completed values from the earlier levels. Find each average separately and enter the result below.</div>
        </div>
        <p class="performance-instruction">Enter each average, then check it. You can skip any one and reveal its answer.</p>
        <table class="average-level-table">
            <tr><th>Metric</th><th>Average Value</th><th>Check</th></tr>
    `;

    rows.forEach(function(row) {
        html += `
            <tr data-average-property="${row.property}">
                <td><strong>${row.label}</strong></td>
                <td>
                    <input class="performance-answer-input performance-average-input" type="number" min="0" step="any" data-average-property="${row.property}" aria-label="${row.label}">
                    <span class="performance-feedback"></span>
                </td>
                <td>
                    <button class="check-average-button" data-average-property="${row.property}">Check</button>
                    <button class="performance-row-skip-button average-row-skip-button" data-average-property="${row.property}" type="button">Skip &amp; Show</button>
                </td>
            </tr>
        `;
    });

    html += `
        </table>
        <div class="performance-level-actions">
            <button class="skip-level-button">Skip &amp; Show Answers</button>
            <button class="performance-submit-button">Submit &amp; Finish</button>
        </div>
        <p class="level-status" aria-live="polite"></p>
    `;
    return html;
}

function fillSingleMetricAnswer(panel, processId, input, skipped) {
    let property = input.dataset.property;
    let result = currentPerformance.processes.find(function(item) {
        return item.id === processId;
    });
    if (!result) return;

    input.value = result[property];
    input.disabled = true;
    input.classList.add("answer-correct");

    let checkButton = panel.querySelector(`.check-performance-button[data-process-id="${processId}"]`);
    if (checkButton) checkButton.disabled = true;

    let skipButton = panel.querySelector(`.performance-row-skip-button[data-process-id="${processId}"]`);
    if (skipButton) skipButton.disabled = true;

    let feedback = panel.querySelector(`tr[data-process-id="${processId}"] .performance-feedback`);
    feedback.textContent = skipped ? "Skipped — answer shown" : "✓ Correct";
    feedback.className = skipped ? "performance-feedback skipped-feedback" : "performance-feedback correct-feedback";
}

function attachAveragesLevelHandlers(panel) {
    let inputs = Array.from(panel.querySelectorAll(".performance-average-input"));
    let checks = Array.from(panel.querySelectorAll(".check-average-button"));
    let rowSkips = Array.from(panel.querySelectorAll(".average-row-skip-button"));
    let skipButton = panel.querySelector(".skip-level-button");
    let submitButton = panel.querySelector(".performance-submit-button");
    let status = panel.querySelector(".level-status");

    checks.forEach(function(button) {
        button.addEventListener("click", function() {
            checkAverageAnswer(panel, button.dataset.averageProperty);
            updateAverageLevelCompletion(panel, status);
            refreshStudyTools();
        });
    });

    rowSkips.forEach(function(button) {
        button.addEventListener("click", function() {
            fillSingleAverageAnswer(panel, button.dataset.averageProperty, true);
            updateAverageLevelCompletion(panel, status);
            refreshStudyTools();
        });
    });

    inputs.forEach(function(input) {
        input.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                let button = panel.querySelector(`.check-average-button[data-average-property="${input.dataset.averageProperty}"]`);
                if (button) button.click();
            }
        });
    });

    skipButton.addEventListener("click", function() {
        inputs.forEach(function(input) {
            fillSingleAverageAnswer(panel, input.dataset.averageProperty, true);
        });
        status.textContent = "Skipped. The correct averages have been revealed.";
        status.className = "level-status status-skipped";
        refreshStudyTools();
    });

    submitButton.addEventListener("click", showFinalResults);
}

function checkAverageAnswer(panel, property) {
    let input = panel.querySelector(`.performance-average-input[data-average-property="${property}"]`);
    let feedback = panel.querySelector(`tr[data-average-property="${property}"] .performance-feedback`);
    let correctValue = Number(currentPerformance[property]);
    let userValue = Number(input.value);

    if (input.value.trim() !== "" && Math.abs(userValue - correctValue) < 0.000001) {
        input.value = currentPerformance[property];
        input.disabled = true;
        input.classList.add("answer-correct");
        awardPerformanceScore(4, property, 3);
        panel.querySelector(`.check-average-button[data-average-property="${property}"]`).disabled = true;
        panel.querySelector(`.average-row-skip-button[data-average-property="${property}"]`).disabled = true;
        feedback.textContent = "✓ Correct";
        feedback.className = "performance-feedback correct-feedback";
    } else {
        input.classList.remove("answer-correct");
        feedback.textContent = "Try again";
        feedback.className = "performance-feedback wrong-feedback";
        input.focus();
        input.select();
    }
}

function fillSingleAverageAnswer(panel, property, skipped) {
    let input = panel.querySelector(`.performance-average-input[data-average-property="${property}"]`);
    if (!input) return;
    input.value = currentPerformance[property];
    input.disabled = true;
    input.classList.add("answer-correct");
    panel.querySelector(`.check-average-button[data-average-property="${property}"]`).disabled = true;
    panel.querySelector(`.average-row-skip-button[data-average-property="${property}"]`).disabled = true;
    let feedback = panel.querySelector(`tr[data-average-property="${property}"] .performance-feedback`);
    feedback.textContent = skipped ? "Skipped — answer shown" : "✓ Correct";
    feedback.className = skipped ? "performance-feedback skipped-feedback" : "performance-feedback correct-feedback";
}

function updateAverageLevelCompletion(panel, status) {
    let inputs = Array.from(panel.querySelectorAll(".performance-average-input"));
    let complete = inputs.every(function(input) {
        return input.disabled && input.classList.contains("answer-correct");
    });
    if (complete) {
        status.textContent = "Average level completed successfully. You can submit the complete result.";
        status.className = "level-status status-complete";
    }
}

function showFinalResults() {
    // Never allow a direct/performance submit to bypass Gantt completion.
    if (!ganttCompleted || currentBlock < currentSchedule.length) {
        let feedback = document.getElementById("feedback");
        if (!feedback) {
            feedback = document.createElement("p");
            feedback.id = "feedback";
            document.getElementById("action-area").appendChild(feedback);
        }
        feedback.textContent = "Complete the Gantt chart before submitting the result.";
        feedback.style.color = "#dc2626";
        return;
    }

    currentPerformance = calculatePerformance(currentSchedule);
    displayResults();
    document.getElementById("practice-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "block";
    refreshStudyTools();
}

function displayResults() {
    let performance = getPerformanceData();
    let resultsArea = document.getElementById("results");
    resultsArea.innerHTML = "";

    let algorithmHeading = document.createElement("h3");
    algorithmHeading.textContent = "Algorithm: " + currentAlgorithm;
    resultsArea.appendChild(algorithmHeading);

    let questionHeading = document.createElement("h3");
    questionHeading.textContent = "Original Question";
    resultsArea.appendChild(questionHeading);

    let questionTable = document.createElement("table");
    if (selectedQuestionType === "type2") {
        questionTable.innerHTML = `<tr><th>Process</th><th>Arrival</th><th>CPU 1</th><th>I/O</th><th>CPU 2</th></tr>`;
        for (let process of processes) {
            let row = document.createElement("tr");
            row.innerHTML = `<td>${process.id}</td><td>${process.arrival}</td><td>${process.burst1}</td><td>${process.io}</td><td>${process.burst2}</td>`;
            questionTable.appendChild(row);
        }
    } else {
        questionTable.innerHTML = `<tr><th>Process</th><th>Arrival Time</th><th>Burst Time</th></tr>`;
        for (let process of processes) {
            let row = document.createElement("tr");
            row.innerHTML = `<td>${process.id}</td><td>${process.arrival}</td><td>${process.burst}</td>`;
            questionTable.appendChild(row);
        }
    }
    resultsArea.appendChild(questionTable);

    let ganttHeading = document.createElement("h3");
    ganttHeading.textContent = "Correct Gantt Chart";
    resultsArea.appendChild(ganttHeading);

    let chart = document.createElement("div");
    chart.className = "gantt-chart results-gantt";
    let blocks = document.createElement("div");
    blocks.className = "gantt-blocks";

    for (let block of currentSchedule) {
        let ganttBlock = document.createElement("div");
        ganttBlock.className = "gantt-block completed-block";
        ganttBlock.innerHTML = `<div class="gantt-process">${block.id}</div><div class="gantt-end-time">${block.end}</div>`;
        blocks.appendChild(ganttBlock);
    }

    let times = document.createElement("div");
    times.className = "gantt-times";
    for (let block of currentSchedule) {
        let time = document.createElement("span");
        time.textContent = block.start;
        times.appendChild(time);
    }
    let finalTime = document.createElement("span");
    finalTime.textContent = currentSchedule[currentSchedule.length - 1].end;
    times.appendChild(finalTime);

    chart.appendChild(blocks);
    chart.appendChild(times);
    resultsArea.appendChild(chart);

    let performanceHeading = document.createElement("h3");
    performanceHeading.textContent = "Performance Table";
    resultsArea.appendChild(performanceHeading);

    let table = document.createElement("table");
    table.innerHTML = `<tr><th>Process</th><th>Completion Time</th><th>Turnaround Time</th><th>Waiting Time</th><th>Response Time</th></tr>`;
    for (let result of performance.processes) {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${result.id}</td><td>${result.completionTime}</td><td>${result.turnaroundTime}</td><td>${result.waitingTime}</td><td>${result.responseTime}</td>`;
        table.appendChild(row);
    }
    resultsArea.appendChild(table);

    let averages = document.createElement("div");
    averages.className = "final-averages";
    averages.innerHTML = `
        <h3>Final Statistics</h3>
        <p><strong>Average Waiting Time:</strong> ${performance.averageWaitingTime}</p>
        <p><strong>Average Turnaround Time:</strong> ${performance.averageTurnaroundTime}</p>
        <p><strong>Average Response Time:</strong> ${performance.averageResponseTime}</p>
    `;
    resultsArea.appendChild(averages);

    if (gameModeEnabled) {
        let scoreHeading = document.createElement("h3");
        scoreHeading.textContent = "Game Score";
        resultsArea.appendChild(scoreHeading);
        let scoreWrap = document.createElement("div");
        scoreWrap.innerHTML = buildScoreCard(false);
        resultsArea.appendChild(scoreWrap.firstElementChild);
    }
}

function displayProcesses() {
    let processList = document.getElementById("process-list");
    if (!processList) return;
    processList.innerHTML = "";

    let table = document.createElement("table");
    let editing = questionEditMode;

    if (selectedQuestionType === "type2") {
        table.innerHTML = `<tr><th>Process</th><th>Arrival</th><th>CPU 1</th><th>I/O</th><th>CPU 2</th></tr>`;
        processes.forEach(function(process) {
            let row = document.createElement("tr");
            if (editing) {
                row.innerHTML = `<td><strong>${process.id}</strong></td>
                    <td><input class="question-edit-input" type="number" min="0" step="1" value="${process.arrival}"></td>
                    <td><input class="question-edit-input" type="number" min="1" step="1" value="${process.burst1}"></td>
                    <td><input class="question-edit-input" type="number" min="0" step="1" value="${process.io}"></td>
                    <td><input class="question-edit-input" type="number" min="1" step="1" value="${process.burst2}"></td>`;
            } else {
                row.innerHTML = `<td>${process.id}</td><td>${process.arrival}</td><td>${process.burst1}</td><td>${process.io}</td><td>${process.burst2}</td>`;
            }
            table.appendChild(row);
        });
    } else {
        table.innerHTML = `<tr><th>Process</th><th>Arrival Time</th><th>Burst Time</th></tr>`;
        processes.forEach(function(process) {
            let row = document.createElement("tr");
            if (editing) {
                row.innerHTML = `<td><strong>${process.id}</strong></td>
                    <td><input class="question-edit-input" type="number" min="0" step="1" value="${process.arrival}"></td>
                    <td><input class="question-edit-input" type="number" min="1" step="1" value="${process.burst}"></td>`;
            } else {
                row.innerHTML = `<td>${process.id}</td><td>${process.arrival}</td><td>${process.burst}</td>`;
            }
            table.appendChild(row);
        });
    }

    processList.appendChild(table);
}
