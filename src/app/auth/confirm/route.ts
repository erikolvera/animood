import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Exchanges the credential from Supabase auth emails for a cookie session,
// then forwards to `next`. Handles both link formats:
//  - token_hash + type: custom email templates (requires custom SMTP to edit)
//  - code: the default template's {{ .ConfirmationURL }}, which routes through
//    Supabase's verify endpoint and returns a PKCE code. Note the code only
//    exchanges in the same browser that requested the reset (the PKCE
//    verifier lives in its cookies) — the token_hash form has no such limit.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  redirect("/signin");
}
