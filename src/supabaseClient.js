import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wfxxbbocpfzzrsnzykco.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeHhiYm9jcGZ6enJzbnp5a2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDY2MTcsImV4cCI6MjA4ODMyMjYxN30.uuK85372DmfYuZnipbKdqOqnUkvzlbRog8mjLlHpX3c"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)