import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  console.log("Checking raw_data...")
  const { data, error } = await supabase.from('raw_data').select('*').limit(2)
  if (error) console.error("Error:", error)
  else console.log("Data size:", data?.length, "\nSample year_month:", data?.map(d => d.year_month))
}

test()
