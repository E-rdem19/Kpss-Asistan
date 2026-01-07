import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateNetScore, calculateMockExamProgress } from '../lib/calculations'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DEFAULT_SECTIONS = [
    { id: 1, name: 'Genel Kültür', subject: 'GK' },
    { id: 2, name: 'Genel Yetenek', subject: 'GY' },
    { id: 3, name: 'Türkçe', subject: 'Türkçe' },
    { id: 4, name: 'Matematik', subject: 'Matematik' }
]

export default function MockExamTracker({ user }) {
    const [mockExams, setMockExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0])
    const [examName, setExamName] = useState('')
    const [sections, setSections] = useState(
        DEFAULT_SECTIONS.map(s => ({ ...s, correct: 0, wrong: 0 }))
    )

    useEffect(() => {
        if (user) {
            fetchMockExams()
        }
    }, [user])

    const fetchMockExams = async () => {
        try {
            const { data, error } = await supabase
                .from('mock_exams')
                .select('*')
                .eq('user_id', user.id)
                .order('exam_date', { ascending: false })

            if (error) throw error
            setMockExams(data || [])
        } catch (error) {
            console.error('Error fetching mock exams:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSectionChange = (index, field, value) => {
        const newSections = [...sections]
        newSections[index][field] = parseInt(value) || 0
        setSections(newSections)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Calculate net scores for each section
        const sectionsWithScores = sections.map(section => ({
            subject: section.subject,
            correct: section.correct,
            wrong: section.wrong,
            net_score: calculateNetScore(section.correct, section.wrong)
        }))

        // Calculate total net score
        const totalNetScore = sectionsWithScores.reduce(
            (sum, section) => sum + section.net_score,
            0
        )

        // Calculate total questions
        const totalQuestions = sections.reduce(
            (sum, section) => sum + section.correct + section.wrong,
            0
        )

        try {
            const { error } = await supabase
                .from('mock_exams')
                .insert({
                    user_id: user.id,
                    exam_date: examDate,
                    exam_name: examName || 'Deneme Sınavı',
                    sections: sectionsWithScores,
                    total_net_score: parseFloat(totalNetScore.toFixed(2)),
                    total_questions: totalQuestions
                })

            if (error) throw error

            // Reset form
            setExamName('')
            setExamDate(new Date().toISOString().split('T')[0])
            setSections(DEFAULT_SECTIONS.map(s => ({ ...s, correct: 0, wrong: 0 })))
            setShowForm(false)

            // Refresh data
            await fetchMockExams()

            alert('✅ Deneme sınavı kaydedildi!')
        } catch (error) {
            console.error('Error saving mock exam:', error)
            alert('❌ Deneme sınavı kaydedilemedi')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu deneme sınavını silmek istediğinizden emin misiniz?')) return

        try {
            const { error } = await supabase
                .from('mock_exams')
                .delete()
                .eq('id', id)

            if (error) throw error

            await fetchMockExams()
            alert('✅ Deneme sınavı silindi')
        } catch (error) {
            console.error('Error deleting mock exam:', error)
            alert('❌ Silme işlemi başarısız')
        }
    }

    // Prepare chart data
    const chartData = mockExams
        .slice()
        .reverse()
        .map(exam => ({
            date: new Date(exam.exam_date).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short'
            }),
            'Net Puan': exam.total_net_score
        }))

    const progress = calculateMockExamProgress(mockExams)

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1>🎯 Deneme Sınavı Takibi</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    {showForm ? '❌ İptal' : '➕ Yeni Deneme Ekle'}
                </button>
            </div>

            {/* Add Exam Form */}
            {showForm && (
                <div className="card mb-4">
                    <h2>Yeni Deneme Sınavı</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Sınav Adı (Opsiyonel)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={examName}
                                    onChange={(e) => setExamName(e.target.value)}
                                    placeholder="Örn: Pegem 5. Deneme"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tarih</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <h3 className="mt-3">Bölüm Sonuçları</h3>
                        <div className="sections-grid">
                            {sections.map((section, index) => (
                                <div key={section.id} className="section-card">
                                    <h4>{section.name}</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Doğru</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={section.correct}
                                                onChange={(e) => handleSectionChange(index, 'correct', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Yanlış</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={section.wrong}
                                                onChange={(e) => handleSectionChange(index, 'wrong', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Net</label>
                                            <input
                                                type="text"
                                                className="form-control net-display"
                                                value={calculateNetScore(section.correct, section.wrong).toFixed(2)}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="total-score">
                            <strong>Toplam Net: </strong>
                            <span className="score-value">
                                {sections.reduce((sum, s) => sum + calculateNetScore(s.correct, s.wrong), 0).toFixed(2)}
                            </span>
                        </div>

                        <button type="submit" className="btn btn-success w-full mt-3">
                            💾 Kaydet
                        </button>
                    </form>
                </div>
            )}

            {/* Progress Summary */}
            {mockExams.length > 0 && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Toplam Deneme</div>
                        <div className="stat-value">{progress.count}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Son Net</div>
                        <div className="stat-value">{progress.latest?.toFixed(2) || 0}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Ortalama Net</div>
                        <div className="stat-value">{progress.average?.toFixed(2) || 0}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Gelişim</div>
                        <div className={`stat-value ${progress.trend === 'improving' ? 'text-success' : progress.trend === 'declining' ? 'text-danger' : ''}`}>
                            {progress.trend === 'improving' && '📈 Yükseliyor'}
                            {progress.trend === 'declining' && '📉 Düşüyor'}
                            {progress.trend === 'stable' && '➡️ Sabit'}
                            {progress.trend === 'no_data' && '—'}
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Chart */}
            {chartData.length > 0 && (
                <div className="card">
                    <h2>Net Puan Gelişimi</h2>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="Net Puan"
                                    stroke="var(--primary-color)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--primary-color)', r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Exam History */}
            {mockExams.length > 0 ? (
                <div className="card">
                    <h2>Deneme Geçmişi</h2>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Sınav Adı</th>
                                    <th>Toplam Net</th>
                                    <th>Detay</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockExams.map(exam => (
                                    <tr key={exam.id}>
                                        <td>{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</td>
                                        <td>{exam.exam_name}</td>
                                        <td><strong>{exam.total_net_score.toFixed(2)}</strong></td>
                                        <td>
                                            <div className="section-breakdown">
                                                {exam.sections.map((section, idx) => (
                                                    <span key={idx} className="section-badge">
                                                        {section.subject}: {section.net_score.toFixed(2)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="btn btn-danger btn-sm"
                                            >
                                                🗑️ Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card empty-state">
                    <p>📝 Henüz deneme sınavı eklenmemiş.</p>
                    <p>Yukarıdaki "Yeni Deneme Ekle" butonuna tıklayarak başlayın!</p>
                </div>
            )}
        </div>
    )
}
