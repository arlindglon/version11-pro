import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config'
import { v4 as uuidv4 } from 'uuid'

// ✅ সব credentials config.ts থেকে আসছে
// শুধু config.ts ফাইলে পরিবর্তন করলেই সব জায়গায় হয়ে যাবে!
export const supabase = createClient(
  CONFIG.supabase.url, 
  CONFIG.supabase.anonKey
)

// Helper function to generate proper UUID format
export function generateId(): string {
  return uuidv4()
}

// Export as db for compatibility
export const db = supabase
