// ==============================
// APPLICATION STATE
// ==============================

// Current question selection
let selectedQuestionType = "type1";
let selectedQuestionNumber = 1;

// Current process data
let processes = [];

// Current calculated Gantt schedule
let currentSchedule = [];

// Current position in the interactive Gantt chart
let currentBlock = 0;

// Gantt replay state. Replay never changes currentBlock; it only reviews
// the portion of the chart that has already been solved.
let ganttReplayIndex = -1;
let ganttReplayActive = false;

// Currently selected algorithm
let currentAlgorithm = "";

// Round Robin quantum selected by the user. Defaults to the textbook/config value.
let currentRRQuantum = 2;

// Performance level state
let currentPerformance = null;
let performanceLevel = 0;


// Study-tool state
let ganttCompleted = false;
let performanceStarted = false;


// Question editing state
let questionEditMode = false;
let questionEditBackup = null;
let editedQuestionData = {};

// Game Mode / scoring state
let gameModeEnabled = false;
let scoreState = {
    gantt: 0,
    levels: [0, 0, 0, 0, 0],
    total: 0,
    earnedKeys: {}
};
