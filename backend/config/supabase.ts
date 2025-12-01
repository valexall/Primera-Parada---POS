import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://iggjjdxihmpgsdrzczgo.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZ2pqZHhpaG1wZ3NkcnpjemdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDc1MTQsImV4cCI6MjA3ODkyMzUxNH0.cE8mdhzmCSIgvKx2FD5bd9INMIIicVeVGNW9eJUhOmA';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);