import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

import Signup from './components/Signup'
import LoginForm from './components/loginForm'
import Dashboard from './Pages/Dashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-center mb-8">Login System</h1>
      <Routes>
        <Route path="/" element={user ? <Dashboard logout={() => supabase.auth.signOut()} /> : <Navigate to="/signin" />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route path="/signin" element={user ? <Navigate to="/" /> : <LoginForm />} />
      </Routes>
    </div>
  )
}

export default App