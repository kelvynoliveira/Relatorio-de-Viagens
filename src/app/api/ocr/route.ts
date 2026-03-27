import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextResponse } from 'next/server';
import path from 'path';

// Initialize the client
let clientOptions: any = {};

// 1. Check for JSON string (Vercel/Production)
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    
    // Fix private key if needed (common in Vercel/Env variables)
    if (creds.private_key && typeof creds.private_key === 'string') {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    
    clientOptions.credentials = creds;
    console.log('OCR: Google credentials loaded and formatted from JSON string');
  } catch (e: any) {
    console.error('OCR ERROR: Failed to parse GOOGLE_CREDENTIALS_JSON:', e.message);
  }
} 
// 2. Check for File Path (Local development)
else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('./')) {
    clientOptions.keyFilename = path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  } else {
    clientOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
}

const client = new ImageAnnotatorClient(clientOptions);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 });
    }

    if (!clientOptions.credentials && !clientOptions.keyFilename) {
        return NextResponse.json({ 
            error: 'Configuração Incompleta: Credenciais do Google não encontradas.',
            details: 'Verifique a variável GOOGLE_CREDENTIALS_JSON na Vercel.'
        }, { status: 500 });
    }

    // image is expected to be a base64 string (without the data:image/jpeg;base64, prefix)
    const [result] = await client.textDetection({
      image: { content: image },
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return NextResponse.json({ text: '', details: [] });
    }

    const fullText = detections[0].description;

    return NextResponse.json({ 
      text: fullText,
      // We could add more specific parsing here if needed
    });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar imagem: ' + (error.message || 'Erro desconhecido') }, 
      { status: 500 }
    );
  }
}
