import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { formatTime } from '../lib/calculations'

/**
 * SessionTimer Component
 * Reusable timer with Start/Pause/Stop functionality
 * Saves timer records to Supabase study_timers table
 */
export default function SessionTimer({ userId, sessionId, onTimerUpdate }) {
    const [seconds, setSeconds] = useState(0)
    const [status, setStatus] = useState('stopped') // 'running', 'paused', 'stopped'
    const [timerId, setTimerId] = useState(null)
    const intervalRef = useRef(null)
    const startTimeRef = useRef(null)
    const pausedDurationRef = useRef(0)

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Start timer
    const handleStart = async () => {
        try {
            const now = new Date().toISOString()
            startTimeRef.current = now
            pausedDurationRef.current = 0

            // Create timer record in database
            const { data, error } = await supabase
                .from('study_timers')
                .insert({
                    user_id: userId,
                    session_id: sessionId || null,
                    start_time: now,
                    status: 'running',
                    duration_seconds: 0
                })
                .select()
                .single()

            if (error) throw error

            setTimerId(data.id)
            setStatus('running')
            setSeconds(0)

            // Start interval
            intervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1)
            }, 1000)

            if (onTimerUpdate) {
                onTimerUpdate({ status: 'running', duration: 0 })
            }
        } catch (error) {
            console.error('Error starting timer:', error)
            alert('Zamanlayıcı başlatılamadı')
        }
    }

    // Pause timer
    const handlePause = async () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }

        try {
            const { error } = await supabase
                .from('study_timers')
                .update({
                    status: 'paused',
                    pause_time: new Date().toISOString(),
                    duration_seconds: seconds
                })
                .eq('id', timerId)

            if (error) throw error

            setStatus('paused')
            pausedDurationRef.current = seconds

            if (onTimerUpdate) {
                onTimerUpdate({ status: 'paused', duration: seconds })
            }
        } catch (error) {
            console.error('Error pausing timer:', error)
        }
    }

    // Resume timer
    const handleResume = async () => {
        try {
            const { error } = await supabase
                .from('study_timers')
                .update({
                    status: 'running',
                    pause_time: null
                })
                .eq('id', timerId)

            if (error) throw error

            setStatus('running')

            // Resume interval from paused duration
            intervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1)
            }, 1000)

            if (onTimerUpdate) {
                onTimerUpdate({ status: 'running', duration: seconds })
            }
        } catch (error) {
            console.error('Error resuming timer:', error)
        }
    }

    // Stop timer
    const handleStop = async () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }

        try {
            const now = new Date().toISOString()
            const { error } = await supabase
                .from('study_timers')
                .update({
                    status: 'stopped',
                    end_time: now,
                    duration_seconds: seconds
                })
                .eq('id', timerId)

            if (error) throw error

            setStatus('stopped')

            if (onTimerUpdate) {
                onTimerUpdate({
                    status: 'stopped',
                    duration: seconds,
                    durationMinutes: Math.floor(seconds / 60)
                })
            }
        } catch (error) {
            console.error('Error stopping timer:', error)
        }
    }

    // Reset timer (for new session)
    const handleReset = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setSeconds(0)
        setStatus('stopped')
        setTimerId(null)
        startTimeRef.current = null
        pausedDurationRef.current = 0

        if (onTimerUpdate) {
            onTimerUpdate({ status: 'stopped', duration: 0 })
        }
    }

    return (
        <div className="timer-container">
            <div className="timer-display">
                <span className="timer-icon">⏱️</span>
                <span className="timer-time">{formatTime(seconds)}</span>
            </div>

            <div className="timer-controls">
                {status === 'stopped' && (
                    <button
                        onClick={handleStart}
                        className="btn btn-success btn-sm"
                    >
                        ▶️ Başlat
                    </button>
                )}

                {status === 'running' && (
                    <>
                        <button
                            onClick={handlePause}
                            className="btn btn-warning btn-sm"
                        >
                            ⏸️ Duraklat
                        </button>
                        <button
                            onClick={handleStop}
                            className="btn btn-danger btn-sm"
                        >
                            ⏹️ Durdur
                        </button>
                    </>
                )}

                {status === 'paused' && (
                    <>
                        <button
                            onClick={handleResume}
                            className="btn btn-success btn-sm"
                        >
                            ▶️ Devam
                        </button>
                        <button
                            onClick={handleStop}
                            className="btn btn-danger btn-sm"
                        >
                            ⏹️ Durdur
                        </button>
                    </>
                )}

                {status === 'stopped' && seconds > 0 && (
                    <button
                        onClick={handleReset}
                        className="btn btn-secondary btn-sm"
                    >
                        🔄 Sıfırla
                    </button>
                )}
            </div>

            <div className="timer-status">
                {status === 'running' && <span className="status-badge status-running">⚡ Çalışıyor</span>}
                {status === 'paused' && <span className="status-badge status-paused">⏸️ Duraklatıldı</span>}
                {status === 'stopped' && seconds > 0 && (
                    <span className="status-badge status-stopped">
                        ✅ Tamamlandı ({Math.floor(seconds / 60)} dakika)
                    </span>
                )}
            </div>
        </div>
    )
}
