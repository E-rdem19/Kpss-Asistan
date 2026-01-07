// Performance Engine Calculations

/**
 * Calculate accuracy percentage for a set of sessions
 * @param {Array} sessions - Array of question session objects
 * @returns {number} - Accuracy percentage (0-100)
 */
export function calculateAccuracy(sessions) {
    if (!sessions || sessions.length === 0) return 0

    const totals = sessions.reduce(
        (acc, session) => ({
            correct: acc.correct + (session.correct || 0),
            total: acc.total + (session.solved || 0),
        }),
        { correct: 0, total: 0 }
    )

    return totals.total > 0 ? (totals.correct / totals.total) * 100 : 0
}

/**
 * Calculate accuracy per topic
 * @param {Array} sessions - Array of question session objects
 * @returns {Object} - Object with topic names as keys and accuracy percentages as values
 */
export function calculateAccuracyPerTopic(sessions) {
    if (!sessions || sessions.length === 0) return {}

    const topicStats = {}

    sessions.forEach(session => {
        const key = `${session.subject} - ${session.topic}`

        if (!topicStats[key]) {
            topicStats[key] = {
                subject: session.subject,
                topic: session.topic,
                correct: 0,
                total: 0,
            }
        }

        topicStats[key].correct += session.correct || 0
        topicStats[key].total += session.solved || 0
    })

    // Calculate percentages
    const result = {}
    Object.keys(topicStats).forEach(key => {
        const stats = topicStats[key]
        result[key] = {
            ...stats,
            accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        }
    })

    return result
}

/**
 * Detect weak topics (accuracy < 70%)
 * @param {Array} sessions - Array of question session objects
 * @returns {Array} - Array of weak topic objects with subject, topic, and accuracy
 */
export function detectWeakTopics(sessions) {
    const topicAccuracies = calculateAccuracyPerTopic(sessions)

    return Object.values(topicAccuracies)
        .filter(topic => topic.accuracy < 70 && topic.total >= 10) // At least 10 questions attempted
        .sort((a, b) => a.accuracy - b.accuracy) // Weakest first
}

/**
 * Calculate daily solved questions count
 * @param {Array} sessions - Array of question session objects
 * @param {Date} date - Date to calculate for (defaults to today)
 * @returns {number} - Total questions solved on that day
 */
export function calculateDailySolved(sessions, date = new Date()) {
    if (!sessions || sessions.length === 0) return 0

    const targetDate = new Date(date).toISOString().split('T')[0]

    return sessions
        .filter(session => {
            const sessionDate = new Date(session.created_at).toISOString().split('T')[0]
            return sessionDate === targetDate
        })
        .reduce((sum, session) => sum + (session.solved || 0), 0)
}

/**
 * Calculate weekly solved questions count
 * @param {Array} sessions - Array of question session objects
 * @param {Date} weekStart - Start of the week (defaults to current week)
 * @returns {number} - Total questions solved this week
 */
export function calculateWeeklySolved(sessions, weekStart) {
    if (!sessions || sessions.length === 0) return 0

    const start = weekStart || getWeekStart(new Date())
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    return sessions
        .filter(session => {
            const sessionDate = new Date(session.created_at)
            return sessionDate >= start && sessionDate < end
        })
        .reduce((sum, session) => sum + (session.solved || 0), 0)
}

/**
 * Get the start of the current week (Monday)
 * @param {Date} date - Reference date
 * @returns {Date} - Start of the week
 */
function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
}

/**
 * Calculate exam readiness score (0-100)
 * Based on: total questions solved, overall accuracy, and weak topic count
 * @param {Array} sessions - Array of question session objects
 * @param {number} targetScore - User's target exam score
 * @returns {number} - Readiness percentage (0-100)
 */
export function calculateReadinessScore(sessions, targetScore = 80) {
    if (!sessions || sessions.length === 0) return 0

    // Total questions solved (weight: 40%)
    const totalSolved = sessions.reduce((sum, s) => sum + (s.solved || 0), 0)
    const solvedScore = Math.min((totalSolved / 1000) * 100, 100) // 1000 questions = 100%

    // Overall accuracy (weight: 40%)
    const accuracy = calculateAccuracy(sessions)
    const accuracyScore = (accuracy / targetScore) * 100

    // Weak topics penalty (weight: 20%)
    const weakTopics = detectWeakTopics(sessions)
    const weakTopicsScore = Math.max(100 - (weakTopics.length * 10), 0)

    // Weighted average
    const readiness = (
        solvedScore * 0.4 +
        accuracyScore * 0.4 +
        weakTopicsScore * 0.2
    )

    return Math.min(Math.round(readiness), 100)
}

/**
 * Get statistics for a specific time period
 * @param {Array} sessions - Array of question session objects
 * @param {number} days - Number of days to look back
 * @returns {Object} - Statistics object
 */
