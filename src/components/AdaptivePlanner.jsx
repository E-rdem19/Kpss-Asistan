import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateDailyPlan, rebalanceWorkload } from '../lib/adaptivePlanner'
import { detectWeakTopics } from '../lib/calculations'

export default function AdaptivePlanner({ user, profile }) {
    const [sessions, setSessions] = useState([])
    const [schedules, setSchedules] = useState([])
    const [generatedPlan, setGeneratedPlan] = useState([])
    const [loading, setLoading] = useState(false)
    const [showRebalance, setShowRebalance] = useState(false)
    const [rebalanceAnalysis, setRebalanceAnalysis] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [sessionsRes, schedulesRes] = await Promise.all([
                supabase.from('question_sessions').select('*').eq('user_id', user.id),
                supabase.from('study_schedules').select('*').eq('user_id', user.id)
            ])

            if (sessionsRes.data) setSessions(sessionsRes.data)
            if (schedulesRes.data) setSchedules(schedulesRes.data)
        } catch (err) {
            console.error('Error fetching data:', err)
        }
    }

    const handleGeneratePlan = () => {
        setLoading(true)
        try {
            const plan = generateDailyPlan(profile, sessions)
            setGeneratedPlan(plan)
        } catch (err) {
            alert('Hata: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleApplyPlan = async () => {
        if (generatedPlan.length === 0) return

        setLoading(true)
        try {
            const blocksWithUserId = generatedPlan.map(block => ({
                ...block,
                user_id: user.id
            }))

            const { error } = await supabase
                .from('study_schedules')
                .insert(blocksWithUserId)

            if (error) throw error

            alert(`✅ ${generatedPlan.length} çalışma bloğu başarıyla eklendi!`)
            setGeneratedPlan([])
            fetchData()
        } catch (err) {
            alert('Hata: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const analyzeWorkload = () => {
        const analysis = rebalanceWorkload(schedules, profile)
        setRebalanceAnalysis(analysis)
        setShowRebalance(true)
    }

    const weakTopics = detectWeakTopics(sessions)

    return (
        <div className="animate-fade-in">
            <div className="mb-lg">
                <h2>Akıllı Planlayıcı</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Performansınıza göre otomatik günlük plan oluşturun
                </p>
            </div>

            {/* Weak Topics Summary */}
            {weakTopics.length > 0 && (
                <div className="alert alert-info mb-lg">
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>📊 Performans Özeti</h4>
                    <p>
                        {weakTopics.length} zayıf konu tespit edildi. Yeni plan oluşturduğunuzda bu konulara öncelik verilecek.
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-2 mb-lg">
                <div className="card">
                    <h3>Yarının Planını Oluştur</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                        Performansınıza göre otomatik olarak yarın için dengeli bir çalışma planı oluşturur.
                    </p>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleGeneratePlan}
                        disabled={loading || !profile}
                    >
                        {loading ? 'Oluşturuluyor...' : '🎯 Plan Oluştur'}
                    </button>
                </div>

                <div className="card">
                    <h3>Yük Dengesini Analiz Et</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                        Çalışma yükünüzün uygun olup olmadığını kontrol eder ve öneri sunar.
                    </p>
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={analyzeWorkload}
                        disabled={schedules.length === 0}
                    >
                        📈 Analiz Et
                    </button>
                </div>
            </div>

            {/* Rebalance Analysis */}
            {showRebalance && rebalanceAnalysis && (
                <div className="card animate-slide-in mb-lg">
                    <h3>Yük Dengesi Analizi</h3>
                    <div className="alert alert-info">
                        <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
                            {rebalanceAnalysis.message}
                        </p>
                        {rebalanceAnalysis.adjustment !== 0 && (
                            <p style={{ marginTop: 'var(--spacing-md)' }}>
                                <strong>Öneri:</strong> Günlük çalışma sürenizi{' '}
                                <strong>{profile.daily_study_minutes} dakika</strong>'dan{' '}
                                <strong>{rebalanceAnalysis.newDailyMinutes} dakika</strong>'ya{' '}
                                {rebalanceAnalysis.adjustment > 0 ? 'artırın' : 'azaltın'}.
                            </p>
                        )}
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowRebalance(false)}
                    >
                        Kapat
                    </button>
                </div>
            )}

            {/* Generated Plan Preview */}
            {generatedPlan.length > 0 && (
                <div className="card animate-slide-in">
                    <div className="card-header">
                        <h3 className="card-title">Oluşturulan Plan Önizlemesi</h3>
                        <button
                            className="btn btn-success"
                            onClick={handleApplyPlan}
                            disabled={loading}
                        >
                            ✓ Planı Uygula
                        </button>
                    </div>
                    <div className="alert alert-success">
                        <p>
                            📅 <strong>{new Date(generatedPlan[0].date).toLocaleDateString('tr-TR')}</strong> için{' '}
                            {generatedPlan.length} çalışma bloğu oluşturuldu.
                        </p>
                        {weakTopics.length > 0 && (
                            <p style={{ marginTop: 'var(--spacing-sm)' }}>
                                ⚡ Zayıf konulara öncelik verildi
                            </p>
                        )}
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Saat</th>
                                    <th>Ders</th>
                                    <th>Konu</th>
                                    <th>Hedef Soru</th>
                                    <th>Tür</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedPlan.map((block, idx) => (
                                    <tr key={idx}>
                                        <td>{block.start_time} - {block.end_time}</td>
                                        <td>{block.subject}</td>
                                        <td>{block.topic}</td>
                                        <td>{block.target_questions}</td>
                                        <td>
                                            {block.topic.includes('Revision') ? (
                                                <span className="badge badge-warning">Tekrar</span>
                                            ) : (
                                                <span className="badge badge-primary">Yeni</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {generatedPlan.length === 0 && !showRebalance && (
                <div className="card">
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>🤖</div>
                        <h3>Akıllı Planlama Sistemi</h3>
                        <p style={{ marginTop: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
                            Performansınızı analiz ederek size özel çalışma planı oluşturuyoruz.
                            Zayıf konularınıza otomatik olarak öncelik verilir.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
