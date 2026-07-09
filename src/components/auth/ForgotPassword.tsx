"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // The default Supabase email routes through its verify endpoint, then
    // back to /auth/confirm with a PKCE code (plus our `next` param), which
    // exchanges it for a session cookie before showing the reset form.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
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
            Remember your password? <Link href="/signin">Back to login</Link>
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
