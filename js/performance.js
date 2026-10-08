// ==============================
// PERFORMANCE CALCULATION
// ==============================

function calculatePerformance(schedule) {

    let results = [];

    for (let process of processes) {

        let executionBlocks = schedule.filter(function(block) {
            return block.id === process.id;
        });

        let completionTime =
            executionBlocks[executionBlocks.length - 1].end;

        let turnaroundTime =
            completionTime - process.arrival;

        let totalCpuTime = selectedQuestionType === "type2"
            ? process.burst1 + process.burst2
            : process.burst;

        let waitingTime =
            turnaroundTime - totalCpuTime;

        let responseTime =
            executionBlocks[0].start - process.arrival;

        results.push({
            id: process.id,
            completionTime: completionTime,
            turnaroundTime: turnaroundTime,
            waitingTime: waitingTime,
            responseTime: responseTime
        });
    }

    let totalWaiting = 0;
    let totalTurnaround = 0;
    let totalResponse = 0;

    for (let result of results) {

        totalWaiting += result.waitingTime;
        totalTurnaround += result.turnaroundTime;
        totalResponse += result.responseTime;
    }

    let count = results.length;

    return {
        processes: results,
        averageWaitingTime: totalWaiting / count,
        averageTurnaroundTime: totalTurnaround / count,
        averageResponseTime: totalResponse / count
    };
}