export function getStatistics(sessions, days = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentSessions = sessions.filter(
        s => new Date(s.created_at) >= cutoffDate
    )

    const totalSolved = recentSessions.reduce((sum, s) => sum + (s.solved || 0), 0)
    const totalCorrect = recentSessions.reduce((sum, s) => sum + (s.correct || 0), 0)
    const totalIncorrect = recentSessions.reduce((sum, s) => sum + (s.incorrect || 0), 0)
    const totalBlank = recentSessions.reduce((sum, s) => sum + (s.blank || 0), 0)

    return {
        period: `${days} days`,
        totalSolved,
        totalCorrect,
        totalIncorrect,
        totalBlank,
        accuracy: totalSolved > 0 ? (totalCorrect / totalSolved) * 100 : 0,
        sessionCount: recentSessions.length,
    }
}

// ==============================================
// TIMER CALCULATIONS
// ==============================================

/**
 * Calculate total study time for a given date
 * @param {Array} timers - Array of timer objects
 * @param {Date} date - Date to calculate for (defaults to today)
 * @returns {number} - Total study time in minutes
 */
export function calculateTotalStudyTime(timers, date = new Date()) {
    if (!timers || timers.length === 0) return 0

    const targetDate = new Date(date).toISOString().split('T')[0]

    return timers
        .filter(timer => {
            const timerDate = new Date(timer.created_at).toISOString().split('T')[0]
            return timerDate === targetDate && timer.status === 'stopped'
        })
        .reduce((sum, timer) => sum + Math.floor((timer.duration_seconds || 0) / 60), 0)
}

/**
 * Calculate average question solving speed
 * @param {Array} sessions - Array of question session objects with duration_minutes
 * @returns {number} - Average questions per minute (0 if no data)
 */
export function calculateAverageSpeed(sessions) {
    if (!sessions || sessions.length === 0) return 0

    // Filter sessions that have both questions solved and duration
    const sessionsWithTime = sessions.filter(
        s => (s.solved || 0) > 0 && (s.duration_minutes || 0) > 0
    )

    if (sessionsWithTime.length === 0) return 0

    const totalQuestions = sessionsWithTime.reduce((sum, s) => sum + s.solved, 0)
    const totalMinutes = sessionsWithTime.reduce((sum, s) => sum + s.duration_minutes, 0)

    return totalMinutes > 0 ? totalQuestions / totalMinutes : 0
}

/**
 * Format seconds to HH:MM:SS display
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time string
 */
export function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ==============================================
// MOCK EXAM CALCULATIONS
// ==============================================

/**
 * Calculate net score for KPSS exam
 * @param {number} correct - Number of correct answers
 * @param {number} wrong - Number of wrong answers
 * @returns {number} - Net score (correct - wrong/4)
 */
export function calculateNetScore(correct, wrong) {
    return parseFloat((correct - (wrong / 4)).toFixed(2))
}

/**
 * Calculate mock exam progress (trend analysis)
 * @param {Array} mockExams - Array of mock exam objects sorted by date
 * @returns {Object} - Progress analysis object
 */
export function calculateMockExamProgress(mockExams) {
    if (!mockExams || mockExams.length === 0) {
        return {
            trend: 'no_data',
            improvement: 0,
            average: 0,
            latest: 0,
            count: 0
        }
    }

    // Sort by date ascending
    const sorted = [...mockExams].sort((a, b) =>
        new Date(a.exam_date) - new Date(b.exam_date)
    )

    const scores = sorted.map(exam => exam.total_net_score)
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const latest = scores[scores.length - 1]

    // Calculate trend
    let trend = 'stable'
    let improvement = 0

    if (scores.length >= 2) {
        const first = scores[0]
        const last = scores[scores.length - 1]
        improvement = ((last - first) / first) * 100

        if (improvement > 5) trend = 'improving'
        else if (improvement < -5) trend = 'declining'
    }

    return {
        trend,
        improvement: parseFloat(improvement.toFixed(2)),
        average: parseFloat(average.toFixed(2)),
        latest,
        count: mockExams.length
    }
}

/**
 * Update readiness score to include mock exam performance
 * @param {Array} sessions - Array of question session objects
 * @param {Array} mockExams - Array of mock exam objects
 * @param {number} targetScore - User's target exam score
 * @returns {number} - Updated readiness percentage (0-100)
 */
export function calculateReadinessScoreWithMockExams(sessions, mockExams, targetScore = 80) {
    // Base readiness from question sessions (70% weight)
    const baseReadiness = calculateReadinessScore(sessions, targetScore)

    // Mock exam contribution (30% weight)
    let mockExamScore = 0
    if (mockExams && mockExams.length > 0) {
        const progress = calculateMockExamProgress(mockExams)

        // Score based on latest performance and trend
        const performanceScore = Math.min((progress.latest / targetScore) * 100, 100)
        const trendBonus = progress.trend === 'improving' ? 10 :
            progress.trend === 'declining' ? -10 : 0

        mockExamScore = Math.min(Math.max(performanceScore + trendBonus, 0), 100)
    }

    // Weighted combination
    const finalReadiness = (baseReadiness * 0.7) + (mockExamScore * 0.3)

    return Math.min(Math.round(finalReadiness), 100)
}
