import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { base64, filename } = await request.json();

        if (!base64) {
            return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
        }

        // Clean base64 string
        const base64Data = base64.replace(/^data:application\/pdf;filename=.*;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // 1. Try to upload to Supabase Storage (Best for production/Vercel)
        let publicUrl = null;
        try {
            const supabase = await createClient();
            const { data, error } = await supabase.storage
                .from('reports')
                .upload(filename, buffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) throw error;

            if (data) {
                const { data: urlData } = supabase.storage
                    .from('reports')
                    .getPublicUrl(filename);
                publicUrl = urlData.publicUrl;
            }
        } catch (storageError) {
            console.error('Supabase Storage Error:', storageError);
            // Non-blocking error, we still try local saving
        }

        // 2. Try to save locally (Good for local development/debugging)
        try {
            const pdfFolder = path.join(process.cwd(), 'public', 'pdf');
            if (!fs.existsSync(pdfFolder)) {
                fs.mkdirSync(pdfFolder, { recursive: true });
            }
            const filePath = path.join(pdfFolder, filename);
            fs.writeFileSync(filePath, buffer);

            // If Supabase failed, use local URL
            if (!publicUrl) {
                publicUrl = `/pdf/${filename}`;
            }
        } catch (fsError) {
            console.error('Local FS Error:', fsError);
        }

        if (!publicUrl) {
            throw new Error('Failed to save PDF anywhere');
        }

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('Error saving PDF:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
