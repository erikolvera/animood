import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password"
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
    }
  };

  return (
    <div>
      <form onSubmit={handleReset} className="max-w-md w-full m-auto">
        <h2 className="font-bold pb-2">Reset Password</h2>
        <p className="pb-4">
            Remember your password? <Link to="/signin">Back to login</Link>
        </p>

        <div className="flex flex-col py-4">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border w-full mb-3 p-2 rounded bg-black text-white placeholder-white"
          />

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {message && <p className="text-green-500 text-sm mb-2">{message}</p>}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
          >
            Send Reset Email
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;