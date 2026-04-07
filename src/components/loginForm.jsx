import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Both fields are required");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin} className="max-w-md w-full m-auto">
        <h2 className="font-bold pb-2">Welcome Back!</h2>
        <p>
          Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign up instead</Link>
        </p>
        <div className="flex flex-col py-4">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border w-full mb-3 p-2 rounded bg-black text-white placeholder-white"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border w-full mb-3 p-2 rounded bg-black text-white placeholder-white"
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <p className="pb-4">
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;