// ==============================
// NAVIGATION
// ==============================

function clearPracticeDynamicUI() {
    let timeline = document.getElementById("timeline");
    if (timeline) timeline.innerHTML = "";

    [
        "process-buttons",
        "feedback",
        "completion-panel",
        "performance-level-container",
        "rr-quantum-control"
    ].forEach(function(id) {
        let element = document.getElementById(id);
        if (element) element.remove();
    });

    if (typeof hideYouTubePlayer === "function") hideYouTubePlayer();
    if (typeof hideQuestionTool === "function") hideQuestionTool();
    if (typeof hideSolvingKit === "function") hideSolvingKit();
}

function startPractice() {
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("practice-screen").style.display = "block";

    selectedQuestionType = "type1";
    selectedQuestionNumber = 1;
    ganttCompleted = false;
    performanceStarted = false;
    questionEditMode = false;
    questionEditBackup = null;
    currentSchedule = [];
    currentBlock = 0;
    currentAlgorithm = "";
    currentPerformance = null;
    performanceLevel = 0;
    ganttReplayIndex = -1;
    ganttReplayActive = false;
    resetScoreState();
    clearPracticeDynamicUI();

    // A new Start Practice session is always clean.
    gameModeEnabled = false;
    let gameToggle = document.getElementById("game-mode-toggle");
    if (gameToggle) gameToggle.checked = false;

    updateQuestionTypeButtons();
    updateQuestionButtons();
    loadSelectedQuestion();
    refreshStudyTools();
}


function retrySameQuestion() {
    let home = document.getElementById("home-screen");
    let practice = document.getElementById("practice-screen");
    let results = document.getElementById("results-screen");

    if (results) results.style.display = "none";
    if (home) home.style.display = "none";
    if (practice) practice.style.display = "block";

    questionEditMode = false;
    questionEditBackup = null;
    ganttCompleted = false;
    performanceStarted = false;
    currentSchedule = [];
    currentBlock = 0;
    currentAlgorithm = "";
    currentPerformance = null;
    performanceLevel = 0;
    ganttReplayIndex = -1;
    ganttReplayActive = false;
    resetScoreState();
    clearPracticeDynamicUI();

    updateQuestionTypeButtons();
    updateQuestionButtons();
    loadSelectedQuestion();
    refreshStudyTools();
}


function goHome() {
    let home = document.getElementById("home-screen");
    let practice = document.getElementById("practice-screen");
    let results = document.getElementById("results-screen");

    if (practice) practice.style.display = "none";
    if (results) results.style.display = "none";
    if (home) home.style.display = "block";

    questionEditMode = false;
    questionEditBackup = null;
    processes = [];
    editedQuestionData = {};
    selectedQuestionType = "type1";
    selectedQuestionNumber = 1;
    currentSchedule = [];
    currentBlock = 0;
    currentAlgorithm = "";
    currentPerformance = null;
    performanceLevel = 0;
    ganttCompleted = false;
    performanceStarted = false;
    ganttReplayIndex = -1;
    ganttReplayActive = false;
    resetScoreState();
    gameModeEnabled = false;

    let gameToggle = document.getElementById("game-mode-toggle");
    if (gameToggle) gameToggle.checked = false;

    clearPracticeDynamicUI();
    refreshStudyTools();
}

