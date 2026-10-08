// ==============================
// APPLICATION STARTUP
// ==============================

initializeYouTubePlayer();


// Start Practice

let startButton =
    document.getElementById("start-button");

startButton.addEventListener("click", function() {

    startPractice();

});


// Question Type Buttons

let questionTypeButtons =
    document.querySelectorAll(
        ".question-type-button"
    );

questionTypeButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        selectQuestionType(
            button.dataset.questionType
        );

    });

});


// Question Buttons

let questionButtons =
    document.querySelectorAll(
        ".question-button"
    );

questionButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        selectQuestion(
            Number(button.dataset.question)
        );

    });

});


// Random Question

let randomQuestionButton =
    document.getElementById("random-question-button");

randomQuestionButton.addEventListener("click", function() {

    selectRandomQuestion();

});


let editQuestionButton = document.getElementById("edit-question-button");
let saveQuestionButton = document.getElementById("save-question-button");
let cancelQuestionButton = document.getElementById("cancel-question-button");

if (editQuestionButton) editQuestionButton.addEventListener("click", beginQuestionEdit);
if (saveQuestionButton) saveQuestionButton.addEventListener("click", saveQuestionEdit);
if (cancelQuestionButton) cancelQuestionButton.addEventListener("click", cancelQuestionEdit);

let gameModeToggle = document.getElementById("game-mode-toggle");
if (gameModeToggle) {
    gameModeToggle.addEventListener("change", function() {
        gameModeEnabled = gameModeToggle.checked;
        if (gameModeEnabled && ganttCompleted) awardGanttScore();
        refreshStudyTools();
    });
}

let retryButton = document.getElementById("retry-button");
let homeButton = document.getElementById("home-button");
if (retryButton) retryButton.addEventListener("click", retrySameQuestion);
if (homeButton) homeButton.addEventListener("click", goHome);


function showRoundRobinQuantumControl() {
    removeRoundRobinQuantumControl();

    let gameArea = document.getElementById("game-area");
    if (!gameArea) return;

    let control = document.createElement("div");
    control.id = "rr-quantum-control";
    control.className = "rr-quantum-control";
    control.innerHTML = `
        <span class="rr-quantum-control-label">Round Robin Quantum</span>
        <input id="rr-quantum-input" class="rr-quantum-input" type="number" min="1" max="50" step="1" value="${currentRRQuantum}">
        <span class="rr-quantum-control-unit">CPU units</span>
    `;

    let timelineHeading = gameArea.querySelector("h3");
    gameArea.insertBefore(control, timelineHeading);

    let input = control.querySelector("#rr-quantum-input");
    input.addEventListener("change", function() {
        let value = parseInt(input.value, 10);

        if (!Number.isFinite(value) || value < 1) {
            input.value = currentRRQuantum;
            return;
        }

        value = Math.min(50, value);
        currentRRQuantum = value;
        getMethodConfig("RR").quantum = value;
        input.value = value;

        // Changing the quantum changes the schedule, so restart the RR attempt.
        currentSchedule = calculateRR();
        currentBlock = 0;
        currentPerformance = null;
        performanceLevel = 0;
        ganttCompleted = false;
        performanceStarted = false;

        createEmptyGanttChart(currentSchedule);
        createProcessButtons();
        refreshStudyTools();
    });
}

function removeRoundRobinQuantumControl() {
    let control = document.getElementById("rr-quantum-control");
    if (control) control.remove();
}


// Algorithm Selection

let algorithmButtons =
    document.querySelectorAll(".algorithm-button");

algorithmButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        if (processes.length === 0) {
            return;
        }

        let algorithm =
            button.dataset.algorithm;

        currentAlgorithm = algorithm;

        if (algorithm !== "RR") {
            removeRoundRobinQuantumControl();
        }

        showYouTubePlayer(algorithm);
        currentPerformance = null;
        performanceLevel = 0;
        ganttCompleted = false;
        performanceStarted = false;
        refreshStudyTools();

        console.log(
            "Selected Algorithm:",
            algorithm
        );


        if (algorithm === "FCFS") {

            currentSchedule =
                calculateFCFS();

            currentBlock = 0;

            createEmptyGanttChart(
                currentSchedule
            );

            createProcessButtons();
        }


        if (algorithm === "SJF") {

            currentSchedule =
                calculateSJF();

            currentBlock = 0;

            createEmptyGanttChart(
                currentSchedule
            );

            createProcessButtons();
        }


        if (algorithm === "SRTF") {

            currentSchedule =
                calculateSRTF();

            currentBlock = 0;

            createEmptyGanttChart(
                currentSchedule
            );

            createProcessButtons();
        }


        if (algorithm === "RR") {

            currentRRQuantum = getMethodConfig("RR").quantum;
            showRoundRobinQuantumControl();

            currentSchedule =
                calculateRR();

            currentBlock = 0;

            createEmptyGanttChart(
                currentSchedule
            );

            createProcessButtons();
        }

    });

});
