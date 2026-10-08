// ==============================
// FCFS
// ==============================

function calculateFCFS() {

    if (selectedQuestionType === "type2") {
        return calculateType2FCFS();
    }

    let currentTime = 0;
    let schedule = [];

    let inputOrderMap = getInputOrderMap(processes);
    let config = getMethodConfig("FCFS");

    let sortedProcesses = [...processes].sort(function(a, b) {
        if (config.tieRule === "arrival-then-id") {
            return compareByArrivalThenId(a, b);
        }
        if (config.tieRule === "input-order") {
            return compareByArrivalThenInput(a, b, inputOrderMap);
        }
        return compareByArrivalThenInput(a, b, inputOrderMap);
    });

    for (let process of sortedProcesses) {
        if (currentTime < process.arrival) {
            schedule.push({ id: "IDLE", start: currentTime, end: process.arrival });
            currentTime = process.arrival;
        }

        schedule.push({
            id: process.id,
            start: currentTime,
            end: currentTime + process.burst
        });

        currentTime += process.burst;
    }

    return schedule;
}

function calculateType2FCFS() {
    return simulateType2Queue("FCFS");
}
