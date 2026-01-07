import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onAuthSuccess }) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })

                if (error) throw error

                if (data.user) {
                    onAuthSuccess(data.user)
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (error) throw error

                if (data.user) {
                    onAuthSuccess(data.user)
                }
            }
        } catch (err) {
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
            minHeight: '100vh'
        }}>
            <div className="card card-glass animate-fade-in" style={{
                maxWidth: '440px',
                width: '100%',
                margin: 'var(--spacing-lg)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1 style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '2.5rem',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        KPSS Asistan
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Akıllı sınav hazırlık platformu
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger animate-slide-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <div className="form-hint">
                            En az 6 karakter
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span>Yükleniyor...</span>
                        ) : (
                            <span>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</span>
                        )}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: 'var(--spacing-lg)',
                    paddingTop: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border-secondary)'
                }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                        {isSignUp ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}
                    </p>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setError(null)
                        }}
                    >
                        {isSignUp ? 'Giriş Yap' : 'Kayıt Ol'}
                    </button>
                </div>
            </div>
        </div>
    )
}
