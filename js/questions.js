// ==============================
// QUESTION SYSTEM
// ==============================

let questionData = {

    type1: {

        1: [
            { id: "P1", arrival: 0, burst: 8 },
            { id: "P2", arrival: 2, burst: 2 },
            { id: "P3", arrival: 4, burst: 3 },
            { id: "P4", arrival: 6, burst: 2 }
        ],

        2: [
            { id: "P1", arrival: 0, burst: 5 },
            { id: "P2", arrival: 1, burst: 3 },
            { id: "P3", arrival: 2, burst: 8 },
            { id: "P4", arrival: 4, burst: 2 }
        ],

        3: [
            { id: "P1", arrival: 0, burst: 7 },
            { id: "P2", arrival: 2, burst: 4 },
            { id: "P3", arrival: 3, burst: 1 },
            { id: "P4", arrival: 5, burst: 3 }
        ]
    },

    type2: {
        // Q1 is based on the Type 2 question supplied from the CIA 1 scheme.
        1: [
            { id: "P1", arrival: 0, burst1: 3, io: 2, burst2: 2 },
            { id: "P2", arrival: 0, burst1: 2, io: 4, burst2: 1 },
            { id: "P3", arrival: 2, burst1: 1, io: 3, burst2: 2 },
            { id: "P4", arrival: 5, burst1: 2, io: 2, burst2: 1 }
        ],

        // Q2 and Q3 are project questions created for Type 2 testing.
        2: [
            { id: "P1", arrival: 0, burst1: 4, io: 2, burst2: 3 },
            { id: "P2", arrival: 1, burst1: 2, io: 3, burst2: 2 },
            { id: "P3", arrival: 2, burst1: 3, io: 2, burst2: 1 },
            { id: "P4", arrival: 4, burst1: 1, io: 2, burst2: 3 }
        ],

        3: [
            { id: "P1", arrival: 0, burst1: 2, io: 3, burst2: 4 },
            { id: "P2", arrival: 0, burst1: 4, io: 2, burst2: 1 },
            { id: "P3", arrival: 3, burst1: 1, io: 2, burst2: 3 },
            { id: "P4", arrival: 5, burst1: 3, io: 1, burst2: 2 }
        ]
    }
};


// ==============================
// RANDOM QUESTION GENERATOR
// ==============================

