export type ReceiptType = 'fuel' | 'food' | 'toll' | 'pix' | 'retail' | 'unknown';

export interface ParsedReceipt {
  type: ReceiptType;
  totalAmount?: number;
  date?: string;
  liters?: number;
  pricePerLiter?: number;
  location?: string;
  cnpj?: string;
  paymentMethod?: string;
}

/**
 * Main OCR Parser with category-specific logic
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const cleanText = text.toLowerCase();
  const type = detectReceiptType(cleanText);

  switch (type) {
    case 'fuel':
      return parseFuelReceipt(text);
    case 'pix':
      return parsePixReceipt(text);
    default:
      return parseGenericReceipt(text, type);
  }
}

/**
 * Detects the most likely category of the receipt
 */
function detectReceiptType(text: string): ReceiptType {
  if (/gasolina|etanol|diesel|combustivel|posto|litros|volumen/i.test(text)) {
    return 'fuel';
  }
  if (/pix|comprovante de pagamento|transferencia/i.test(text)) {
    return 'pix';
  }
  if (/pedagio|sem parar|conectcar|veloe/i.test(text)) {
    return 'toll';
  }
  if (/restaurante|lanchonete|ifood|burger|pizza|refeicao/i.test(text)) {
    return 'food';
  }
  if (/nfce|nota fiscal|danfe|cupom fiscal/i.test(text)) {
    return 'retail';
  }
  return 'unknown';
}

/**
 * Dedicated parser for fuel receipts (handles liters and calculations)
 */
function parseFuelReceipt(text: string): ParsedReceipt {
  const result: ParsedReceipt = { type: 'fuel' };
  const lines = text.split('\n');

  // Regex specific for common fuel receipt patterns
  const litersRegex = /(\d+[.,]\d+)\s*(l|litros|vol|volumen)/i;
  const pricePerLiterRegex = /(r\$?\s*)?(\d+[.,]\d+)\s*(\/l|por litro|p\.u)/i;
  const totalRegex = /(?:total|valor|pagar|vlr|liquido)[\s:r$]*([\d.,]+)/i;

  for (const line of lines) {
    const cleanLine = line.toLowerCase();
    
    // Avoid picking up tax lines
    if (/(?:tributos|lei|fed|icms|aproximado)/i.test(cleanLine)) continue;

    // 1. Liters (ex: 35,21 L)
    if (!result.liters) {
      const match = line.match(litersRegex);
      if (match) {
        result.liters = parseNumber(match[1]);
      }
    }

    // 2. Price per liter (ex: 5,49 /L)
    if (!result.pricePerLiter) {
      const match = line.match(pricePerLiterRegex);
      if (match) {
        // match[2] if we have a prefix, otherwise check the whole thing
        result.pricePerLiter = parseNumber(match[2] || match[1]);
      }
    }

    // 3. Total
    if (!result.totalAmount) {
      const match = line.match(totalRegex);
      if (match) {
        const val = parseNumber(match[1]);
        if (val > 1) result.totalAmount = val;
      }
    }
  }

  // Intelligence: calculate missing fields if possible
  if (result.totalAmount && result.liters && !result.pricePerLiter) {
    result.pricePerLiter = Number((result.totalAmount / result.liters).toFixed(3));
  }
  if (result.totalAmount && result.pricePerLiter && !result.liters) {
    result.liters = Number((result.totalAmount / result.pricePerLiter).toFixed(2));
  }

  enrichCommonData(result, text);
  return result;
}

/**
 * Dedicated parser for PIX/Bank transfers
 */
function parsePixReceipt(text: string): ParsedReceipt {
  const result: ParsedReceipt = { type: 'pix' };
  
  // PIX usually has the value near the end, or clearly marked with R$
  const valueRegex = /(?:valor|vlr|liquido|r\$)[\s:]*(?:r\$)?[\s]*([\d.,]+)/gi;
  const matches = Array.from(text.matchAll(valueRegex));
  
  if (matches.length > 0) {
    // Get the highest value found (likely the total)
    const values = matches.map(m => parseNumber(m[1])).filter(v => v > 0);
    if (values.length > 0) {
        result.totalAmount = Math.max(...values);
    }
  }

  enrichCommonData(result, text);
  return result;
}

/**
 * Generic fallback parser
 */
function parseGenericReceipt(text: string, type: ReceiptType): ParsedReceipt {
  const result: ParsedReceipt = { type };
  const lines = text.split('\n');
  const totalRegex = /(?:total|valor|pagar|vlr|liquido)[\s:r$]*([\d.,]+)/i;

  for (const line of lines) {
    if (/(?:tributos|lei|fed|icms|aproximado)/i.test(line.toLowerCase())) continue;
    
    if (!result.totalAmount) {
      const match = line.match(totalRegex);
      if (match) {
        const val = parseNumber(match[1]);
        if (val > 0.1) result.totalAmount = val;
      }
    }
  }

  enrichCommonData(result, text);
  return result;
}

/**
 * Extracts shared data like Date, Time, Location and CNPJ
 */
function enrichCommonData(result: ParsedReceipt, text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  
  // 1. Location Detection (Business Name)
  if (!result.location && lines.length > 0) {
    const potential = lines.slice(0, 4).find(l => 
        l.length > 5 && 
        !l.includes('/') && 
        !l.match(/(?:cnpj|cpf|valor|total|pagamento)/i) &&
        !/^\d+$/.test(l.replace(/\s/g, ''))
    );
    if (potential) result.location = potential;
  }

  // 2. CNPJ Detection
  const cnpjMatch = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  if (cnpjMatch) result.cnpj = cnpjMatch[0];

  // 3. Date & Time Detection (Prioritizing last match/payment date)
  const dateRegex = /(\d{2})\/(\d{2})\/(\d{4}|\d{2})/g;
  const timeRegex = /([012]\d):([0-5]\d)(?::([0-5]\d))?/g;
  
  const dateMatches = Array.from(text.matchAll(dateRegex));
  if (dateMatches.length > 0) {
    const lastDate = dateMatches[dateMatches.length - 1];
    let year = lastDate[3];
    if (year.length === 2) year = `20${year}`;
    
    const timeMatches = Array.from(text.matchAll(timeRegex));
    let time = "12:00:00";
    if (timeMatches.length > 0) {
      const lastTime = timeMatches[timeMatches.length - 1];
      time = `${lastTime[1]}:${lastTime[2]}:${lastTime[3] || '00'}`;
    }
    
    result.date = `${year}-${lastDate[2]}-${lastDate[1]}T${time}.000Z`;
  }

  // 4. Payment Method
  const lowerText = text.toLowerCase();
  if (/credito/i.test(lowerText)) result.paymentMethod = 'credit';
  else if (/debito/i.test(lowerText)) result.paymentMethod = 'debit';
  else if (/pix/i.test(lowerText)) result.paymentMethod = 'pix';
  else if (/dinheiro/i.test(lowerText)) result.paymentMethod = 'cash';
}

/**
 * Utility to parse localized numbers (1.234,56 -> 1234.56)
 */
function parseNumber(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}
