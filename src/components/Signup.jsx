import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

const Signup = () => {
  return (
    <div>
      <form className="max-x-md m-auto pt-24">
        <h2> Sign up today!</h2>
        <p>Already have an account? <Link to="/signin">Sign in!</Link></p>
      </form>
    </div>
  )
}

export default Signup