function randomNumber(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


function generateRandomType1Question() {

    let randomProcesses = [];
    let cumulativeBurst = 0;

    for (let i = 1; i <= 4; i++) {
        let burst = randomNumber(1, 10);
        let arrival;

        if (i === 1) {
            arrival = 0;
        } else {
            // Keep every arrival inside the CPU work already available.
            // This guarantees that the generated question does not create
            // an artificial CPU-idle gap before the next process arrives.
            let latestSafeArrival = Math.min(10, cumulativeBurst);
            arrival = randomNumber(0, latestSafeArrival);
        }

        randomProcesses.push({
            id: "P" + i,
            arrival: arrival,
            burst: burst
        });

        cumulativeBurst += burst;
    }

    // Randomize process labels without breaking the no-idle guarantee.
    randomProcesses.sort(function(a, b) {
        if (a.arrival !== b.arrival) return a.arrival - b.arrival;
        return a.id.localeCompare(b.id);
    });

    randomProcesses.forEach(function(process, index) {
        process.id = "P" + (index + 1);
    });

    return randomProcesses;
}

function selectRandomQuestion() {

    if (questionEditMode) return;

    if (selectedQuestionType !== "type1") {

        loadSelectedQuestion();

        return;
    }

    processes = generateRandomType1Question();

    selectedQuestionNumber = null;
    editedQuestionData[getQuestionStorageKey()] = cloneProcesses(processes);

    currentSchedule = [];
    currentBlock = 0;
    currentAlgorithm = "";

    displayProcesses();

    showEmptyTimelineMessage();

    let processButtons =
        document.getElementById("process-buttons");

    if (processButtons) {
        processButtons.remove();
    }

    let feedback =
        document.getElementById("feedback");

    if (feedback) {
        feedback.remove();
    }

    console.log("Random Question Generated:", processes);
}


// ==============================
// QUESTION EDITING HELPERS
// ==============================

function cloneProcesses(list) {
    return (list || []).map(function(process) {
        return Object.assign({}, process);
    });
}

function getQuestionStorageKey() {
    return selectedQuestionType + "_" + (selectedQuestionNumber === null ? "random" : selectedQuestionNumber);
}

function getConfiguredQuestionData() {
    let key = getQuestionStorageKey();
    if (editedQuestionData[key]) {
        return cloneProcesses(editedQuestionData[key]);
    }
    if (selectedQuestionNumber === null) return null;
    return questionData[selectedQuestionType][selectedQuestionNumber] || null;
}

function resetGameAfterQuestionChange() {
    currentSchedule = [];
    currentBlock = 0;
    currentAlgorithm = "";
    currentPerformance = null;
    performanceLevel = 0;
    ganttCompleted = false;
    performanceStarted = false;
    scoreState = { gantt: 0, levels: [0, 0, 0, 0, 0], total: 0, earnedKeys: {} };

    let timeline = document.getElementById("timeline");
    if (timeline) timeline.innerHTML = "";

    let processButtons = document.getElementById("process-buttons");
    if (processButtons) processButtons.remove();

    let feedback = document.getElementById("feedback");
    if (feedback) feedback.remove();

    let completionPanel = document.getElementById("completion-panel");
    if (completionPanel) completionPanel.remove();

    let performanceContainer = document.getElementById("performance-level-container");
    if (performanceContainer) performanceContainer.remove();

    refreshStudyTools();
}

function setQuestionEditMessage(message, type) {
    let box = document.getElementById("process-edit-message");
    if (!box) return;

    box.textContent = message || "";
    box.classList.remove("edit-message-info", "edit-message-error", "edit-message-success");

    if (type) {
        box.classList.add("edit-message-" + type);
    }
}

function beginQuestionEdit() {
    if (questionEditMode || !processes.length) return;

    questionEditMode = true;
    questionEditBackup = cloneProcesses(processes);

    document.querySelectorAll(".question-type-button, .question-button, #random-question-button, .algorithm-button").forEach(function(button) {
        button.disabled = true;
    });

    let editButton = document.getElementById("edit-question-button");
    if (editButton) editButton.disabled = true;

    displayProcesses();
    setQuestionEditMessage("Edit the process values, then hit OK to proceed (some values may create an error. If so, refresh the page and try different values.)", "info");

    let actions = document.getElementById("process-edit-actions");
    if (actions) actions.style.display = "flex";
}

function cancelQuestionEdit() {
    if (!questionEditMode) return;

    processes = cloneProcesses(questionEditBackup);
    questionEditMode = false;
    questionEditBackup = null;

    document.querySelectorAll(".question-type-button, .question-button, #random-question-button, .algorithm-button").forEach(function(button) {
        button.disabled = false;
    });

    let editButton = document.getElementById("edit-question-button");
    if (editButton) editButton.disabled = false;

    let actions = document.getElementById("process-edit-actions");
    if (actions) actions.style.display = "none";

    displayProcesses();
    setQuestionEditMessage("", "");
}

function saveQuestionEdit() {
    if (!questionEditMode) return;

    let inputs = Array.from(document.querySelectorAll("#process-list input.question-edit-input"));
    let expectedCount = processes.length * (selectedQuestionType === "type2" ? 4 : 2);
    let updated = [];
    let valid = inputs.length === expectedCount;
    let inputValues = [];

    if (valid) {
        inputs.forEach(function(input) {
            let raw = String(input.value || "").trim();
            let value = raw === "" ? NaN : Number(raw);

            if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
                valid = false;
            }

            if (!input.checkValidity()) {
                valid = false;
            }

            inputValues.push(value);
        });
    }

    if (valid) {
        let fieldsPerProcess = selectedQuestionType === "type2" ? 4 : 2;

        for (let index = 0; index < questionEditBackup.length; index++) {
            let process = questionEditBackup[index];
            let offset = index * fieldsPerProcess;
            let values = inputValues.slice(offset, offset + fieldsPerProcess);

            if (selectedQuestionType === "type2") {
                if (values[1] < 1 || values[2] < 0 || values[3] < 1) {
                    valid = false;
                    break;
                }

                updated.push({
                    id: process.id,
                    arrival: values[0],
                    burst1: values[1],
                    io: values[2],
                    burst2: values[3]
                });
            } else {
                if (values[1] < 1) {
                    valid = false;
                    break;
                }

                updated.push({
                    id: process.id,
                    arrival: values[0],
                    burst: values[1]
                });
            }
        }
    }

    if (!valid || updated.length !== questionEditBackup.length) {
        setQuestionEditMessage("Please enter valid non-negative integer values. CPU bursts must be at least 1.", "error");
        return;
    }

    let previousAlgorithm = currentAlgorithm;

    // Save the edited question first. If the selected algorithm cannot
    // produce a valid schedule, the edited values are still retained and
    // the user is asked to try different values.
    processes = cloneProcesses(updated);
    editedQuestionData[getQuestionStorageKey()] = cloneProcesses(updated);

    questionEditMode = false;
    questionEditBackup = null;

    document.querySelectorAll(".question-type-button, .question-button, #random-question-button, .algorithm-button").forEach(function(button) {
        button.disabled = false;
    });

    let editButton = document.getElementById("edit-question-button");
    if (editButton) editButton.disabled = false;

    let actions = document.getElementById("process-edit-actions");
    if (actions) actions.style.display = "none";

    try {
        recalculateCurrentQuestion();

        if (previousAlgorithm && (!currentSchedule.length || currentSchedule.some(function(block) {
            return !Number.isFinite(block.start) || !Number.isFinite(block.end) || block.end <= block.start;
        }))) {
            throw new Error("The selected values could not produce a valid Gantt schedule.");
        }

        setQuestionEditMessage("", "");
    } catch (error) {
        currentSchedule = [];
        currentBlock = 0;
        ganttCompleted = false;
        performanceStarted = false;
        currentPerformance = null;
        performanceLevel = 0;
        ganttReplayIndex = -1;
        ganttReplayActive = false;

        let timeline = document.getElementById("timeline");
        if (timeline) {
            timeline.innerHTML = '<p class="edit-schedule-error">Try different values to proceed. The edited question was saved, but a Gantt chart could not be prepared for these values.</p>';
        }

        let processButtons = document.getElementById("process-buttons");
        if (processButtons) processButtons.remove();

        setQuestionEditMessage(
            "Try different values to proceed. The edited question was saved, but a Gantt chart could not be prepared.",
            "error"
        );
        console.error("Edited question scheduling error:", error);
    }
}

