import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { base64, filename } = await request.json();

        if (!base64) {
            return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
        }

        // Clean base64 string
        const base64Data = base64.replace(/^data:application\/pdf;filename=.*;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Path to save the file
        const pdfFolder = path.join(process.cwd(), 'public', 'pdf');

        // Ensure folder exists (though we created it, safe to check)
        if (!fs.existsSync(pdfFolder)) {
            fs.mkdirSync(pdfFolder, { recursive: true });
        }

        const filePath = path.join(pdfFolder, filename);

        // Write the file
        fs.writeFileSync(filePath, buffer);

        // Return the public URL
        const publicUrl = `/pdf/${filename}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('Error saving PDF:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
