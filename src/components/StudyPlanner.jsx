import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StudyPlanner({ user }) {
    const [schedules, setSchedules] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        subject: '',
        topic: '',
        target_questions: 50
    })

    useEffect(() => {
        fetchSchedules()
    }, [])

    const fetchSchedules = async () => {
        try {
            const { data, error } = await supabase
                .from('study_schedules')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true })

            if (error) throw error
            setSchedules(data || [])
        } catch (err) {
            console.error('Error fetching schedules:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const { error } = await supabase
                .from('study_schedules')
                .insert([
                    {
                        user_id: user.id,
                        ...formData,
                        status: 'pending'
                    }
                ])

            if (error) throw error

            setFormData({
                date: new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '10:00',
                subject: '',
                topic: '',
                target_questions: 50
            })
            setShowForm(false)
            fetchSchedules()
        } catch (err) {
            alert('Hata: ' + err.message)
        }
    }

    const updateStatus = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('study_schedules')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error
            fetchSchedules()
        } catch (err) {
            alert('Hata: ' + err.message)
        }
    }

    const deleteSchedule = async (id) => {
        if (!confirm('Bu çalışma bloğunu silmek istediğinizden emin misiniz?')) return

        try {
            const { error } = await supabase
                .from('study_schedules')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchSchedules()
        } catch (err) {
            alert('Hata: ' + err.message)
        }
    }

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

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h2>Çalışma Takvimi</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Günlük çalışma bloklarınızı planlayın ve takip edin
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'İptal' : '+ Yeni Blok Ekle'}
                </button>
            </div>

            {showForm && (
                <div className="card animate-slide-in mb-lg">
                    <h3>Yeni Çalışma Bloğu</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-3">
                            <div className="form-group">
                                <label className="form-label">Tarih</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Başlangıç</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bitiş</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Ders</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="örn. Türkçe, Matematik"
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

                        <div className="form-group">
                            <label className="form-label">Hedef Soru Sayısı</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.target_questions}
                                onChange={(e) => setFormData({ ...formData, target_questions: parseInt(e.target.value) })}
                                min="1"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Kaydet
                        </button>
                    </form>
                </div>
            )}

            <div className="card">
                {schedules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                        <p>Henüz çalışma bloğu eklenmemiş.</p>
                        <p>Başlamak için yukarıdaki butona tıklayın.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Saat</th>
                                    <th>Ders</th>
                                    <th>Konu</th>
                                    <th>Hedef Soru</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map((schedule) => (
                                    <tr key={schedule.id}>
                                        <td>{new Date(schedule.date).toLocaleDateString('tr-TR')}</td>
                                        <td>{schedule.start_time} - {schedule.end_time}</td>
                                        <td>{schedule.subject}</td>
                                        <td>{schedule.topic}</td>
                                        <td>{schedule.target_questions}</td>
                                        <td>{getStatusBadge(schedule.status)}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                {schedule.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => updateStatus(schedule.id, 'done')}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => updateStatus(schedule.id, 'skipped')}
                                                        >
                                                            Atla
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => deleteSchedule(schedule.id)}
                                                >
                                                    Sil
                                                </button>
                                            </div>
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
