import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pmrbnwdhchgsbtelnwwu.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcmJud2RoY2hnc2J0ZWxud3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNTIxOTcsImV4cCI6MjEwNjkyODE5N30.X3Gh0tceNTAmr0gwKVlwIgMLc6k2P-ji1y0uDMH3It4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
