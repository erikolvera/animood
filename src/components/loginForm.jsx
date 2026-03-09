import { useState } from "react"
import { supabase } from "../supabaseClient"

function LoginForm({goToSignup, gotoDashboard}) {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Login successful!")
      gotoDashboard(data.user)
      console.log(data)
    }

  }

  return (
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

      <button onClick={handleLogin}> 
        Login
      </button>

      <br /><br />

      <button
        onClick={() => {
          goToSignup()
          setEmail("")
          setPassword("")
        }}
      >
        Sign Up Instead
      </button>
    </div>
  )
}

export default LoginForm