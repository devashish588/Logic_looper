/**
 * Shared helper: recompute aggregate UserStats from all DailyScore rows.
 * Called after any DailyScore write to keep UserStats in sync.
 */

/**
 * Compute current and longest streak from a sorted array of date strings.
 */
function computeStreaks(sortedDates) {
    if (!sortedDates.length) return { currentStreak: 0, longestStreak: 0, lastSolveDate: null };

    const today = new Date().toISOString().slice(0, 10);
    let currentStreak = 0;
    let longestStreak = 1;
    let runLength = 1;

    // Longest streak: walk forward through sorted dates
    for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffMs = curr.getTime() - prev.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            runLength++;
            longestStreak = Math.max(longestStreak, runLength);
        } else if (diffDays > 1) {
            runLength = 1;
        }
        // diffDays === 0 → duplicate, ignore
    }

    // Current streak: walk backward from today (or yesterday)
    const dateSet = new Set(sortedDates);
    let checkDate = new Date(today);

    // If today is not solved, start from yesterday
    if (!dateSet.has(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (dateSet.has(checkDate.toISOString().slice(0, 10))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return {
        currentStreak,
        longestStreak,
        lastSolveDate: sortedDates[sortedDates.length - 1],
    };
}

/**
 * Recompute all aggregate fields in UserStats from the full set of DailyScore rows.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 */
export async function recomputeUserStats(prisma, userId) {
    const allScores = await prisma.dailyScore.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
    });

    if (allScores.length === 0) return;

    const totalSolved = allScores.length;
    const totalPoints = allScores.reduce((sum, s) => sum + s.points, 0);
    const totalTime = allScores.reduce((sum, s) => sum + s.timeSeconds, 0);
    const averageTime = Math.round(totalTime / totalSolved);
    const fastestSolve = Math.min(...allScores.map((s) => s.timeSeconds));
    const solvedTypes = [...new Set(allScores.map((s) => s.puzzleType))];
    const sortedDates = [...new Set(allScores.map((s) => s.date))].sort();

    const { currentStreak, longestStreak, lastSolveDate } = computeStreaks(sortedDates);

    await prisma.userStats.upsert({
        where: { userId },
        create: {
            userId,
            totalSolved,
            totalPoints,
            averageTime,
            fastestSolve,
            solvedTypes,
            currentStreak,
            longestStreak,
            lastSolveDate,
        },
        update: {
            totalSolved,
            totalPoints,
            averageTime,
            fastestSolve,
            solvedTypes,
            currentStreak,
            longestStreak,
            lastSolveDate,
        },
    });
}
