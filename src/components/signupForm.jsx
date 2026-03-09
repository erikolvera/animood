import { useState } from "react"
import { supabase } from "../supabaseClient"

function SignupForm({ goToLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignup = async () => {

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Account created! You can now login.")
      goToLogin()
    }

  }

  return (
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

      <button onClick={handleSignup}>
        Create Account
      </button>

      <br /><br />

      <button
        onClick={() => {
          setEmail("")
          setPassword("")
          goToLogin()
        }}
      >
        Back to Login
      </button>
    </div>
  )
}

export default SignupForm