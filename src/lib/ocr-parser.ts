export interface ParsedReceipt {
  totalAmount?: number;
  date?: string;
  liters?: number;
  pricePerLiter?: number;
  location?: string;
}

export function parseReceiptText(text: string): ParsedReceipt {
  const result: ParsedReceipt = {};
  const lines = text.split('\n');

  // Regex patterns for Portuguese receipts
  const dateRegex = /(\d{2})\/(\d{2})\/(\d{4}|\d{2})/g;
  const timeRegex = /([012]\d):([0-5]\d)(?::([0-5]\d))?/g;
  // Support: TOTAL, VALOR, VALOR A PAGAR, VALOR TOTAL, Valor: R$, etc.
  const currencyRegex = /(?:TOTAL|VALOR|PAGAR|VLR|LIQUIDO)[\s:]*(?:R\$)?[\s]*([\d.,]+)/i;
  const litersRegex = /(?:LITROS|QTDE|UNIT|VOL)[\s:]*([\d.,]+)/i;
  const priceRegex = /(?:PRECO|VALOR UNIT|UNITARIO|P\.U)[\s:]*([\d.,]+)/i;
  const excludeKeywords = ['tributos', 'aproximado', 'lei', 'fed', 'icms', 'contribuinte', 'cpf', 'cnpj'];

  // 1. Initial cleanup: filter lines to find location (usually top lines)
  const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 2);
  if (cleanLines.length > 0) {
    // Look for lines that look like a business name (usually all caps or starting with a known prefix)
    const potentialLocation = cleanLines.slice(0, 4).find(l => 
        l.length > 5 && 
        !l.includes('/') && 
        !l.includes('CPF') && 
        !l.includes('CNPJ') &&
        !l.includes('VALOR') &&
        !/^\d+$/.test(l.replace(/\s/g, ''))
    );
    if (potentialLocation) result.location = potentialLocation;
  }

  // 2. Data extraction from all matches
  const textMatches = Array.from(text.matchAll(dateRegex));
  if (textMatches.length > 0) {
    // Prioritize the LAST date found (often the payment/closure date)
    const lastMatch = textMatches[textMatches.length - 1];
    let year = lastMatch[3];
    if (year.length === 2) year = `20${year}`;
    
    // Find times
    const allTimes = Array.from(text.matchAll(timeRegex));
    let time = "12:00:00";
    if (allTimes.length > 0) {
        // Match time nearest to the date if possible, otherwise use last found
        const lastTime = allTimes[allTimes.length - 1];
        time = `${lastTime[1]}:${lastTime[2]}:${lastTime[3] || '00'}`;
    }
    
    result.date = `${year}-${lastMatch[2]}-${lastMatch[1]}T${time}.000Z`;
  }

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip lines with excluded keywords to avoid picking up tax values or IDs
    if (excludeKeywords.some(kw => lowerLine.includes(kw))) continue;

    // 2. Currency/Total Detection (Explicit Keywords)
    if (!result.totalAmount) {
      const totalMatch = line.match(currencyRegex);
      if (totalMatch) {
        const value = parseNumber(totalMatch[1]);
        if (value > 0.1) result.totalAmount = value; // Avoid tiny values
      }
    }

    // 3. Liters Detection (Fuel specific)
    if (!result.liters) {
      const litersMatch = line.match(litersRegex);
      if (litersMatch) {
        const value = parseNumber(litersMatch[1]);
        if (value > 0) result.liters = value;
      }
    }

    // 4. Price per Liter Detection
    if (!result.pricePerLiter) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        const value = parseNumber(priceMatch[1]);
        if (value > 0) result.pricePerLiter = value;
      }
    }
  }

  // Backup: if no total found by keyword and it's a very short receipt (like PIX)
  // Look for any currency-like pattern at the end
  if (!result.totalAmount) {
    const allNumbers = text.match(/R\$[\s]*([\d.,]+)/gi) || [];
    if (allNumbers.length > 0) {
      const lastValue = parseNumber(allNumbers[allNumbers.length - 1].replace(/R\$/i, '').trim());
      if (lastValue > 0) result.totalAmount = lastValue;
    }
  }

  return result;
}

function parseNumber(str: string): number {
  // Handles 1.234,56 -> 1234.56
  const clean = str.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}
