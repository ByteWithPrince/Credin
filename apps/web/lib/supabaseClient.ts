import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = envUrl.startsWith('http') ? envUrl : 'https://dummy-project.supabase.co';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAnonKey = (envKey && !envKey.includes('your_')) ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
