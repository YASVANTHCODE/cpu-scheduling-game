// ==============================
// SJF
// ==============================

function calculateSJF() {

    if (selectedQuestionType === "type2") {
        return simulateType2Queue("SJF");
    }

    let currentTime = 0;
    let schedule = [];
    let remaining = [...processes];
    let inputOrderMap = getInputOrderMap(processes);

    while (remaining.length > 0) {
        let available = remaining.filter(function(process) {
            return process.arrival <= currentTime;
        });

        if (available.length === 0) {
            let nextProcess = remaining.reduce(function(a, b) {
                return a.arrival < b.arrival ? a : b;
            });
            if (currentTime < nextProcess.arrival) {
                schedule.push({ id: "IDLE", start: currentTime, end: nextProcess.arrival });
            }
            currentTime = nextProcess.arrival;
            continue;
        }

        let shortest = chooseShortest(available, "burst", "SJF", null, inputOrderMap);

        schedule.push({
            id: shortest.id,
            start: currentTime,
            end: currentTime + shortest.burst
        });

        currentTime += shortest.burst;
        remaining = remaining.filter(function(process) {
            return process.id !== shortest.id;
        });
    }

    return schedule;
}
