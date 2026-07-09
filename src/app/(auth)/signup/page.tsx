import type { Metadata } from "next";
import Signup from "@/components/auth/Signup";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignUpPage() {
  return <Signup />;
}