function recalculateCurrentQuestion() {
    let algorithmBeforeReset = currentAlgorithm;
    resetGameAfterQuestionChange();
    currentAlgorithm = algorithmBeforeReset;
    displayProcesses();

    if (!currentAlgorithm) {
        refreshStudyTools();
        return;
    }

    if (currentAlgorithm === "RR") {
        currentRRQuantum = getMethodConfig("RR").quantum;
        if (typeof showRoundRobinQuantumControl === "function") showRoundRobinQuantumControl();
        currentSchedule = calculateRR();
    } else if (currentAlgorithm === "FCFS") {
        currentSchedule = calculateFCFS();
    } else if (currentAlgorithm === "SJF") {
        currentSchedule = calculateSJF();
    } else if (currentAlgorithm === "SRTF") {
        currentSchedule = calculateSRTF();
    }

    currentBlock = 0;
    createEmptyGanttChart(currentSchedule);
    createProcessButtons();
    refreshStudyTools();
}

// ==============================
// QUESTION GENERATION
// ==============================

function generateProcesses() {

    let selectedData = getConfiguredQuestionData();

    if (!selectedData) {

        processes = [];

        console.log(
            "Question not configured:",
            selectedQuestionType,
            selectedQuestionNumber
        );

        return false;
    }

    processes = selectedData.map(function(process) {

        if (selectedQuestionType === "type2") {
            return {
                id: process.id,
                arrival: process.arrival,
                burst1: process.burst1,
                io: process.io,
                burst2: process.burst2
            };
        }

        return {
            id: process.id,
            arrival: process.arrival,
            burst: process.burst
        };

    });

    console.log("Selected Question:", {
        type: selectedQuestionType,
        question: selectedQuestionNumber
    });

    console.log("Processes:", processes);

    return true;
}


