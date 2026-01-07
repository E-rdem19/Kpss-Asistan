// Adaptive Study Planner
import { detectWeakTopics } from './calculations.js'

/**
 * Generate a study plan for the next day based on user profile and performance
 * @param {Object} profile - User profile with daily_study_minutes, weekly_study_days, etc.
 * @param {Array} sessions - Historical question sessions
 * @param {Date} targetDate - Date to generate plan for (defaults to tomorrow)
 * @returns {Array} - Array of time block objects
 */
export function generateDailyPlan(profile, sessions, targetDate) {
    const date = targetDate || getTomorrow()
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })

    // Check if user studies on this day
    if (!profile.weekly_study_days.includes(dayName)) {
        return []
    }

    const timeBlocks = []
    const weakTopics = detectWeakTopics(sessions)

    // Default subjects for KPSS (can be customized based on exam_type)
    const subjects = [
        { name: 'Türkçe', topics: ['Sözcük Bilgisi', 'Cümle Bilgisi', 'Anlam Bilgisi', 'Parça Yorumu'] },
        { name: 'Tarih', topics: ['Osmanlı Dönemi', 'Cumhuriyet Dönemi', 'Türk Devrimi'] },
        { name: 'Coğrafya', topics: ['Fiziki Coğrafya', 'Beşeri Coğrafya', 'Türkiye Coğrafyası'] },
        { name: 'Vatandaşlık', topics: ['Anayasa', 'İnsan Hakları', 'Atatürk İlkeleri'] },
        { name: 'Matematik', topics: ['Temel Kavramlar', 'Problemler', 'Geometri'] },
    ]

    // Calculate session duration (user's daily minutes divided into blocks)
    const totalMinutes = profile.daily_study_minutes
    const sessionDuration = 60 // 60-minute blocks
    const breakDuration = 15
    const numSessions = Math.floor(totalMinutes / (sessionDuration + breakDuration))

    // Prioritize weak topics
    const prioritizedTopics = []

    // Add weak topics first (50% of time)
    const weakTopicSlots = Math.ceil(numSessions * 0.5)
    weakTopics.slice(0, weakTopicSlots).forEach(weak => {
        prioritizedTopics.push({
            subject: weak.subject,
            topic: weak.topic,
            isRevision: true,
        })
    })

    // Fill remaining slots with regular topics
    const regularSlots = numSessions - prioritizedTopics.length
    let subjectIndex = 0
    for (let i = 0; i < regularSlots; i++) {
        const subject = subjects[subjectIndex % subjects.length]
        const topicIndex = Math.floor(Math.random() * subject.topics.length)
        prioritizedTopics.push({
            subject: subject.name,
            topic: subject.topics[topicIndex],
            isRevision: false,
        })
        subjectIndex++
    }

    // Create time blocks starting at 9:00 AM by default
    let currentTime = new Date(date)
    currentTime.setHours(9, 0, 0, 0)

    prioritizedTopics.forEach((item, index) => {
        const startTime = new Date(currentTime)
        const endTime = new Date(currentTime)
        endTime.setMinutes(endTime.getMinutes() + sessionDuration)

        timeBlocks.push({
            date: date.toISOString().split('T')[0],
            start_time: formatTime(startTime),
            end_time: formatTime(endTime),
            subject: item.subject,
            topic: item.topic,
            target_questions: item.isRevision ? 30 : 50, // Fewer questions for revision
            status: 'pending',
        })

        // Add break time before next session
        currentTime = new Date(endTime)
        currentTime.setMinutes(currentTime.getMinutes() + breakDuration)
    })

    return timeBlocks
}

/**
 * Get tomorrow's date
 * @returns {Date}
 */
function getTomorrow() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
}

/**
 * Format time as HH:MM
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
}

/**
 * Rebalance workload based on completion rates
 * This can be called to adjust future plans based on how well the user is keeping up
 * @param {Array} schedules - Past study schedules
 * @param {Object} profile - User profile
 * @returns {Object} - Suggested adjustments
 */
