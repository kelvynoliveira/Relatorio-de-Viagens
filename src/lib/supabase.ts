
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && typeof window !== 'undefined') {
  console.warn('⚠️ [Supabase] Usando URL de fallback. Verifique suas variáveis de ambiente no Vercel!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
