"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import bgImage from "@/assets/signinAnimood2.png";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      alert("Account created! Check your email to confirm.");
    }
  };

  return (
   <div
      className="min-h-screen w-full bg-center bg-cover bg-no-repeat flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="w-full mx-auto flex flex-col items-center"
        >


          {/* Form container */}
          <div className="w-full flex flex-col gap-6 mt-30 text-center mb-3">
            <input
              placeholder="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-full bg-gray-300/90 text-black placeholder-gray-700 outline-none shadow-md"
            />

            <input
              placeholder="Email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-full bg-gray-300/90 text-black placeholder-gray-700 outline-none shadow-md"
            />

            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-full bg-gray-300/90 text-black placeholder-gray-700 outline-none shadow-md"
            />

            <input
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-full bg-gray-300/90 text-black placeholder-gray-700 outline-none shadow-md"
            />

            {error && (
              <p className="text-red-300 text-sm text-center font-medium">
                {error}
              </p>
            )}

            {/* Bottom buttons */}
            <div className="flex gap-15 justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="min-w-[190px] bg-gray-300/90 hover:bg-gray-200 text-black font-semibold py-3 px-6 rounded-full shadow-md transition"
              >
                {loading ? "Registering..." : "Register"}
              </button>

              <Link
                href="/signin"
                className="min-w-[190px] text-center bg-gray-300/90 hover:bg-gray-200 text-black font-semibold py-3 px-6 rounded-full shadow-md transition"
              >
                Sign In
              </Link>
            </div>

            <p>
            Already have an account? <Link href="/signin" className="text-blue-300 hover:underline">Sign in!</Link>
            </p>

          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
