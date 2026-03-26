import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextResponse } from 'next/server';

// Initialize the client
let clientOptions = {};

// For production (like Vercel), we can pass credentials as a string
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    clientOptions = {
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    };
  } catch (e) {
    console.error('Failed to parse GOOGLE_CREDENTIALS_JSON');
  }
}

const client = new ImageAnnotatorClient(clientOptions);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 });
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
