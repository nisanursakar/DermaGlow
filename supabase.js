import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://veywlizcaruqxypcmqek.supabase.co'
const supabaseAnonKey = 'sb_publishable_gC0fJFqTCfl610XaUeIPnQ_CtCOfenH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)