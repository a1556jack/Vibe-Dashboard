import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('chatbot_knowledge')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const type = formData.get('type') as string;
        
        if (type === 'text_rule') {
            const content = formData.get('content') as string;
            if (!content || content.trim() === '') throw new Error('내용이 비어있습니다.');
            
            const { data, error } = await supabase.from('chatbot_knowledge').insert([{
                type: 'text_rule',
                content: content,
                is_active: true
            }]).select();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data });
            
        } else if (type === 'file_knowledge') {
            const file = formData.get('file') as File;
            if (!file) throw new Error("업로드된 파일이 없습니다.");
            
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            let parsedText = '';
            const fileNameLower = file.name.toLowerCase();
            
            if (fileNameLower.endsWith('.xlsx')) {
                const workbook = xlsx.read(buffer, { type: 'buffer' });
                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const csv = xlsx.utils.sheet_to_csv(sheet);
                    parsedText += `\n--- [Sheet: ${sheetName}] ---\n${csv}\n`;
                }
            } else if (fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.txt')) {
                parsedText = buffer.toString('utf-8');
            } else {
                throw new Error("엑셀(.xlsx), CSV, TXT 형식만 지원합니다.");
            }

            if (parsedText.length > 50000) {
                 // Too large text might break Gemini promptly or use too many tokens. Best effort crop or notify.
                 // Gemini has a large context, 50k chars is fine (approx 20k tokens).
            }

            const { data, error } = await supabase.from('chatbot_knowledge').insert([{
                type: 'file_knowledge',
                title: file.name,
                content: parsedText.trim(),
                file_name: file.name,
                is_active: true
            }]).select();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        
        throw new Error("Invalid type");
        
    } catch (error: any) {
        console.error('AI Training POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error("ID required");

        const { error } = await supabase.from('chatbot_knowledge').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, is_active } = await request.json();
        if (!id) throw new Error("ID required");

        const { error } = await supabase.from('chatbot_knowledge').update({ is_active }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
