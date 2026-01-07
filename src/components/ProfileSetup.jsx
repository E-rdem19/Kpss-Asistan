import { useState } from 'react'
import { supabase } from '../lib/supabase'

const DAYS_OF_WEEK = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const EXAM_TYPES = [
    'KPSS Lisans',
    'KPSS Önlisans',
    'KPSS Ortaöğretim',
    'ALES',
    'DGS',
    'Diğer'
]

export default function ProfileSetup({ user, onComplete }) {
    const [formData, setFormData] = useState({
        exam_type: 'KPSS Önlisans',
        daily_study_minutes: 240,
        target_score: 80,
        weekly_study_days: [],
        start_date: new Date().toISOString().split('T')[0]
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            weekly_study_days: prev.weekly_study_days.includes(day)
                ? prev.weekly_study_days.filter(d => d !== day)
                : [...prev.weekly_study_days, day]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.weekly_study_days.length === 0) {
            setError('Lütfen en az bir çalışma günü seçin')
            return
        }

        setError(null)
        setLoading(true)

        try {
            // Debug: Check user ID
            console.log('Attempting to create profile for user:', user.id)
            console.log('Form data:', formData)

            const { data, error } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                        ...formData
                    }
                ])
                .select()

            console.log('Insert result:', { data, error })

            if (error) {
                console.error('Supabase error details:', error)
                // If RLS error, provide helpful message
                if (error.message.includes('row-level security')) {
                    throw new Error('RLS hatası: Lütfen SIMPLE_RLS_FIX.sql scriptini Supabase SQL Editor\'da çalıştırın')
                }
                throw error
            }

            console.log('Profile created successfully!')
            onComplete()
        } catch (err) {
            console.error('Full error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="app-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, hsl(260, 85%, 15%), hsl(240, 60%, 10%))',
            minHeight: '100vh',
            padding: 'var(--spacing-lg)'
        }}>
            <div className="card card-glass animate-fade-in" style={{
                maxWidth: '600px',
                width: '100%'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h2>Profilinizi Oluşturun</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Kişiselleştirilmiş çalışma planı için bilgilerinizi girin
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Sınav Türü</label>
                        <select
                            className="form-select"
                            value={formData.exam_type}
                            onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                            required
                        >
                            {EXAM_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 'var(--spacing-lg)',
                        alignItems: 'start'
                    }}>
                        <div className="form-group">
                            <label className="form-label">Günlük Çalışma Süresi (dakika)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.daily_study_minutes}
                                onChange={(e) => setFormData({ ...formData, daily_study_minutes: parseInt(e.target.value) })}
                                min="30"
                                max="720"
                                step="15"
                                required
                            />
                            <div className="form-hint">
                                {Math.floor(formData.daily_study_minutes / 60)} saat {formData.daily_study_minutes % 60} dakika
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Hedef Puan</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.target_score}
                                onChange={(e) => setFormData({ ...formData, target_score: parseInt(e.target.value) })}
                                min="0"
                                max="100"
                                required
                            />
                            <div className="form-hint">
                                0-100 arası puan hedefi
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Haftalık Çalışma Günleri</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: 'var(--spacing-sm)'
                        }}>
                            {DAYS_OF_WEEK.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    className={formData.weekly_study_days.includes(day) ? 'btn btn-primary' : 'btn btn-secondary'}
                                    onClick={() => handleDayToggle(day)}
                                    style={{ fontSize: 'var(--font-size-sm)' }}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        {formData.weekly_study_days.length > 0 && (
                            <div className="form-hint">
                                {formData.weekly_study_days.length} gün seçildi
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Başlangıç Tarihi</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Kaydediliyor...' : 'Profili Kaydet ve Devam Et'}
                    </button>
                </form>
            </div>
        </div>
    )
}
