import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjzjctyffodztlkrkphr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqempjdHlmZm9kenRsa3JrcGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODc5NTYsImV4cCI6MjA4NTI2Mzk1Nn0.upnTfCX-PeNCVygLsdJIMJcX6ToCkyYNPH8YR-DjBcE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)