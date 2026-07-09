import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return <LoginForm />;
}
