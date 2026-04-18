import { supabase } from './src/lib/supabase.js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function test() {
  console.log("Checking raw_data...")
  const { data, error } = await supabase.from('raw_data').select('*').limit(2)
  if (error) console.error("Error:", error)
  else console.log("Data size:", data?.length, "\nSample:", data)
}

test()
