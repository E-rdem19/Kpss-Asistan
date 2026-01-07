import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import ProfileSetup from './components/ProfileSetup'
import Dashboard from './components/Dashboard'
import StudyPlanner from './components/StudyPlanner'
import QuestionTracker from './components/QuestionTracker'
import PerformanceAnalytics from './components/PerformanceAnalytics'
import AdaptivePlanner from './components/AdaptivePlanner'
import MockExamTracker from './components/MockExamTracker'
import SmartStudyPlanGenerator from './components/SmartStudyPlanGenerator'

function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error)
      }

      setProfile(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setCurrentPage('dashboard')
  }

  const handleAuthSuccess = async (user) => {
    setUser(user)
    await fetchProfile(user.id)
  }

  const handleProfileComplete = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2) || 'dashboard' // Remove #/
      setCurrentPage(hash)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo = (page) => {
    window.location.hash = `#/${page}`
  }

  if (loading) {
    return <div className="loading-overlay"><div className="spinner"></div></div>
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  if (!profile) {
    return <ProfileSetup user={user} onComplete={handleProfileComplete} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} profile={profile} />
      case 'planner':
        return <StudyPlanner user={user} />
      case 'tracker':
        return <QuestionTracker user={user} />
      case 'analytics':
        return <PerformanceAnalytics user={user} profile={profile} />
      case 'adaptive':
        return <AdaptivePlanner user={user} profile={profile} />
      case 'mock-exam':
        return <MockExamTracker user={user} />
      case 'smart-planner':
        return <SmartStudyPlanGenerator user={user} profile={profile} />
      default:
        return <Dashboard user={user} profile={profile} />
    }
  }

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-brand">KPSS Asistan</div>
        <ul className="navbar-nav">
          <li>
            <a
              href="#/dashboard"
              className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            >
              🏠 Ana Sayfa
            </a>
          </li>
          <li>
            <a
              href="#/planner"
              className={`nav-link ${currentPage === 'planner' ? 'active' : ''}`}
            >
              📅 Program
            </a>
          </li>
          <li>
            <a
              href="#/tracker"
              className={`nav-link ${currentPage === 'tracker' ? 'active' : ''}`}
            >
              ✏️ Soru Takibi
            </a>
          </li>
          <li>
            <a
              href="#/analytics"
              className={`nav-link ${currentPage === 'analytics' ? 'active' : ''}`}
            >
              📊 Analiz
            </a>
          </li>
          <li>
            <a
              href="#/adaptive"
              className={`nav-link ${currentPage === 'adaptive' ? 'active' : ''}`}
            >
              🤖 Akıllı Plan
            </a>
          </li>
          <li>
            <a
              href="#/mock-exam"
              className={`nav-link ${currentPage === 'mock-exam' ? 'active' : ''}`}
            >
              🎯 Deneme Sınavı
            </a>
          </li>
          <li>
            <a
              href="#/smart-planner"
              className={`nav-link ${currentPage === 'smart-planner' ? 'active' : ''}`}
            >
              🧠 Plan Oluştur
            </a>
          </li>
          <li>
            <button
              onClick={handleSignOut}
              className="btn btn-secondary btn-sm"
            >
              Çıkış
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
