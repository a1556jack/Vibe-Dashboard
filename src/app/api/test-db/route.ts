import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { count, error } = await supabase.from('raw_data').select('*', { count: 'exact', head: true });
        return NextResponse.json({ count, error });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
