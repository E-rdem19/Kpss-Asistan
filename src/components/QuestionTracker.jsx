import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SessionTimer from './SessionTimer'

export default function QuestionTracker({ user }) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        subject: '',
        topic: '',
        solved: 0,
        correct: 0,
        incorrect: 0,
        blank: 0,
        wrong_question_ids: '',
        duration_minutes: 0
    })
    const [timerData, setTimerData] = useState({ status: 'stopped', duration: 0, durationMinutes: 0 })

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

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate totals
        const total = formData.correct + formData.incorrect + formData.blank
        if (total !== formData.solved) {
            alert(`Toplam: ${total} ≠ Çözülen: ${formData.solved}. Lütfen kontrol edin.`)
            return
        }

        try {
            const { error } = await supabase
                .from('question_sessions')
                .insert([
                    {
                        user_id: user.id,
                        ...formData,
                        duration_minutes: timerData.durationMinutes || 0
                    }
                ])

            if (error) throw error

            setFormData({
                subject: '',
                topic: '',
                solved: 0,
                correct: 0,
                incorrect: 0,
                blank: 0,
                wrong_question_ids: '',
                duration_minutes: 0
            })
            setTimerData({ status: 'stopped', duration: 0, durationMinutes: 0 })
            setShowForm(false)
            fetchSessions()
            alert('✅ Çalışma seansı kaydedildi!')
        } catch (err) {
            alert('Hata: ' + err.message)
        }
    }

    const handleTimerUpdate = (data) => {
        setTimerData(data)
    }

    const calculateAccuracy = (session) => {
        if (session.solved === 0) return 0
        return ((session.correct / session.solved) * 100).toFixed(1)
    }

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h2>Soru Takibi</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Çalışma seanslarınızı kaydedin ve performansınızı izleyin
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'İptal' : '+ Seans Kaydet'}
                </button>
            </div>

            {showForm && (
                <div className="card animate-slide-in mb-lg">
                    <h3>Yeni Çalışma Seansı</h3>

                    {/* Session Timer */}
                    <SessionTimer
                        userId={user.id}
                        sessionId={null}
                        onTimerUpdate={handleTimerUpdate}
                    />

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Ders</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="örn. Türkçe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Konu</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                    placeholder="örn. Sözcük Bilgisi"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-4">
                            <div className="form-group">
                                <label className="form-label">Çözülen</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.solved}
                                    onChange={(e) => setFormData({ ...formData, solved: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Doğru</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.correct}
                                    onChange={(e) => setFormData({ ...formData, correct: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Yanlış</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.incorrect}
                                    onChange={(e) => setFormData({ ...formData, incorrect: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Boş</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.blank}
                                    onChange={(e) => setFormData({ ...formData, blank: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Yanlış Soru Numaraları</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.wrong_question_ids}
                                onChange={(e) => setFormData({ ...formData, wrong_question_ids: e.target.value })}
                                placeholder="örn. 5, 12, 23, 45 (virgülle ayırın)"
                            />
                            <div className="form-hint">İsteğe bağlı - tekrar için işaretleyin</div>
                        </div>

                        <div className="alert alert-info">
                            Toplam: {formData.correct + formData.incorrect + formData.blank} / Çözülen: {formData.solved}
                            {formData.solved > 0 && ` • Doğruluk: ${((formData.correct / formData.solved) * 100).toFixed(1)}%`}
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Seansı Kaydet
                        </button>
                    </form>
                </div>
            )}

            <div className="card">
                <h3>Çalışma Geçmişi</h3>
                {sessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                        <p>Henüz kaydedilmiş seans yok.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Ders</th>
                                    <th>Konu</th>
                                    <th>Çözülen</th>
                                    <th>Doğru</th>
                                    <th>Yanlış</th>
                                    <th>Boş</th>
                                    <th>Süre</th>
                                    <th>Doğruluk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session) => {
                                    const accuracy = calculateAccuracy(session)
                                    return (
                                        <tr key={session.id}>
                                            <td>{new Date(session.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td>{session.subject}</td>
                                            <td>{session.topic}</td>
                                            <td>{session.solved}</td>
                                            <td style={{ color: 'var(--color-success)' }}>{session.correct}</td>
                                            <td style={{ color: 'var(--color-danger)' }}>{session.incorrect}</td>
                                            <td style={{ color: 'var(--text-tertiary)' }}>{session.blank}</td>
                                            <td>
                                                {session.duration_minutes ? (
                                                    <span style={{ color: 'var(--primary-color)' }}>⏱️ {session.duration_minutes} dk</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${accuracy >= 70 ? 'badge-success' : 'badge-warning'}`}>
                                                    %{accuracy}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
