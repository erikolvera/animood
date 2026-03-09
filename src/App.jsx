import { useState } from 'react'
import { supabase } from './supabaseClient'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginForm from "./components/loginForm"
import SignupForm from "./components/signupForm"
import Dashboard from './Pages/Dashboard'



function App() {

  const [showSignup, setShowSignup] = useState(false)
  const [user, setUser] = useState(null)

  if (user) {
    return <Dashboard logout={() => setUser(null)} />
  }

  return (
    <div>

      <h1>Login System</h1>

      {showSignup ? (
        <SignupForm 
            goToLogin={() => setShowSignup(false)} />
      ) : (
        <LoginForm 
            goToSignup={() => setShowSignup(true)} 
            gotoDashboard={(userData) => setUser(userData)}
        />
      )}

    </div>
  )

}

export default App














/*

function App() {

  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div>

      <h1>Login System</h1>

      {showSignup ? (

        <div>
          <h2>Sign Up</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <br /><br />

          <button>Create Account</button>

          <br /><br />

          <button
            onClick={() => {
              setShowSignup(false)
              setEmail("")
              setPassword("")
            }}
          >
            Back to Login
          </button>
        </div>

      ) : (

        <div>
          <h2>Login</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <br /><br />

          <button>Login</button>

          <br /><br />

          <button
            onClick={() => {
              setShowSignup(true)
              setEmail("")
              setPassword("")
            }}
          >
            Sign Up Instead
          </button>
        </div>

      )}

    </div>
  )
}

export default App

*/
















/*
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
*/