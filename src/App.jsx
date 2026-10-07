import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import MobileNav from './components/MobileNav.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Albums from './pages/Albums.jsx'
import AlbumDetail from './pages/AlbumDetail.jsx'
import Settings from './pages/Settings.jsx'
import WholeGallery from './pages/WholeGallery.jsx'
import Recognizer from './pages/Recognizer.jsx'

const TITLES = { '/': 'Dashboard', '/albums': 'Albums', '/settings': 'Settings', '/gallery': 'Whole Gallery', '/recognizer': 'Recognizer' }

function Shell({ theme, setTheme, premium, setPremium, skin, setSkin }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const title = TITLES[location.pathname] || (location.pathname.startsWith('/albums/') ? 'Album' : 'Arelsync')

  useEffect(() => setMenuOpen(false), [location.pathname, location.search])

  return (
    <div className="app-shell">
      <div className={'sidebar-backdrop' + (menuOpen ? ' open' : '')} onClick={() => setMenuOpen(false)} />
      <Sidebar open={menuOpen} />
      <div className="main">
        <Topbar onMenu={() => setMenuOpen(o => !o)} title={title} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/albums" element={<Albums />} />
            <Route path="/albums/:id" element={<AlbumDetail />} />
            <Route path="/gallery" element={<WholeGallery />} />
            <Route path="/recognizer" element={<Recognizer />} />
            <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} premium={premium} setPremium={setPremium} skin={skin} setSkin={setSkin} />} />
          </Routes>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

function Gate(props) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Login />
  return (
    <DataProvider>
      <Shell {...props} />
    </DataProvider>
  )
}

export default function App() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('arelse_theme') || 'dark')
  const [premium, setPremiumState] = useState(() => localStorage.getItem('arelse_premium_ui') !== '0')
  const [skin, setSkinState] = useState(() => localStorage.getItem('arelse_ui_skin') || 'default')

  const setTheme = (t) => {
    setThemeState(t)
    localStorage.setItem('arelse_theme', t)
  }
  const setPremium = (on) => {
    setPremiumState(on)
    localStorage.setItem('arelse_premium_ui', on ? '1' : '0')
  }
  const setSkin = (s) => {
    if (s === 'default') {
      const prev = localStorage.getItem('arelse_theme_before_skin')
      if (prev) setTheme(prev)
    } else {
      if (skin === 'default') localStorage.setItem('arelse_theme_before_skin', theme)
      setTheme(s)
    }
    setSkinState(s)
    localStorage.setItem('arelse_ui_skin', s)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.setAttribute('data-ui', premium ? 'premium' : 'standard')
  }, [premium])
  useEffect(() => {
    document.documentElement.setAttribute('data-skin', skin)
  }, [skin])

  return (
    <HashRouter>
      <AuthProvider>
        <Gate theme={theme} setTheme={setTheme} premium={premium} setPremium={setPremium} skin={skin} setSkin={setSkin} />
      </AuthProvider>
    </HashRouter>
  )
}
