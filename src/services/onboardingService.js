import { supabase } from "../supabaseClient";

const MINIMUM_SIGNALS = 20;

export async function getForYouSignalSummary(userId) {
  // 1. fetch user's favorite anime / existing preference records
  // 2. count signals
  // 3. return normalized summary object
}

export async function resetOnboardingData(userId) {
  // later:
  // delete or clear onboarding-only preferences/reactions
}