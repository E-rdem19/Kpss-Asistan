import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateSmartPlan, DEFAULT_SUBJECTS } from '../lib/adaptivePlanner'

export default function SmartStudyPlanGenerator({ user, profile }) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [generatedPlan, setGeneratedPlan] = useState([])

    // Form state
    const [dailyHours, setDailyHours] = useState(4)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(() => {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        return date.toISOString().split('T')[0]
    })
    const [preferredSubjects, setPreferredSubjects] = useState([])

    useEffect(() => {
        if (user) {
            fetchSessions()
        }
    }, [user])

    const fetchSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('question_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setSessions(data || [])
        } catch (error) {
            console.error('Error fetching sessions:', error)
        }
    }

    const handleSubjectToggle = (subjectName) => {
        setPreferredSubjects(prev => {
            if (prev.includes(subjectName)) {
                return prev.filter(s => s !== subjectName)
            } else {
                return [...prev, subjectName]
            }
        })
    }

    const handleGenerate = () => {
        setLoading(true)

        try {
            const preferences = {
                dailyHours: parseFloat(dailyHours),
                preferredSubjects,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }

            const plan = generateSmartPlan(preferences, sessions, DEFAULT_SUBJECTS)
            setGeneratedPlan(plan)
            setShowPreview(true)
        } catch (error) {
            console.error('Error generating plan:', error)
            alert('Plan oluşturulurken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleSavePlan = async () => {
        if (generatedPlan.length === 0) return

        setLoading(true)

        try {
            // Add user_id to each schedule entry
            const schedulesToInsert = generatedPlan.map(schedule => ({
                ...schedule,
                user_id: user.id
            }))

            const { error } = await supabase
                .from('study_schedules')
                .insert(schedulesToInsert)

            if (error) throw error

            alert(`✅ ${generatedPlan.length} adet çalışma bloğu kaydedildi!`)
            setShowPreview(false)
            setGeneratedPlan([])
        } catch (error) {
            console.error('Error saving plan:', error)
            alert('Plan kaydedilemedi')
        } finally {
            setLoading(false)
        }
    }

    // Group plan by date for preview
    const planByDate = generatedPlan.reduce((acc, block) => {
        if (!acc[block.date]) {
            acc[block.date] = []
        }
        acc[block.date].push(block)
        return acc
    }, {})

    const totalDays = Object.keys(planByDate).length
    const totalBlocks = generatedPlan.length
    const weakTopicBlocks = generatedPlan.filter(b => b.target_questions === 30).length

    return (
        <div className="container">
            <div className="page-header">
                <h1>🧠 Akıllı Plan Oluşturucu</h1>
                <p>Performansınıza göre otomatik çalışma programı oluşturun</p>
            </div>

            {!showPreview ? (
                <div className="card">
                    <h2>Plan Ayarları</h2>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                        {/* Daily Hours Slider */}
                        <div className="form-group">
                            <label>Günlük Çalışma Saati: <strong>{dailyHours} saat</strong></label>
                            <input
                                type="range"
                                min="1"
                                max="12"
                                step="0.5"
                                value={dailyHours}
                                onChange={(e) => setDailyHours(e.target.value)}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>1 saat</span>
                                <span>6 saat</span>
                                <span>12 saat</span>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Subject Preferences */}
                        <div className="form-group">
                            <label>Tercih Edilen Dersler (Opsiyonel)</label>
                            <p className="text-muted">Seçilmezse tüm derslere eşit ağırlık verilir</p>
                            <div className="subject-checkboxes">
                                {DEFAULT_SUBJECTS.map(subject => (
                                    <label key={subject.name} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={preferredSubjects.includes(subject.name)}
                                            onChange={() => handleSubjectToggle(subject.name)}
                                        />
                                        <span>{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="info-box">
                            <strong>ℹ️ Nasıl Çalışır?</strong>
                            <ul>
                                <li>Zayıf konulara otomatik öncelik verilir (%60)</li>
                                <li>Tercih edilen dersler programa dahil edilir (%40)</li>
                                <li>Her çalışma bloğu 60 dakika + 15 dakika mola</li>
                                <li>Günlük başlangıç saati: 09:00</li>
                            </ul>
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? '⏳ Oluşturuluyor...' : '✨ Plan Oluştur'}
                        </button>
                    </form>
                </div>
            ) : (
                <div>
                    {/* Plan Summary */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Toplam Gün</div>
                            <div className="stat-value">{totalDays}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Çalışma Bloğu</div>
                            <div className="stat-value">{totalBlocks}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Zayıf Konu Tekrarı</div>
                            <div className="stat-value">{weakTopicBlocks}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Günlük Ortalama</div>
                            <div className="stat-value">{(totalBlocks / totalDays).toFixed(1)} blok</div>
                        </div>
                    </div>

                    {/* Plan Preview */}
                    <div className="card">
                        <h2>Plan Önizleme</h2>
                        <div className="plan-preview">
                            {Object.keys(planByDate).sort().map(date => (
                                <div key={date} className="day-block">
                                    <h3 className="day-header">
                                        📅 {new Date(date).toLocaleDateString('tr-TR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <div className="schedule-grid">
                                        {planByDate[date].map((block, idx) => (
                                            <div key={idx} className={`schedule-card ${block.target_questions === 30 ? 'weak-topic' : ''}`}>
                                                <div className="schedule-time">
                                                    ⏰ {block.start_time} - {block.end_time}
                                                </div>
                                                <div className="schedule-subject">{block.subject}</div>
                                                <div className="schedule-topic">{block.topic}</div>
                                                <div className="schedule-target">
                                                    🎯 Hedef: {block.target_questions} soru
                                                    {block.target_questions === 30 && (
                                                        <span className="weak-badge">⚠️ Zayıf Konu</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="btn btn-secondary"
                        >
                            ⬅️ Geri Dön
                        </button>
                        <button
                            onClick={handleSavePlan}
                            className="btn btn-success"
                            disabled={loading}
                        >
                            {loading ? '⏳ Kaydediliyor...' : '💾 Planı Kaydet'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
