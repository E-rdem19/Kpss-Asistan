import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { detectWeakTopics, calculateReadinessScore, calculateDailySolved } from '../lib/calculations'

export default function Dashboard({ user, profile }) {
    const [sessions, setSessions] = useState([])
    const [todaySchedules, setTodaySchedules] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]

            const [sessionsRes, schedulesRes] = await Promise.all([
                supabase.from('question_sessions').select('*').eq('user_id', user.id),
                supabase.from('study_schedules').select('*').eq('user_id', user.id).eq('date', today)
            ])

            if (sessionsRes.data) setSessions(sessionsRes.data)
            if (schedulesRes.data) setTodaySchedules(schedulesRes.data)
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>
    }

    const weakTopics = detectWeakTopics(sessions)
    const readinessScore = calculateReadinessScore(sessions, profile?.target_score || 80)
    const todaySolved = calculateDailySolved(sessions)
    const totalSolved = sessions.reduce((sum, s) => sum + (s.solved || 0), 0)

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            done: 'badge-success',
            skipped: 'badge-secondary'
        }
        const labels = {
            pending: 'Bekliyor',
            done: 'Tamamlandı',
            skipped: 'Atlandı'
        }
        return <span className={`badge ${badges[status]}`}>{labels[status]}</span>
    }

    return (
        <div className="animate-fade-in">
            {/* Welcome Header */}
            <div className="mb-lg">
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>
                    Merhaba, {user.email.split('@')[0]}! 👋
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                    {profile ? `${profile.exam_type} hazırlığınız devam ediyor` : 'Sınav hazırlık platformunuza hoş geldiniz'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-4 mb-lg">
                <div className="card">
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        Bugün Çözülen
                    </div>
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {todaySolved}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        soru
                    </div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        Toplam Çözülen
                    </div>
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-secondary)' }}>
                        {totalSolved}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        soru
                    </div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        Zayıf Konular
                    </div>
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-warning)' }}>
                        {weakTopics.length}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        konu
                    </div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        Hazırlık Puanı
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-3xl)', fontWeight: 800,
                        color: readinessScore >= 70 ? 'var(--color-success)' : readinessScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
                    }}>
                        %{readinessScore}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        {readinessScore >= 70 ? 'Harika!' : readinessScore >= 50 ? 'İyi' : 'Geliştir'}
                    </div>
                </div>
            </div>

            <div className="grid grid-2">
                {/* Today's Schedule */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📅 Bugünün Programı</h3>
                    </div>
                    {todaySchedules.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                            <p>Bugün için planlanmış çalışma yok.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {todaySchedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '4px solid var(--color-primary)'
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-sm">
                                        <div style={{ fontWeight: 600 }}>
                                            {schedule.start_time} - {schedule.end_time}
                                        </div>
                                        {getStatusBadge(schedule.status)}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        <strong>{schedule.subject}</strong> - {schedule.topic}
                                    </div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
                                        Hedef: {schedule.target_questions} soru
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weak Topics Alert */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">⚠️ Dikkat Edilmesi Gerekenler</h3>
                    </div>
                    {weakTopics.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🎉</div>
                            <p>Harika! Şu an zayıf konu yok.</p>
                            <p style={{ fontSize: 'var(--font-size-sm)' }}>Çalışmalarınızı sürdürün!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {weakTopics.slice(0, 5).map((topic, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '4px solid var(--color-warning)'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                                        {topic.subject} - {topic.topic}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        <span>Doğruluk: %{topic.accuracy.toFixed(1)}</span>
                                        <span>{topic.total} soru çözüldü</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-lg">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>🚀 Hızlı İşlemler</h3>
                <div className="grid grid-3">
                    <a href="#/planner" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
                        📅 Program Oluştur
                    </a>
                    <a href="#/tracker" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>
                        ✏️ Seans Kaydet
                    </a>
                    <a href="#/adaptive" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>
                        🤖 Akıllı Plan
                    </a>
                </div>
            </div>
        </div>
    )
}