// ==============================
// QUESTION TYPE SELECTION
// ==============================

function selectQuestionType(type) {

    if (questionEditMode) return;

    selectedQuestionType = type;

    selectedQuestionNumber = 1;

    updateQuestionTypeButtons();

    updateQuestionButtons();

    loadSelectedQuestion();
}


// ==============================
// QUESTION NUMBER SELECTION
// ==============================

function selectQuestion(number) {

    if (questionEditMode) return;

    selectedQuestionNumber = number;

    updateQuestionButtons();

    loadSelectedQuestion();
}


// ==============================
// UPDATE TYPE BUTTONS
// ==============================

function updateQuestionTypeButtons() {

    let buttons =
        document.querySelectorAll(".question-type-button");

    buttons.forEach(function(button) {

        button.classList.remove(
            "active-question-type"
        );

        if (
            button.dataset.questionType ===
            selectedQuestionType
        ) {

            button.classList.add(
                "active-question-type"
            );

        }

    });
}


// ==============================
// UPDATE QUESTION BUTTONS
// ==============================

function updateQuestionButtons() {

    let buttons =
        document.querySelectorAll(".question-button");

    buttons.forEach(function(button) {

        button.classList.remove(
            "selected-question"
        );

        if (
            Number(button.dataset.question) ===
            selectedQuestionNumber
        ) {

            button.classList.add(
                "selected-question"
            );

        }

    });
}


function showEmptyTimelineMessage() {
    let timeline = document.getElementById("timeline");
    if (!timeline) return;

    timeline.innerHTML = "";

    let message = document.createElement("div");
    message.className = "timeline-empty-message";
    message.innerHTML =
        'Select a scheduling algorithm above: <strong>FCFS, SJF, SRTF, or Round Robin</strong>.';

    timeline.appendChild(message);
}

// ==============================
// LOAD SELECTED QUESTION
// ==============================

function loadSelectedQuestion() {

    let loaded =
        generateProcesses();

    let algorithmArea =
        document.getElementById("algorithm-area");

    let processArea =
        document.getElementById("process-area");

    let gameArea =
        document.getElementById("game-area");

    let actionArea =
        document.getElementById("action-area");


    if (!loaded) {

        algorithmArea.style.display = "block";

        processArea.style.display = "block";

        gameArea.style.display = "block";

        actionArea.style.display = "block";

        document.getElementById("process-list").innerHTML =
            "<p>This question has not been configured yet.</p>";

        document.getElementById("timeline").innerHTML =
            "<p>Select a configured question to start the game.</p>";

        return;
    }


    algorithmArea.style.display = "block";

    processArea.style.display = "block";

    gameArea.style.display = "block";

    actionArea.style.display = "block";


    currentSchedule = [];

    currentBlock = 0;

    currentAlgorithm = "";

    displayProcesses();

    showEmptyTimelineMessage();

    let processButtons =
        document.getElementById("process-buttons");

    if (processButtons) {
        processButtons.remove();
    }

    let feedback =
        document.getElementById("feedback");

    if (feedback) {
        feedback.remove();
    }
}
