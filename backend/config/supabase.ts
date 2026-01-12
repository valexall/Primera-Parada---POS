import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Faltan variables de entorno de Supabase');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, 
        autoRefreshToken: false
    },
    global: {
        headers: {
            'x-client-info': 'primera-parada-bd'
        }
    },
    db: {
        schema: 'public'
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});