export function rebalanceWorkload(schedules, profile) {
    const recentSchedules = schedules
        .filter(s => {
            const scheduleDate = new Date(s.date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return scheduleDate >= weekAgo
        })

    if (recentSchedules.length === 0) {
        return { adjustment: 0, message: 'Not enough data yet' }
    }

    const completionRate = recentSchedules.filter(s => s.status === 'done').length / recentSchedules.length

    let adjustment = 0
    let message = ''

    if (completionRate < 0.5) {
        adjustment = -20 // Reduce daily minutes by 20
        message = 'Consider reducing study time slightly to improve consistency'
    } else if (completionRate > 0.9) {
        adjustment = 15 // Increase daily minutes by 15
        message = 'Great job! You can handle a bit more workload'
    } else {
        message = 'Current workload seems balanced'
    }

    return {
        adjustment,
        message,
        newDailyMinutes: profile.daily_study_minutes + adjustment,
    }
}

/**
 * Generate mandatory revision blocks for weak topics
 * @param {Array} weakTopics - Array of weak topic objects
 * @param {Date} date - Date for revision blocks
 * @returns {Array} - Array of revision time blocks
 */
export function generateRevisionBlocks(weakTopics, date = getTomorrow()) {
    const revisionBlocks = []

    // Create one revision block per weak topic (max 3 per day)
    const topicsToRevise = weakTopics.slice(0, 3)

    let currentTime = new Date(date)
    currentTime.setHours(19, 0, 0, 0) // Evening revision starting at 7 PM

    topicsToRevise.forEach(topic => {
        const startTime = new Date(currentTime)
        const endTime = new Date(currentTime)
        endTime.setMinutes(endTime.getMinutes() + 30) // 30-minute revision blocks

        revisionBlocks.push({
            date: date.toISOString().split('T')[0],
            start_time: formatTime(startTime),
            end_time: formatTime(endTime),
            subject: topic.subject,
            topic: `${topic.topic} (Revision)`,
            target_questions: 20,
            status: 'pending',
        })

        currentTime = new Date(endTime)
    })

    return revisionBlocks
}

/**
 * Generate a smart study plan for multiple days
 * @param {Object} preferences - User preferences {dailyHours, preferredSubjects, startDate, endDate}
 * @param {Array} sessions - Historical question sessions
 * @param {Array} allSubjects - All available subjects and topics
 * @returns {Array} - Array of study schedule objects ready for database insert
 */
export function generateSmartPlan(preferences, sessions, allSubjects) {
    const {
        dailyHours = 4,
        preferredSubjects = [],
        startDate = new Date(),
        endDate = null
    } = preferences

    const weakTopics = detectWeakTopics(sessions)
    const plan = []

    // Default to 7 days if no end date specified
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Calculate days between dates
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const numDays = Math.min(daysDiff, 30) // Max 30 days

    // Create a topic pool: 60% weak topics, 40% preferred subjects
    const topicPool = []

    // Add weak topics (prioritized)
    weakTopics.forEach(weak => {
        for (let i = 0; i < 3; i++) { // Add each weak topic 3 times for higher probability
            topicPool.push({
                subject: weak.subject,
                topic: weak.topic,
                isWeak: true
            })
        }
    })

    // Add preferred subjects
    if (preferredSubjects.length > 0) {
        preferredSubjects.forEach(subjectName => {
            const subject = allSubjects.find(s => s.name === subjectName)
            if (subject && subject.topics && Array.isArray(subject.topics)) {
                subject.topics.forEach(topic => {
                    topicPool.push({
                        subject: subjectName,
                        topic: topic,
                        isWeak: false
                    })
                })
            }
        })
    }

    // If no preferences OR pool is still too small, add all subjects as fallback
    if (preferredSubjects.length === 0 || topicPool.length < 5) {
        allSubjects.forEach(subject => {
            if (subject && subject.topics && Array.isArray(subject.topics)) {
                subject.topics.forEach(topic => {
                    // Avoid duplicates
                    const exists = topicPool.some(t =>
                        t.subject === subject.name && t.topic === topic
                    )
                    if (!exists) {
                        topicPool.push({
                            subject: subject.name,
                            topic: topic,
                            isWeak: false
                        })
                    }
                })
            }
        })
    }

    // Shuffle topic pool
    shuffleArray(topicPool)

    // Generate plan for each day
    for (let day = 0; day < numDays; day++) {
        const currentDate = new Date(start)
        currentDate.setDate(currentDate.getDate() + day)

        // Convert daily hours to number of study blocks (each block = 60 min + 15 min break)
        const numBlocks = Math.floor((dailyHours * 60) / 75)

        // Start time at 9 AM
        let currentTime = new Date(currentDate)
        currentTime.setHours(9, 0, 0, 0)

        // Create study blocks for this day
        for (let block = 0; block < numBlocks; block++) {
            const topicIndex = (day * numBlocks + block) % topicPool.length
            const item = topicPool[topicIndex]

            const startTime = new Date(currentTime)
            const endTime = new Date(currentTime)
            endTime.setMinutes(endTime.getMinutes() + 60)

            plan.push({
                date: currentDate.toISOString().split('T')[0],
                start_time: formatTime(startTime),
                end_time: formatTime(endTime),
                subject: item.subject,
                topic: item.topic,
                target_questions: item.isWeak ? 30 : 50,
                status: 'pending'
            })

            // Move to next block (60 min study + 15 min break)
            currentTime.setMinutes(currentTime.getMinutes() + 75)
        }
    }

    return plan
}

/**
 * Shuffle array in place (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
}

/**
 * Default KPSS subjects and topics (can be customized)
 */
export const DEFAULT_SUBJECTS = [
    {
        name: 'Türkçe',
        topics: ['Sözcük Bilgisi', 'Cümle Bilgisi', 'Anlam Bilgisi', 'Parça Yorumu', 'Yazım Kuralları']
    },
    {
        name: 'Tarih',
        topics: ['Osmanlı Dönemi', 'Cumhuriyet Dönemi', 'Türk Devrimi', 'İnkılap Tarihi']
    },
    {
        name: 'Coğrafya',
        topics: ['Fiziki Coğrafya', 'Beşeri Coğrafya', 'Türkiye Coğrafyası', 'Ekonomik Coğrafya']
    },
    {
        name: 'Vatandaşlık',
        topics: ['Anayasa', 'İnsan Hakları', 'Atatürk İlkeleri', 'Kamu Yönetimi']
    },
    {
        name: 'Matematik',
        topics: ['Temel Kavramlar', 'Problemler', 'Geometri', 'Veri Analizi']
    },
    {
        name: 'Genel Yetenek',
        topics: ['Sözel Mantık', 'Sayısal Mantık', 'Şekil-Uzay', 'İlişki Kurma']
    },
    {
        name: 'Genel Kültür',
        topics: ['Türk Kültürü', 'Teknoloji', 'Genel Bilgiler', 'Güncel Bilgiler']
    }
]
