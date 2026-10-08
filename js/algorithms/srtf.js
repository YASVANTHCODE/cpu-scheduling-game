// ==============================
// SRTF
// ==============================

function calculateSRTF() {

    if (selectedQuestionType === "type2") {
        return simulateType2SRTF();
    }

    let currentTime = 0;
    let schedule = [];

    let inputOrderMap = getInputOrderMap(processes);

    let remaining = processes.map(function(process) {
        return {
            id: process.id,
            arrival: process.arrival,
            remaining: process.burst
        };
    });

    let completed = 0;

    while (completed < processes.length) {
        let available = remaining.filter(function(process) {
            return process.arrival <= currentTime && process.remaining > 0;
        });

        if (available.length === 0) {
            let nextArrival = Math.min(...remaining.filter(p => p.remaining > 0).map(p => p.arrival));
            if (currentTime < nextArrival) {
                schedule.push({ id: "IDLE", start: currentTime, end: nextArrival });
            }
            currentTime = nextArrival;
            continue;
        }

        let shortest = chooseShortest(available, "remaining", "SRTF", null, inputOrderMap);

        let lastBlock = schedule[schedule.length - 1];
        if (lastBlock && lastBlock.id === shortest.id && lastBlock.end === currentTime) {
            lastBlock.end++;
        } else {
            schedule.push({ id: shortest.id, start: currentTime, end: currentTime + 1 });
        }

        shortest.remaining--;
        currentTime++;

        if (shortest.remaining === 0) {
            completed++;
        }
    }

    return schedule;
}

function simulateType2SRTF() {
    return simulateType2Queue("SRTF");
}
