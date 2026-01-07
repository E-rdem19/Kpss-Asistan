import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
    calculateAccuracyPerTopic,
    detectWeakTopics,
    calculateReadinessScore,
    getStatistics
} from '../lib/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function PerformanceAnalytics({ user, profile }) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('question_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setSessions(data || [])
        } catch (err) {
            console.error('Error fetching sessions:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>
    }

    const topicAccuracies = calculateAccuracyPerTopic(sessions)
    const weakTopics = detectWeakTopics(sessions)
    const readinessScore = calculateReadinessScore(sessions, profile?.target_score || 80)
    const weeklyStats = getStatistics(sessions, 7)
    const monthlyStats = getStatistics(sessions, 30)

    // Prepare chart data
    const chartData = Object.values(topicAccuracies)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 10)
        .map(topic => ({
            name: `${topic.subject.substring(0, 6)}...`,
            fullName: `${topic.subject} - ${topic.topic}`,
            accuracy: topic.accuracy.toFixed(1),
            total: topic.total
        }))

    return (
        <div className="animate-fade-in">
            <div className="mb-lg">
                <h2>Performans Analizi</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Detaylı performans metrikleri ve zayıf konularınız
                </p>
            </div>

            {/* Readiness Score */}
            <div className="card mb-lg" style={{ textAlign: 'center' }}>
                <h3>Sınav Hazırlık Puanı</h3>
                <div className="progress-ring">
                    <svg width="120" height="120">
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="var(--border-primary)"
                            strokeWidth="8"
                        />
                        <circle
                            className="progress-ring-circle"
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke={readinessScore >= 70 ? 'var(--color-success)' : readinessScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'}
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 54}`}
                            strokeDashoffset={`${2 * Math.PI * 54 * (1 - readinessScore / 100)}`}
                        />
                    </svg>
                    <div className="progress-ring-text">%{readinessScore}</div>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-md)' }}>
                    {readinessScore >= 70 ? '🎯 Harika gidiyorsunuz!' :
                        readinessScore >= 50 ? '💪 İyi ilerliyorsunuz' :
                            '📚 Daha fazla çalışma gerekli'}
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-2 mb-lg">
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">Son 7 Gün</h4>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    Çözülen Soru
                                </div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                                    {weeklyStats.totalSolved}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    Doğruluk Oranı
                                </div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                                    %{weeklyStats.accuracy.toFixed(1)}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    Seans Sayısı
                                </div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                                    {weeklyStats.sessionCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">Son 30 Gün</h4>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    Çözülen Soru
                                </div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                                    {monthlyStats.totalSolved}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    Doğruluk Oranı
                                </div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                                    %{monthlyStats.accuracy.toFixed(1)}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    Seans Sayısı
                                </div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                                    {monthlyStats.sessionCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weak Topics Alert */}
            {weakTopics.length > 0 && (
                <div className="alert alert-warning mb-lg">
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>⚠️ Zayıf Konular</h4>
                    <p>Aşağıdaki konularda %70'in altında doğruluk oranınız var:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', marginLeft: 'var(--spacing-lg)' }}>
                        {weakTopics.slice(0, 5).map((topic, idx) => (
                            <li key={idx}>
                                <strong>{topic.subject} - {topic.topic}</strong>: %{topic.accuracy.toFixed(1)}
                                {' '}({topic.total} soru)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Accuracy Chart */}
            {chartData.length > 0 && (
                <div className="card mb-lg">
                    <div className="card-header">
                        <h4 className="card-title">Konu Bazında Doğruluk Oranları</h4>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)' }}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)'
                                    }}
                                    formatter={(value, name) => {
                                        if (name === 'accuracy') return [`%${value}`, 'Doğruluk']
                                        return [value, name]
                                    }}
                                    labelFormatter={(label) => {
                                        const item = chartData.find(d => d.name === label)
                                        return item ? item.fullName : label
                                    }}
                                />
                                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                                <Bar dataKey="accuracy" fill="var(--color-primary)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Topic Details Table */}
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">Tüm Konular</h4>
                </div>
                {Object.keys(topicAccuracies).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                        <p>Henüz yeterli veri yok.</p>
                        <p>Çalışma seanslarınızı kaydetmeye başlayın.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ders</th>
                                    <th>Konu</th>
                                    <th>Çözülen</th>
                                    <th>Doğru</th>
                                    <th>Doğruluk</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(topicAccuracies)
                                    .sort((a, b) => b.total - a.total)
                                    .map((topic, idx) => (
                                        <tr key={idx}>
                                            <td>{topic.subject}</td>
                                            <td>{topic.topic}</td>
                                            <td>{topic.total}</td>
                                            <td>{topic.correct}</td>
                                            <td>%{topic.accuracy.toFixed(1)}</td>
                                            <td>
                                                {topic.accuracy >= 70 ? (
                                                    <span className="badge badge-success">İyi</span>
                                                ) : topic.total < 10 ? (
                                                    <span className="badge badge-secondary">Yetersiz Veri</span>
                                                ) : (
                                                    <span className="badge badge-warning">Geliştirilmeli</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
